import { Injectable, computed, inject, signal } from '@angular/core';

import { Product } from '../models/product.model';
import { ProductCatalogService } from './product-catalog.service';

@Injectable({
  providedIn: 'root',
})
export class ProductViewerService {
  private readonly catalogService = inject(ProductCatalogService);

  private readonly selectedProductState = signal<Product | null>(null);
  private readonly currentImageIndexState = signal(0);

  readonly selectedProduct = computed(() => this.selectedProductState());
  readonly currentImageIndex = computed(() => this.currentImageIndexState());
  readonly isOpen = computed(() => this.selectedProductState() !== null);
  readonly currentImage = computed(() => {
    const product = this.selectedProductState();
    if (!product) {
      return '';
    }

    const images = this.getSafeImages(product);
    const index = this.currentImageIndexState();
    return images[index] ?? images[0] ?? '';
  });

  constructor() {
    this.catalogService.ensureLoaded();
  }

  open(product: Product): void {
    this.selectedProductState.set(this.normalizeProduct(product));
    this.currentImageIndexState.set(0);
  }

  openById(productId: number): void {
    const product = this.catalogService.findById(productId);
    if (!product) {
      return;
    }

    this.open(product);
  }

  close(): void {
    this.selectedProductState.set(null);
    this.currentImageIndexState.set(0);
  }

  setImage(index: number): void {
    const product = this.selectedProductState();
    const images = this.getSafeImages(product);
    if (!product || index < 0 || index >= images.length) {
      return;
    }

    this.currentImageIndexState.set(index);
  }

  nextImage(): void {
    const product = this.selectedProductState();
    const images = this.getSafeImages(product);
    if (!product || images.length <= 1) {
      return;
    }

    const current = this.currentImageIndexState();
    this.currentImageIndexState.set((current + 1) % images.length);
  }

  prevImage(): void {
    const product = this.selectedProductState();
    const images = this.getSafeImages(product);
    if (!product || images.length <= 1) {
      return;
    }

    const current = this.currentImageIndexState();
    const prev = (current - 1 + images.length) % images.length;
    this.currentImageIndexState.set(prev);
  }

  private normalizeProduct(product: Product): Product {
    const byCatalog = this.catalogService.findById(product.id);
    if (byCatalog) {
      return byCatalog;
    }

    return {
      ...product,
      images: this.getSafeImages(product),
    };
  }

  private getSafeImages(product: Product | null): string[] {
    if (!product) {
      return [];
    }

    if (Array.isArray((product as any).images) && (product as any).images.length > 0) {
      return (product as any).images;
    }

    const legacyImage = (product as any).image;
    if (typeof legacyImage === 'string' && legacyImage.length > 0) {
      return [legacyImage];
    }

    return [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    ];
  }
}
