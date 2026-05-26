import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Product } from '../models/product.model';

interface ProductCatalogResponse {
  products: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly http = inject(HttpClient);

  private readonly productsState = signal<Product[]>([]);
  private readonly loadedState = signal(false);
  private readonly loadingState = signal(false);

  readonly products = computed(() => this.productsState());
  readonly loaded = computed(() => this.loadedState());
  readonly featuredProducts = computed(() =>
    this.productsState().filter((product) => product.featured),
  );
  readonly categories = computed(() => [
    'Todos',
    ...new Set(this.productsState().map((product) => product.category)),
  ]);

  constructor() {
    this.ensureLoaded();
  }

  ensureLoaded(): void {
    if (this.loadedState() || this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    this.http.get<ProductCatalogResponse>('assets/data/products.json').subscribe({
      next: (response) => {
        const normalized = Array.isArray(response?.products) ? response.products : [];
        this.productsState.set(normalized);
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
      error: () => {
        this.productsState.set([]);
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
    });
  }

  findById(productId: number): Product | undefined {
    return this.productsState().find((item) => item.id === productId);
  }
}
