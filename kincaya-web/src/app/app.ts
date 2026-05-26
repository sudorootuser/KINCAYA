import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CartItem, Product } from './models/product.model';
import { CartService } from './services/cart.service';
import { ProductCatalogService } from './services/product-catalog.service';
import { ProductViewerService } from './services/product-viewer.service';
import { UxMetricsService } from './services/ux-metrics.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly storeName = 'Kincaya';
  protected readonly phoneNumber = '593999999999';
  protected readonly logoWordmarkPath = 'assets/logos/LOGOS_Logo-tecno-full-color.svg';
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';

  protected readonly cartOpen = signal(false);
  protected readonly cartPulse = signal(false);

  private readonly cartService = inject(CartService);
  private readonly viewer = inject(ProductViewerService);
  private readonly metricsService = inject(UxMetricsService);
  private readonly catalogService = inject(ProductCatalogService);

  protected readonly products = this.catalogService.products;

  protected readonly cartItems = this.cartService.items;
  protected readonly cartCount = this.cartService.totalItems;
  protected readonly cartTotal = this.cartService.totalPrice;
  protected readonly viewerProduct = this.viewer.selectedProduct;
  protected readonly viewerImage = this.viewer.currentImage;
  protected readonly viewerImageIndex = this.viewer.currentImageIndex;
  protected readonly suggestedProducts = computed(() => {
    const inCart = new Set(this.cartItems().map((item) => item.product.id));
    return this.products()
      .filter((product) => !inCart.has(product.id))
      .slice(0, 3);
  });
  protected readonly shippingCost = computed(() => (this.cartTotal() >= 150 ? 0 : 4.99));
  protected readonly grandTotal = computed(() => this.cartTotal() + this.shippingCost());
  protected readonly freeShippingProgress = computed(() => {
    const total = this.cartTotal();
    return Math.min(100, (total / 150) * 100);
  });

  constructor() {
    this.catalogService.ensureLoaded();

    effect(() => {
      const tick = this.cartService.addTick();
      if (tick > 0) {
        this.triggerCartPulse();
        this.playAddSound();
      }
    });
  }

  protected increase(item: CartItem): void {
    this.cartService.increase(item.product.id);
  }

  protected decrease(item: CartItem): void {
    this.cartService.decrease(item.product.id);
  }

  protected clearCart(): void {
    this.cartService.clear();
  }

  protected openCart(): void {
    this.cartOpen.set(true);
  }

  protected closeCart(): void {
    this.cartOpen.set(false);
  }

  protected sendToWhatsApp(): void {
    const items = this.cartItems();
    if (!items.length || typeof window === 'undefined') {
      return;
    }

    const lines = items.map(
      (item) =>
        `- ${item.product.name} x${item.quantity} = $${(item.product.price * item.quantity).toFixed(2)}`,
    );

    const message = [
      'Hola Kincaya, quiero comprar estos productos:',
      ...lines,
      `Total: $${this.cartTotal().toFixed(2)}`,
      '',
      'Por favor confirmar disponibilidad y envio. Gracias.',
    ].join('\n');

    const url = `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(message)}`;
    this.metricsService.trackCheckoutIntent();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected addSuggestedProduct(product: Product): void {
    this.cartService.add(product);
  }

  protected shippingEstimate(): string {
    return this.cartTotal() >= 120 ? '24-48 horas' : '48-72 horas';
  }

  protected freeShippingHint(): string {
    const total = this.cartTotal();
    if (total >= 150) {
      return 'Envio gratis activado';
    }

    return `Te faltan ${this.formatPrice(150 - total)} para envio gratis`;
  }

  protected openProductFromCart(item: CartItem): void {
    this.viewer.openById(item.product.id);
  }

  protected closeProductModal(): void {
    this.viewer.close();
  }

  protected setModalImage(index: number): void {
    this.viewer.setImage(index);
  }

  protected nextModalImage(): void {
    this.viewer.nextImage();
  }

  protected prevModalImage(): void {
    this.viewer.prevImage();
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
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

  protected getCartItemImage(item: CartItem): string {
    const byCatalog = this.catalogService.findById(item.product.id);
    if (byCatalog?.images?.length) {
      return byCatalog.images[0];
    }

    const legacyImage = (item.product as any).image;
    return item.product.images?.[0] ?? legacyImage ?? this.getFallbackImage();
  }

  protected getProductImages(product: any): string[] {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images;
    }

    if (typeof product?.image === 'string' && product.image.length > 0) {
      return [product.image];
    }

    return [this.getFallbackImage()];
  }

  private triggerCartPulse(): void {
    this.cartPulse.set(true);
    setTimeout(() => this.cartPulse.set(false), 420);
  }

  private playAddSound(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 620;

      gainNode.gain.value = 0.001;
      gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.12);
    } catch {
      // Ignore browser audio restrictions silently.
    }
  }

  private getFallbackImage(): string {
    return this.fallbackImagePath;
  }
}
