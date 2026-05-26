import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminProduct } from '../../../interfaces/product.interface';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header>
        <h1>Productos</h1>
        <p>CRUD basico para activar, editar y gestionar catalogo.</p>
      </header>

      <article class="panel">
        <h2>{{ editingId() ? 'Editar producto' : 'Nuevo producto' }}</h2>

        <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
          <input formControlName="nombre" placeholder="Nombre" />
          <input formControlName="categoria" placeholder="Categoria" />
          <input formControlName="precio" type="number" min="0" step="0.01" placeholder="Precio" />
          <input formControlName="stock" type="number" min="0" step="1" placeholder="Stock" />
          <input formControlName="imagen" placeholder="URL o path de imagen" class="full" />
          <textarea
            formControlName="descripcion"
            rows="3"
            class="full"
            placeholder="Descripcion"
          ></textarea>

          <div class="actions full">
            <button type="submit" [disabled]="form.invalid">
              {{ editingId() ? 'Actualizar' : 'Crear' }}
            </button>
            <button type="button" class="ghost" *ngIf="editingId()" (click)="resetForm()">
              Cancelar
            </button>
          </div>
        </form>
      </article>

      <section class="grid">
        <article class="card" *ngFor="let product of visibleProducts()">
          <img [src]="product.imagen" [alt]="product.nombre" />
          <div class="body">
            <h3>{{ product.nombre }}</h3>
            <p>{{ product.categoria }}</p>
            <p class="meta">Stock: {{ product.stock }} · {{ '$' + product.precio.toFixed(2) }}</p>
            <p class="state" [class.inactive]="!product.activo || product.eliminado">
              {{ product.eliminado ? 'Eliminado logico' : product.activo ? 'Activo' : 'Inactivo' }}
            </p>
          </div>

          <div class="actions">
            <button type="button" (click)="edit(product)">Editar</button>
            <button type="button" class="ghost" (click)="toggle(product)">
              {{ product.activo ? 'Desactivar' : 'Activar' }}
            </button>
            <button type="button" class="danger" (click)="remove(product)">Eliminar logico</button>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 14px;
      }

      .panel {
        background: #fff;
        border: 1px solid #dbe3ef;
        border-radius: 14px;
        padding: 14px;
      }

      .panel h2 {
        margin: 0 0 10px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .full {
        grid-column: 1 / -1;
      }

      input,
      textarea {
        border: 1px solid #cfdae8;
        border-radius: 10px;
        padding: 9px 10px;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      button {
        background: #1b4d8a;
        color: #fff;
        border: none;
        border-radius: 10px;
        padding: 9px 12px;
        cursor: pointer;
      }

      button.ghost {
        background: #e9eef8;
        color: #263a5c;
      }

      button.danger {
        background: #a3283c;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .card {
        border: 1px solid #dbe3ef;
        border-radius: 14px;
        overflow: hidden;
        background: #fff;
        display: grid;
      }

      .card img {
        width: 100%;
        height: 150px;
        object-fit: cover;
      }

      .body {
        padding: 10px;
      }

      .body h3 {
        margin: 0;
      }

      .body p {
        margin: 6px 0 0;
      }

      .meta {
        color: #556884;
      }

      .state {
        color: #0f6a49;
        font-weight: 600;
      }

      .state.inactive {
        color: #a3283c;
      }

      .card .actions {
        padding: 10px;
        border-top: 1px solid #eef2f8;
        display: flex;
        flex-wrap: wrap;
      }

      @media (max-width: 1100px) {
        .grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 700px) {
        .form-grid,
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminProductsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);

  readonly products = signal<AdminProduct[]>([]);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.required, Validators.minLength(4)]],
    categoria: ['', [Validators.required, Validators.minLength(2)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    imagen: ['assets/placeholders/product-fallback.svg', [Validators.required]],
    stock: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.productService.products$.subscribe((rows) => this.products.set(rows));
  }

  visibleProducts(): AdminProduct[] {
    return this.products().filter((item) => !item.eliminado);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (this.editingId()) {
      this.productService.update(this.editingId()!, value);
      this.resetForm();
      return;
    }

    this.productService.create(value);
    this.resetForm();
  }

  edit(product: AdminProduct): void {
    this.editingId.set(product.id);
    this.form.patchValue({
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoria: product.categoria,
      precio: product.precio,
      imagen: product.imagen,
      stock: product.stock,
    });
  }

  toggle(product: AdminProduct): void {
    this.productService.toggleActive(product.id);
  }

  remove(product: AdminProduct): void {
    this.productService.logicalDelete(product.id);
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      nombre: '',
      descripcion: '',
      categoria: '',
      precio: 0,
      imagen: 'assets/placeholders/product-fallback.svg',
      stock: 0,
    });
  }
}
