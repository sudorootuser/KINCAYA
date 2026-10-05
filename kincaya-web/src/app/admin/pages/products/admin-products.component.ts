import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminProduct } from '../../../interfaces/product.interface';
import { ProductService } from '../../../services/product.service';
import { StoreSettingsService } from '../../../services/store-settings.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header>
        <div>
          <h1>Productos</h1>
          <p>{{ visibleProducts().length }} productos activos</p>
        </div>
        <button type="button" class="new-btn" (click)="openNewProduct()">+ Nuevo producto</button>
      </header>

      @if (selectedIds().length > 0) {
      <article class="bulk-bar">
        <span class="bulk-count">{{ selectedIds().length }} producto(s) seleccionado(s)</span>
        <div class="bulk-actions">
          <label class="bulk-field">
            <span>Descuento %</span>
            <input type="number" class="bulk-input" placeholder="Ej: 15" min="0" max="100"
              [value]="bulkDiscount()" (input)="bulkDiscount.set(+$any($event.target).value)" />
          </label>
          <button type="button" class="bulk-apply" (click)="applyBulkDiscount()">Aplicar a seleccionados</button>
          <button type="button" class="ghost small" (click)="clearSelection()">Cancelar</button>
        </div>
      </article>
      }

      <div class="table-wrap">
        <table class="product-table">
          <thead>
            <tr>
              <th class="col-check"><input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected()" /></th>
              <th class="col-img"></th>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Precio</th>
              <th>Desc.</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (product of visibleProducts(); track product.id) {
            <tr [class.selected]="selectedIds().includes(product.id)">
              <td class="col-check">
                <input type="checkbox" [checked]="selectedIds().includes(product.id)"
                  (change)="toggleSelection(product.id)" />
              </td>
              <td class="col-img">
                <img [src]="product.imagenes[0] || product.imagen" [alt]="product.nombre" />
              </td>
              <td class="col-name">{{ product.nombre }}</td>
              <td class="col-cat">{{ product.categoria }}</td>
              <td class="col-price">{{ formatPrice(product.precio) }}</td>
              <td class="col-disc">
                @if (product.descuento > 0) {
                <span class="disc-badge">-{{ product.descuento }}%</span>
                } @else {
                <span class="disc-none">—</span>
                }
              </td>
              <td class="col-stock">{{ product.stock }}</td>
              <td class="col-status">
                <span class="status-dot" [class.active]="product.activo" [class.inactive]="!product.activo"></span>
                {{ product.activo ? 'Activo' : 'Inactivo' }}
              </td>
              <td class="col-actions">
                <button type="button" class="icon-btn" (click)="edit(product)" title="Editar">&#9998;</button>
                <button type="button" class="icon-btn danger" (click)="confirmRemove(product)" title="Eliminar">&#10005;</button>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>

      @if (modalOpen()) {
      <div class="modal-overlay" (click)="closeModal()">
        <section class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Editar producto' : 'Nuevo producto' }}</h2>
            <button type="button" class="close-btn" (click)="closeModal()">&times;</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="save()" class="modal-body">
            <div class="field-row">
              <label class="field">
                <span>Nombre</span>
                <input formControlName="nombre" placeholder="Ej: Camara WiFi 360" />
              </label>
              <label class="field">
                <span>Categoria</span>
                <select formControlName="categoria">
                  <option value="" disabled>Selecciona...</option>
                  @for (cat of availableCategories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="field-row three">
              <label class="field">
                <span>Precio</span>
                <input formControlName="precio" type="number" min="0" step="1" placeholder="719900" />
              </label>
              <label class="field">
                <span>Descuento %</span>
                <input formControlName="descuento" type="number" min="0" max="100" placeholder="0" />
              </label>
              <label class="field">
                <span>Stock</span>
                <input formControlName="stock" type="number" min="0" step="1" placeholder="10" />
              </label>
            </div>

            <div class="field">
              <span>Imagenes</span>
              <div formArrayName="imagenes" class="images-list">
                @for (img of imagenesArray.controls; track $index; let i = $index) {
                <div class="image-row">
                  <input [formControlName]="i" placeholder="https://... o ruta de imagen" />
                  @if (imagenesArray.controls.length > 1) {
                  <button type="button" class="remove-img" (click)="removeImage(i)">&times;</button>
                  }
                </div>
                }
              </div>
              <button type="button" class="add-img-btn" (click)="addImage()">+ Agregar imagen</button>
            </div>

            <label class="field">
              <span>Descripcion</span>
              <textarea formControlName="descripcion" rows="3" placeholder="Describe el producto..."></textarea>
            </label>

            <div class="modal-footer">
              <button type="button" class="ghost" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="save-btn" [disabled]="form.invalid">
                {{ editingId() ? 'Actualizar' : 'Crear producto' }}
              </button>
            </div>
          </form>
        </section>
      </div>
      }

      @if (pendingDelete()) {
      <div class="modal-overlay" (click)="cancelDelete()">
        <article class="confirm-dialog" (click)="$event.stopPropagation()">
          <h3>¿Eliminar producto?</h3>
          <p>"{{ pendingDelete()?.nombre }}" se marcara como eliminado.</p>
          <div class="confirm-actions">
            <button type="button" class="ghost" (click)="cancelDelete()">Cancelar</button>
            <button type="button" class="danger" (click)="executeDelete()">Eliminar</button>
          </div>
        </article>
      </div>
      }
    </section>
  `,
  styles: [
    `
      .page { display: grid; gap: 12px; }
      header { display: flex; justify-content: space-between; align-items: center; }
      h1 { margin: 0; color: #0f1d36; font-size: 1.3rem; }
      header p { margin: 2px 0 0; color: #61718b; font-size: 0.82rem; }
      .new-btn { background: linear-gradient(145deg, #49add9, #2f8fba); color: #fff; border: 0; border-radius: 10px; padding: 9px 16px; font-weight: 700; cursor: pointer; font-size: 0.88rem; }

      .bulk-bar { background: #eef4ff; border: 1px solid #b8ccec; border-radius: 10px; padding: 0.6rem 0.9rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
      .bulk-count { font-weight: 700; color: #1b4d8a; font-size: 0.85rem; }
      .bulk-actions { display: flex; align-items: flex-end; gap: 0.4rem; flex-wrap: wrap; }
      .bulk-field { display: grid; gap: 0.15rem; }
      .bulk-field span { font-size: 0.72rem; font-weight: 700; color: #2b5f8a; text-transform: uppercase; letter-spacing: 0.03em; }
      .bulk-input { width: 5.5rem; border: 1px solid #b8ccec; border-radius: 8px; padding: 0.4rem 0.5rem; font-size: 0.85rem; }
      .bulk-apply { background: #1b4d8a; color: #fff; border: 0; border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.82rem; cursor: pointer; font-weight: 700; }
      button.ghost { background: #e9eef8; color: #263a5c; border: 0; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; font-size: 0.82rem; }
      button.ghost.small { font-size: 0.78rem; }
      button.danger { background: #a3283c; color: #fff; border: 0; border-radius: 8px; padding: 0.35rem 0.65rem; cursor: pointer; font-size: 0.82rem; }

      .table-wrap { overflow-x: auto; border: 1px solid #dbe3ef; border-radius: 12px; background: #fff; }
      .product-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
      .product-table th { text-align: left; padding: 10px 12px; background: #f5f8fc; color: #4a5568; font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e8eef5; white-space: nowrap; }
      .product-table td { padding: 8px 12px; border-bottom: 1px solid #f0f4f8; vertical-align: middle; }
      .product-table tr:last-child td { border-bottom: 0; }
      .product-table tr.selected { background: rgb(59 155 198 / 5%); }
      .col-check { width: 2.5rem; text-align: center; }
      .col-img { width: 3.2rem; }
      .col-img img { width: 2.6rem; height: 2.6rem; border-radius: 6px; object-fit: cover; }
      .col-name { font-weight: 600; color: #1a202c; max-width: 14rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .col-cat { color: #3b9bc6; font-size: 0.8rem; font-weight: 600; }
      .col-price { font-weight: 700; color: #0f2a3f; white-space: nowrap; }
      .col-disc { text-align: center; }
      .disc-badge { background: #dc2626; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 999px; }
      .disc-none { color: #cbd5e0; }
      .col-stock { text-align: center; }
      .col-status { white-space: nowrap; }
      .status-dot { display: inline-block; width: 0.45rem; height: 0.45rem; border-radius: 50%; margin-right: 0.3rem; }
      .status-dot.active { background: #22c55e; }
      .status-dot.inactive { background: #94a3b8; }
      .col-actions { white-space: nowrap; }
      .icon-btn { background: transparent; border: 1px solid #dbe3ef; border-radius: 6px; width: 1.8rem; height: 1.8rem; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #4a5568; font-size: 0.9rem; padding: 0; margin-left: 4px; transition: all 150ms ease; }
      .icon-btn:hover { border-color: #3b9bc6; color: #1b4d8a; }
      .icon-btn.danger:hover { border-color: #dc2626; color: #dc2626; }

      .modal-overlay { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; background: rgba(0,0,0,0.45); padding: 1rem; }
      .modal-panel { background: #fff; border-radius: 16px; width: min(40rem, 100%); max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 60px rgba(0,0,0,0.2); }
      .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.2rem; border-bottom: 1px solid #e8eef5; }
      .modal-header h2 { margin: 0; font-size: 1.1rem; color: #0f1d36; }
      .close-btn { background: transparent; border: 0; font-size: 1.5rem; color: #61718b; cursor: pointer; padding: 0; line-height: 1; }
      .modal-body { padding: 1.2rem; display: grid; gap: 0.8rem; }
      .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
      .field-row.three { grid-template-columns: 1fr 1fr 1fr; }
      .field { display: grid; gap: 0.25rem; }
      .field span { font-weight: 600; font-size: 0.82rem; color: #22314a; }
      .field input, .field select, .field textarea { border: 1px solid #cfdae8; border-radius: 8px; padding: 8px 10px; font-size: 0.88rem; color: #1a202c; }
      .field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid rgb(59 155 198 / 25%); border-color: #3b9bc6; }
      .images-list { display: grid; gap: 0.3rem; }
      .image-row { display: flex; gap: 0.25rem; }
      .image-row input { flex: 1; }
      .remove-img { width: 1.7rem; height: 1.7rem; border-radius: 50%; border: 0; background: #fee2e2; color: #991b1b; font-size: 1rem; cursor: pointer; display: grid; place-items: center; flex-shrink: 0; }
      .add-img-btn { background: #eef4ff; color: #1b4d8a; border: 0; font-weight: 600; font-size: 0.8rem; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer; justify-self: start; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.6rem; border-top: 1px solid #eef2f8; margin-top: 0.3rem; }
      .modal-footer .ghost { background: #e9eef8; color: #263a5c; border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer; font-weight: 600; font-size: 0.88rem; }
      .modal-footer .save-btn { background: linear-gradient(145deg, #49add9, #2f8fba); color: #ffffff !important; border: 0; border-radius: 8px; padding: 10px 20px; font-weight: 700; cursor: pointer; font-size: 0.9rem; display: inline-block; text-align: center; min-width: 8rem; }
      .modal-footer .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .confirm-dialog { background: #fff; border-radius: 14px; padding: 20px; width: min(24rem, 100%); box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
      .confirm-dialog h3 { margin: 0 0 0.3rem; color: #0f1d36; }
      .confirm-dialog p { margin: 0 0 1rem; color: #61718b; font-size: 0.88rem; }
      .confirm-actions { display: flex; justify-content: flex-end; gap: 0.4rem; }

      @media (max-width: 900px) { .field-row.three { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 700px) { .field-row, .field-row.three { grid-template-columns: 1fr; } .col-cat, .col-status { display: none; } }
    `,
  ],
})
export class AdminProductsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly storeSettings = inject(StoreSettingsService);

  readonly products = signal<AdminProduct[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly pendingDelete = signal<AdminProduct | null>(null);
  readonly selectedIds = signal<string[]>([]);
  readonly bulkDiscount = signal(0);
  protected readonly modalOpen = signal(false);

  readonly availableCategories = [
    'Camaras', 'Seguridad', 'Audio', 'Computo',
    'Wearables', 'Hogar Inteligente', 'Accesorios',
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.minLength(4)]],
    categoria: ['', [Validators.required]],
    precio: [0, [Validators.required, Validators.min(0)]],
    descuento: [0, [Validators.min(0), Validators.max(100)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imagen: ['assets/placeholders/product-fallback.svg', [Validators.required]],
    imagenes: this.fb.array([this.fb.control('assets/placeholders/product-fallback.svg')]),
  });

  get imagenesArray(): FormArray {
    return this.form.get('imagenes') as FormArray;
  }

  readonly allSelected = signal(false);

  constructor() {
    this.productService.products$.subscribe((rows) => this.products.set(rows));
  }

  visibleProducts(): AdminProduct[] {
    return this.products().filter((item) => !item.eliminado);
  }

  formatPrice(price: number): string {
    return this.storeSettings.formatPrice(price);
  }

  openNewProduct(): void {
    this.resetForm();
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.resetForm();
  }

  addImage(): void {
    this.imagenesArray.push(this.fb.control(''));
  }

  removeImage(index: number): void {
    if (this.imagenesArray.length > 1) {
      this.imagenesArray.removeAt(index);
    }
  }

  toggleSelection(id: string): void {
    this.selectedIds.update((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds.set(this.visibleProducts().map((p) => p.id));
    } else {
      this.selectedIds.set([]);
    }
  }

  clearSelection(): void {
    this.selectedIds.set([]);
    this.bulkDiscount.set(0);
  }

  applyBulkDiscount(): void {
    const ids = this.selectedIds();
    const discount = this.bulkDiscount();
    if (ids.length === 0 || discount <= 0) return;
    this.productService.applyBulkDiscount(ids, discount);
    this.clearSelection();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const value = this.form.getRawValue();
    const imagenes: string[] = value.imagenes.filter((url): url is string => !!url?.trim());

    const payload: Partial<AdminProduct> = {
      nombre: value.nombre,
      descripcion: value.descripcion,
      categoria: value.categoria,
      precio: value.precio,
      descuento: value.descuento,
      stock: value.stock,
      imagen: imagenes[0] || value.imagen,
      imagenes,
    };

    if (this.editingId()) {
      this.productService.update(this.editingId()!, payload);
    } else {
      this.productService.create(payload);
    }
    this.closeModal();
  }

  edit(product: AdminProduct): void {
    this.editingId.set(product.id);
    const imgs = product.imagenes?.length ? product.imagenes : [product.imagen];

    this.form.patchValue({
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoria: product.categoria,
      precio: product.precio,
      descuento: product.descuento ?? 0,
      stock: product.stock,
      imagen: imgs[0],
    });

    this.imagenesArray.clear();
    imgs.forEach((url) => this.imagenesArray.push(this.fb.control(url)));
    this.modalOpen.set(true);
  }

  toggle(product: AdminProduct): void {
    this.productService.toggleActive(product.id);
  }

  confirmRemove(product: AdminProduct): void {
    this.pendingDelete.set(product);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  executeDelete(): void {
    const product = this.pendingDelete();
    if (product) this.productService.logicalDelete(product.id);
    this.pendingDelete.set(null);
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre: '', descripcion: '', categoria: '',
      precio: 0, descuento: 0, stock: 0,
      imagen: 'assets/placeholders/product-fallback.svg',
    });
    this.imagenesArray.clear();
    this.imagenesArray.push(this.fb.control('assets/placeholders/product-fallback.svg'));
  }
}
