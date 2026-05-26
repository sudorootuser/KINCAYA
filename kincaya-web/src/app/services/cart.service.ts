import { Injectable, computed, inject, signal } from '@angular/core';

import { CartItem, Product } from '../models/product.model';
import { ProductCatalogService } from './product-catalog.service';

const STORAGE_KEY = 'kincaya_cart_v1';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly catalogService = inject(ProductCatalogService);

  private readonly itemsState = signal<CartItem[]>(this.readStoredItems());
  private readonly addTickState = signal(0);

  readonly items = computed(() => this.itemsState());
  readonly addTick = computed(() => this.addTickState());
  readonly totalItems = computed(() =>
    this.itemsState().reduce((acc, item) => acc + item.quantity, 0),
  );
  readonly totalPrice = computed(() =>
    this.itemsState().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
  );

  constructor() {
    this.catalogService.ensureLoaded();
  }

  add(product: Product): void {
    const current = this.itemsState();
    const found = current.find((item) => item.product.id === product.id);

    if (found) {
      this.itemsState.set(
        current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
      this.persist();
      this.addTickState.update((value) => value + 1);
      return;
    }

    this.itemsState.set([...current, { product, quantity: 1 }]);
    this.persist();
    this.addTickState.update((value) => value + 1);
  }

  increase(productId: number): void {
    this.itemsState.set(
      this.itemsState().map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
    this.persist();
  }

  decrease(productId: number): void {
    this.itemsState.set(
      this.itemsState()
        .map((item) =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
    this.persist();
  }

  clear(): void {
    this.itemsState.set([]);
    this.persist();
  }

  private readStoredItems(): CartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => {
          const normalizedProduct = this.normalizeProduct(item.product as any);
          const quantity = Number.isFinite(item.quantity) ? Math.max(1, item.quantity) : 1;

          if (!normalizedProduct) {
            return null;
          }

          return {
            product: normalizedProduct,
            quantity,
          } as CartItem;
        })
        .filter((item): item is CartItem => item !== null);
    } catch {
      return [];
    }
  }

  private normalizeProduct(product: any): Product | null {
    if (!product || typeof product !== 'object') {
      return null;
    }

    const byCatalog = this.catalogService.findById(product.id);
    if (byCatalog) {
      return byCatalog;
    }

    const fallbackImage =
      typeof product.image === 'string' && product.image.length > 0
        ? product.image
        : 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80';

    const images =
      Array.isArray(product.images) && product.images.length > 0 ? product.images : [fallbackImage];

    return {
      id: Number(product.id) || Date.now(),
      name: String(product.name ?? 'Producto'),
      category: String(product.category ?? 'General'),
      price: Number(product.price) || 0,
      images,
      description: String(product.description ?? 'Sin descripcion'),
    };
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsState()));
  }
}
