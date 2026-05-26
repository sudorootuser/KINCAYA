import { Injectable, computed, inject, signal } from '@angular/core';

import { Product } from '../models/product.model';
import { PRODUCT_REPOSITORY } from '../repositories/product.repository';

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly repository = inject(PRODUCT_REPOSITORY);

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
    this.repository.getProducts().subscribe({
      next: (products) => {
        const normalized = Array.isArray(products) ? products : [];
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
