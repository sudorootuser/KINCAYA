import { Injectable, effect, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { DataTransportService } from '../core/transport/data-transport.service';
import { AdminProduct } from '../interfaces/product.interface';
import { ProductCatalogService } from './product-catalog.service';

const PRODUCTS_STORAGE_KEY = 'kincaya_admin_products_v1';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly catalogService = inject(ProductCatalogService);
  private readonly productsSubject = new BehaviorSubject<AdminProduct[]>(this.readStoredProducts());

  readonly products$: Observable<AdminProduct[]> = this.productsSubject.asObservable();

  constructor(private readonly transport: DataTransportService) {
    effect(() => {
      const current = this.productsSubject.value;
      const catalog = this.catalogService.products();

      if (current.length > 0 || catalog.length === 0) {
        return;
      }

      const seeded = catalog.map((item) => this.fromPublicProduct(item));
      this.productsSubject.next(seeded);
      this.persist(seeded);
    });
  }

  getSnapshot(): AdminProduct[] {
    return this.productsSubject.value;
  }

  create(input: Partial<AdminProduct>): AdminProduct {
    const product = this.toProduct(input);
    const next = [product, ...this.productsSubject.value];

    this.productsSubject.next(next);
    this.persist(next);
    this.transport.enqueue('product.create', product);

    return product;
  }

  update(id: string, patch: Partial<AdminProduct>): void {
    const next = this.productsSubject.value.map((product) => {
      if (product.id !== id) {
        return product;
      }

      const merged: AdminProduct = {
        ...product,
        ...this.normalizePatch(patch),
      };

      return {
        ...merged,
        precio: this.toSafePrice(merged.precio),
        stock: this.toSafeStock(merged.stock),
      };
    });

    this.productsSubject.next(next);
    this.persist(next);
    this.transport.enqueue('product.update', { id, patch });
  }

  toggleActive(id: string): void {
    const found = this.productsSubject.value.find((item) => item.id === id);
    if (!found) {
      return;
    }

    this.update(id, { activo: !found.activo });
  }

  logicalDelete(id: string): void {
    this.update(id, { eliminado: true, activo: false });
  }

  private toProduct(input: Partial<AdminProduct>): AdminProduct {
    const nombre = String(input.nombre ?? '').trim();
    const categoria = String(input.categoria ?? '').trim();

    return {
      id: input.id?.trim() || `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombre: nombre || 'Producto sin nombre',
      descripcion: String(input.descripcion ?? '').trim() || 'Sin descripcion',
      categoria: categoria || 'General',
      precio: this.toSafePrice(Number(input.precio)),
      imagen: String(input.imagen ?? '').trim() || 'assets/placeholders/product-fallback.svg',
      stock: this.toSafeStock(Number(input.stock)),
      activo: input.activo ?? true,
      eliminado: input.eliminado ?? false,
      fechaCreacionIso: input.fechaCreacionIso ?? new Date().toISOString(),
    };
  }

  private normalizePatch(patch: Partial<AdminProduct>): Partial<AdminProduct> {
    return {
      ...patch,
      nombre:
        patch.nombre === undefined
          ? undefined
          : String(patch.nombre).trim() || 'Producto sin nombre',
      categoria:
        patch.categoria === undefined ? undefined : String(patch.categoria).trim() || 'General',
      descripcion: patch.descripcion === undefined ? undefined : String(patch.descripcion).trim(),
      imagen: patch.imagen === undefined ? undefined : String(patch.imagen).trim(),
    };
  }

  private fromPublicProduct(product: {
    id: number;
    name: string;
    description: string;
    category: string;
    price: number;
    stock?: number;
    images: string[];
  }): AdminProduct {
    return {
      id: `legacy-${product.id}`,
      nombre: product.name,
      descripcion: product.description,
      categoria: product.category,
      precio: this.toSafePrice(product.price),
      imagen: product.images?.[0] ?? 'assets/placeholders/product-fallback.svg',
      stock: this.toSafeStock(product.stock ?? 0),
      activo: true,
      eliminado: false,
      fechaCreacionIso: new Date().toISOString(),
    };
  }

  private toSafePrice(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Number(value.toFixed(2)));
  }

  private toSafeStock(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.floor(value));
  }

  private readStoredProducts(): AdminProduct[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as AdminProduct[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(products: AdminProduct[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }
}
