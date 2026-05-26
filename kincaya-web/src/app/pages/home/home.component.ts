import { Component, computed, inject, signal } from '@angular/core';

import { PRODUCTS } from '../../data/products.data';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { ProductViewerService } from '../../services/product-viewer.service';
import { UxMetricsService } from '../../services/ux-metrics.service';

type PriceBand = 'all' | 'under60' | 'from60to120' | 'over120';
type SortMode = 'relevance' | 'priceAsc' | 'priceDesc';

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
  protected readonly activePriceBand = signal<PriceBand>('all');
  protected readonly onlyFeatured = signal(false);
  protected readonly sortMode = signal<SortMode>('relevance');
  protected readonly lastTrackedSearch = signal('');
  protected readonly recentlyAddedId = signal<number | null>(null);
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';

  protected readonly priceBands = [
    { key: 'all' as PriceBand, label: 'Todo precio' },
    { key: 'under60' as PriceBand, label: 'Hasta $60' },
    { key: 'from60to120' as PriceBand, label: '$60 a $120' },
    { key: 'over120' as PriceBand, label: 'Mas de $120' },
  ];

  protected readonly sortOptions = [
    { key: 'relevance' as SortMode, label: 'Relevancia' },
    { key: 'priceAsc' as SortMode, label: 'Precio: menor a mayor' },
    { key: 'priceDesc' as SortMode, label: 'Precio: mayor a menor' },
  ];

  protected readonly collections = [
    {
      title: 'Home Office Smart',
      description: 'Arma un setup eficiente para trabajo remoto y clases.',
      category: 'Computo',
      image:
        'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Seguridad para tu hogar',
      description: 'Camaras y kits para monitoreo en tiempo real.',
      category: 'Seguridad',
      image:
        'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80',
    },
    {
      title: 'Audio y entretenimiento',
      description: 'Sonido envolvente para musica, gaming y streaming.',
      category: 'Audio',
      image:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    },
  ];

  protected readonly testimonials = [
    {
      name: 'Andrea M.',
      role: 'Cliente recurrente',
      quote: 'Compre en la manana y el mismo dia me asesoraron por WhatsApp. Super claro todo.',
      score: '5.0',
    },
    {
      name: 'Luis R.',
      role: 'Emprendedor',
      quote:
        'La experiencia es rapida y sin complicaciones. Me ayudaron a elegir justo lo que necesitaba.',
      score: '4.9',
    },
    {
      name: 'Carla P.',
      role: 'Diseño y marketing',
      quote: 'Buen catalogo, buena atencion y seguimiento real despues de la compra.',
      score: '5.0',
    },
  ];

  private readonly cartService = inject(CartService);
  private readonly viewer = inject(ProductViewerService);
  private readonly metricsService = inject(UxMetricsService);

  protected readonly featuredProducts = PRODUCTS.filter((product) => product.featured);
  protected readonly offerProduct = PRODUCTS.find((product) => product.featured) ?? PRODUCTS[0];
  protected readonly metrics = this.metricsService.metrics;
  protected readonly addToViewRate = this.metricsService.addToViewRate;
  protected readonly checkoutRate = this.metricsService.checkoutRate;

  constructor() {
    this.metricsService.trackVisit();
  }

  protected readonly filteredProducts = computed(() => {
    const category = this.activeCategory();
    const query = this.searchTerm().trim().toLowerCase();
    const priceBand = this.activePriceBand();
    const onlyFeatured = this.onlyFeatured();
    const sortMode = this.sortMode();

    let filtered = this.products;

    if (category !== 'Todos') {
      filtered = filtered.filter((product) => product.category === category);
    }

    if (onlyFeatured) {
      filtered = filtered.filter((product) => product.featured);
    }

    if (priceBand !== 'all') {
      filtered = filtered.filter((product) => {
        if (priceBand === 'under60') {
          return product.price <= 60;
        }

        if (priceBand === 'from60to120') {
          return product.price > 60 && product.price <= 120;
        }

        return product.price > 120;
      });
    }

    if (!query) {
      return this.sortProducts(filtered, sortMode);
    }

    const searched = filtered.filter((product) => {
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(query);
    });

    return this.sortProducts(searched, sortMode);
  });

  protected readonly quickSearchSuggestions = computed(() =>
    this.products
      .map((product) => product.name)
      .filter((name, index, source) => source.indexOf(name) === index)
      .slice(0, 8),
  );

  protected readonly hasAdvancedFilters = computed(
    () =>
      this.activePriceBand() !== 'all' || this.onlyFeatured() || this.sortMode() !== 'relevance',
  );

  protected selectCategory(category: string): void {
    this.activeCategory.set(category);
    this.metricsService.trackFilterUse();
  }

  protected addToCart(product: Product): void {
    this.cartService.add(product);
    this.metricsService.trackAddToCart();
    this.recentlyAddedId.set(product.id);
    setTimeout(() => this.recentlyAddedId.set(null), 420);
  }

  protected updateSearch(term: string): void {
    this.searchTerm.set(term);

    const normalized = term.trim().toLowerCase();
    if (normalized.length >= 3 && this.lastTrackedSearch() !== normalized) {
      this.lastTrackedSearch.set(normalized);
      this.metricsService.trackSearch();
    }
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected setPriceBand(priceBand: PriceBand): void {
    this.activePriceBand.set(priceBand);
    this.metricsService.trackFilterUse();
  }

  protected setSortMode(mode: SortMode): void {
    this.sortMode.set(mode);
    this.metricsService.trackFilterUse();
  }

  protected setFeaturedOnly(value: boolean): void {
    this.onlyFeatured.set(value);
    this.metricsService.trackFilterUse();
  }

  protected resetAdvancedFilters(): void {
    this.activePriceBand.set('all');
    this.onlyFeatured.set(false);
    this.sortMode.set('relevance');
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
    this.metricsService.trackProductView();
    this.viewer.open(product);
  }

  protected openCollection(category: string): void {
    this.activeCategory.set(category);
    this.metricsService.trackFilterUse();

    if (typeof window !== 'undefined') {
      const target = window.document.getElementById('products');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected getBadge(product: Product): string {
    if (product.featured) {
      return 'Top ventas';
    }

    if (product.price <= 60) {
      return 'Oferta';
    }

    if (product.category === 'Wearables' || product.category === 'Camaras') {
      return 'Nuevo';
    }

    return '';
  }

  protected getReferencePrice(price: number): string {
    return this.formatPrice(price * 1.18);
  }

  protected getOfferPrice(price: number): string {
    return this.formatPrice(price * 0.85);
  }

  private sortProducts(products: Product[], mode: SortMode): Product[] {
    const copy = [...products];

    if (mode === 'priceAsc') {
      return copy.sort((a, b) => a.price - b.price);
    }

    if (mode === 'priceDesc') {
      return copy.sort((a, b) => b.price - a.price);
    }

    return copy;
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}
