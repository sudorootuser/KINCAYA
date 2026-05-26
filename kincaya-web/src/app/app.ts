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
  private static readonly DEFAULT_PRODUCT_STOCK = 8;

  protected readonly storeName = 'Kincaya';
  protected readonly phoneNumber = '573227405024';
  protected readonly logoWordmarkPath = 'assets/logos/LOGOS_Logo-tecno-full-color.svg';
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';

  protected readonly cartOpen = signal(false);
  protected readonly cartPulse = signal(false);
  protected readonly cartSummaryExpanded = signal(false);
  protected readonly cartClearConfirmOpen = signal(false);
  protected readonly relatedSuggestionsModalOpen = signal(false);
  protected readonly relatedSuggestionIndex = signal(0);
  protected readonly cartSuggestionStartIndex = signal(0);
  protected readonly addToastVisible = signal(false);
  protected readonly addToastMessage = signal('');

  private addToastTimeoutId?: ReturnType<typeof setTimeout>;

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
    const quantities = this.getCartQuantitiesMap();
    return this.products()
      .filter((product) => this.getAvailableStock(product, quantities) > 0)
      .slice(0, 10);
  });
  protected readonly suggestedProductsPreview = computed(() => {
    const suggestions = this.suggestedProducts();
    if (suggestions.length <= 4) {
      return suggestions;
    }

    const startIndex = this.cartSuggestionStartIndex() % suggestions.length;
    return Array.from(
      { length: 4 },
      (_, offset) => suggestions[(startIndex + offset) % suggestions.length],
    );
  });
  protected readonly activeRelatedSuggestion = computed(() => {
    const suggestions = this.suggestedProducts();
    if (suggestions.length === 0) {
      return null;
    }

    const index = Math.max(0, Math.min(this.relatedSuggestionIndex(), suggestions.length - 1));
    return suggestions[index] ?? null;
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
        this.showAddToast();
      }
    });

    effect((onCleanup) => {
      if (typeof window === 'undefined') {
        return;
      }

      const shouldRotateInCart =
        this.cartOpen() && this.cartSummaryExpanded() && this.suggestedProducts().length > 1;
      if (!shouldRotateInCart) {
        return;
      }

      const intervalId = window.setInterval(() => this.nextCartSuggestionSlide(), 2600);
      onCleanup(() => window.clearInterval(intervalId));
    });

    effect((onCleanup) => {
      if (typeof window === 'undefined') {
        return;
      }

      const shouldRotateInModal =
        this.relatedSuggestionsModalOpen() && this.suggestedProducts().length > 1;
      if (!shouldRotateInModal) {
        return;
      }

      const intervalId = window.setInterval(() => this.nextRelatedSuggestion(), 2400);
      onCleanup(() => window.clearInterval(intervalId));
    });
  }

  protected increase(item: CartItem): void {
    this.cartService.increase(item.product.id);
  }

  protected decrease(item: CartItem): void {
    const message =
      item.quantity <= 1
        ? `Se elimino ${item.product.name} del carrito.`
        : `Se removio 1 unidad de ${item.product.name}.`;

    this.cartService.decrease(item.product.id);
    this.showToast(message);
  }

  protected clearCart(): void {
    this.cartService.clear();
  }

  protected requestClearCart(): void {
    if (this.cartItems().length === 0) {
      return;
    }

    this.cartClearConfirmOpen.set(true);
  }

  protected cancelClearCart(): void {
    this.cartClearConfirmOpen.set(false);
  }

  protected confirmClearCart(): void {
    this.cartService.clear();
    this.cartClearConfirmOpen.set(false);
  }

  protected openCart(): void {
    this.cartOpen.set(true);
  }

  protected closeCart(): void {
    this.cartOpen.set(false);
  }

  protected toggleCartSummary(): void {
    this.cartSummaryExpanded.update((value) => {
      const next = !value;
      if (next && this.suggestedProducts().length > 1) {
        this.nextCartSuggestionSlide();
      }
      return next;
    });
  }

  protected readonly clearCartPreview = computed(() => this.cartItems().slice(0, 3));

  protected readonly clearCartRemainderCount = computed(() =>
    Math.max(0, this.cartItems().length - this.clearCartPreview().length),
  );

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
    if (this.availableStock(product) <= 0) {
      return;
    }

    this.cartService.add(product);
  }

  protected availableStock(product: Product): number {
    return this.getAvailableStock(product, this.getCartQuantitiesMap());
  }

  protected hasStock(product: Product): boolean {
    return this.availableStock(product) > 0;
  }

  protected openRelatedSuggestionsModal(initialProduct?: Product): void {
    const suggestions = this.suggestedProducts();
    if (suggestions.length === 0) {
      return;
    }

    if (initialProduct) {
      const index = suggestions.findIndex((item) => item.id === initialProduct.id);
      this.relatedSuggestionIndex.set(index >= 0 ? index : 0);
    } else {
      this.relatedSuggestionIndex.set(0);
    }

    this.relatedSuggestionsModalOpen.set(true);
  }

  protected closeRelatedSuggestionsModal(): void {
    this.relatedSuggestionsModalOpen.set(false);
  }

  protected nextRelatedSuggestion(): void {
    const total = this.suggestedProducts().length;
    if (total === 0) {
      return;
    }

    this.relatedSuggestionIndex.update((index) => (index + 1) % total);
  }

  protected prevRelatedSuggestion(): void {
    const total = this.suggestedProducts().length;
    if (total === 0) {
      return;
    }

    this.relatedSuggestionIndex.update((index) => (index - 1 + total) % total);
  }

  protected setRelatedSuggestion(index: number): void {
    const total = this.suggestedProducts().length;
    if (total === 0) {
      return;
    }

    this.relatedSuggestionIndex.set(Math.max(0, Math.min(index, total - 1)));
  }

  protected nextCartSuggestionSlide(): void {
    const total = this.suggestedProducts().length;
    if (total <= 1) {
      return;
    }

    this.cartSuggestionStartIndex.update((index) => (index + 1) % total);
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

  private getCartQuantitiesMap(): Map<number, number> {
    return new Map(this.cartItems().map((item) => [item.product.id, item.quantity]));
  }

  private getProductStock(product: Product): number {
    const value = Number(product.stock);
    if (Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }

    return App.DEFAULT_PRODUCT_STOCK;
  }

  private getAvailableStock(product: Product, quantities: Map<number, number>): number {
    const inCart = quantities.get(product.id) ?? 0;
    return Math.max(0, this.getProductStock(product) - inCart);
  }

  private triggerCartPulse(): void {
    this.cartPulse.set(true);
    setTimeout(() => this.cartPulse.set(false), 420);
  }

  private showAddToast(): void {
    const productName = this.cartService.lastAddedProductName();
    const message = productName
      ? `Se agrego ${productName} al carrito.`
      : 'Producto agregado al carrito.';

    this.showToast(message);
  }

  private showToast(message: string): void {
    if (!message) {
      return;
    }

    this.addToastMessage.set(message);
    this.addToastVisible.set(true);

    if (this.addToastTimeoutId) {
      clearTimeout(this.addToastTimeoutId);
    }

    this.addToastTimeoutId = setTimeout(() => {
      this.addToastVisible.set(false);
    }, 2200);
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
