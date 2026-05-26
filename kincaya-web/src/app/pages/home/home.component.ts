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
  protected readonly recentlyAddedId = signal<number | null>(null);

  private readonly cartService = inject(CartService);
  private readonly viewer = inject(ProductViewerService);

  protected readonly featuredProducts = PRODUCTS.filter((product) => product.featured);
  protected readonly filteredProducts = computed(() => {
    const category = this.activeCategory();
    if (category === 'Todos') {
      return this.products;
    }

    return this.products.filter((product) => product.category === category);
  });

  protected selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  protected addToCart(product: Product): void {
    this.cartService.add(product);
    this.recentlyAddedId.set(product.id);
    setTimeout(() => this.recentlyAddedId.set(null), 420);
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
