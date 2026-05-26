import { Component, computed, inject, signal } from '@angular/core';

import { PRODUCTS } from '../../data/products.data';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductViewerService } from '../../services/product-viewer.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  protected readonly products = PRODUCTS;
  protected readonly categories = [
    'Todos',
    ...new Set(PRODUCTS.map((product) => product.category)),
  ];
  protected readonly activeCategory = signal('Todos');
  protected readonly searchTerm = signal('');
  protected readonly recentlyAddedId = signal<number | null>(null);
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';

  private readonly cartService = inject(CartService);
  private readonly viewer = inject(ProductViewerService);

  protected readonly featuredProducts = PRODUCTS.filter((product) => product.featured);
  protected readonly filteredProducts = computed(() => {
    const category = this.activeCategory();
    const query = this.searchTerm().trim().toLowerCase();

    let filtered = this.products;
    if (category !== 'Todos') {
      filtered = filtered.filter((product) => product.category === category);
    }

    if (!query) {
      return filtered;
    }

    return filtered.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(query);
    });
  });

  protected selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  protected addToCart(product: Product): void {
    this.cartService.add(product);
    this.recentlyAddedId.set(product.id);
    setTimeout(() => this.recentlyAddedId.set(null), 420);
  }

  protected updateSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected applyImageFallback(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }

    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackImagePath;
    image.classList.add('is-fallback-image');
  }

  protected openProduct(product: Product): void {
    this.viewer.open(product);
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}
