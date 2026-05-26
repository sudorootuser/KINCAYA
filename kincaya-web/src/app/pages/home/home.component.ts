import { afterNextRender, Component, computed, inject, OnDestroy, signal } from '@angular/core';

import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { HomeContentService } from '../../services/home-content.service';
import { ProductCatalogService } from '../../services/product-catalog.service';
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
export class HomeComponent implements OnDestroy {
  protected readonly activeCategory = signal('Todos');
  protected readonly searchTerm = signal('');
  protected readonly activePriceBand = signal<PriceBand>('all');
  protected readonly onlyFeatured = signal(false);
  protected readonly sortMode = signal<SortMode>('relevance');
  protected readonly lastTrackedSearch = signal('');
  protected readonly recentlyAddedId = signal<number | null>(null);
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';
  protected readonly activeTestimonialIndex = signal(0);
  protected readonly heroHighlightIndex = signal(0);
  protected readonly heroHighlightChanging = signal(false);
  protected readonly heroHighlightOutgoingText = signal<string | null>(null);
  protected readonly heroHighlightIncomingText = signal<string | null>(null);
  private testimonialTimer: ReturnType<typeof setInterval> | null = null;
  private heroHighlightTimer: ReturnType<typeof setInterval> | null = null;
  private heroHighlightSwapTimeout: ReturnType<typeof setTimeout> | null = null;
  private testimonialPaused = false;

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

  private readonly cartService = inject(CartService);
  private readonly viewer = inject(ProductViewerService);
  private readonly metricsService = inject(UxMetricsService);
  private readonly catalogService = inject(ProductCatalogService);
  private readonly homeContentService = inject(HomeContentService);

  protected readonly homeContent = this.homeContentService.content;
  protected readonly products = this.catalogService.products;
  protected readonly categories = this.catalogService.categories;
  protected readonly featuredProducts = this.catalogService.featuredProducts;
  protected readonly offerProduct = computed(
    () => this.featuredProducts()[0] ?? this.products()[0] ?? null,
  );
  protected readonly totalTestimonials = computed(
    () => this.homeContent().testimonials.items.length,
  );
  protected readonly heroHighlightOptions = computed(() => {
    const options = ['hogar y oficina.', 'tecnologia diaria.', 'negocio y trabajo.'];

    return options.filter((text, index, list) => list.indexOf(text) === index);
  });
  protected readonly heroHighlightSizerText = computed(() => {
    const options = this.heroHighlightOptions();
    if (options.length === 0) {
      return this.homeContent().hero.titleHighlight;
    }

    return options.reduce((longest, current) =>
      current.length > longest.length ? current : longest,
    );
  });
  protected readonly rotatingHeroHighlight = computed(() => {
    const options = this.heroHighlightOptions();
    if (options.length === 0) {
      return this.homeContent().hero.titleHighlight;
    }

    const index = this.heroHighlightIndex() % options.length;
    return options[index] ?? this.homeContent().hero.titleHighlight;
  });
  protected readonly metrics = this.metricsService.metrics;
  protected readonly addToViewRate = this.metricsService.addToViewRate;
  protected readonly checkoutRate = this.metricsService.checkoutRate;

  constructor() {
    this.catalogService.ensureLoaded();
    this.homeContentService.ensureLoaded();
    this.metricsService.trackVisit();

    afterNextRender(() => {
      this.setupScrollReveal();
      this.startTestimonialAutoPlay();
      this.startHeroHighlightRotation();
    });
  }

  ngOnDestroy(): void {
    if (this.testimonialTimer !== null) {
      clearInterval(this.testimonialTimer);
    }

    if (this.heroHighlightTimer !== null) {
      clearInterval(this.heroHighlightTimer);
    }

    if (this.heroHighlightSwapTimeout !== null) {
      clearTimeout(this.heroHighlightSwapTimeout);
    }
  }

  protected nextTestimonial(): void {
    this.activeTestimonialIndex.update((i) => (i + 1) % this.totalTestimonials());
  }

  protected prevTestimonial(): void {
    this.activeTestimonialIndex.update(
      (i) => (i - 1 + this.totalTestimonials()) % this.totalTestimonials(),
    );
  }

  protected goToTestimonial(index: number): void {
    this.activeTestimonialIndex.set(index);
  }

  protected pauseTestimonialAutoPlay(): void {
    this.testimonialPaused = true;
  }

  protected resumeTestimonialAutoPlay(): void {
    this.testimonialPaused = false;
  }

  protected getStars(score: number): Array<'full' | 'empty'> {
    const fullCount = Math.round(score);
    return Array.from({ length: 5 }, (_, i) => (i < fullCount ? 'full' : 'empty'));
  }

  protected clampRate(rate: number): number {
    return Math.min(Math.max(rate, 0), 100);
  }

  private setupScrollReveal(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.08 },
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }

  private startTestimonialAutoPlay(): void {
    this.testimonialTimer = setInterval(() => {
      if (!this.testimonialPaused) {
        this.activeTestimonialIndex.update((i) => (i + 1) % this.totalTestimonials());
      }
    }, 5000);
  }

  private startHeroHighlightRotation(): void {
    this.heroHighlightTimer = setInterval(() => {
      const options = this.heroHighlightOptions();
      if (options.length <= 1) {
        return;
      }

      if (this.heroHighlightSwapTimeout !== null) {
        clearTimeout(this.heroHighlightSwapTimeout);
      }

      const currentText = this.rotatingHeroHighlight();
      const nextIndex = (this.heroHighlightIndex() + 1) % options.length;
      const nextText = options[nextIndex] ?? this.homeContent().hero.titleHighlight;

      this.heroHighlightOutgoingText.set(currentText);
      this.heroHighlightIncomingText.set(nextText);
      this.heroHighlightChanging.set(true);
      this.heroHighlightIndex.set(nextIndex);

      this.heroHighlightSwapTimeout = setTimeout(() => {
        this.heroHighlightChanging.set(false);
        this.heroHighlightOutgoingText.set(null);
        this.heroHighlightIncomingText.set(null);
      }, 420);
    }, 4300);
  }

  protected readonly filteredProducts = computed(() => {
    const category = this.activeCategory();
    const query = this.searchTerm().trim().toLowerCase();
    const priceBand = this.activePriceBand();
    const onlyFeatured = this.onlyFeatured();
    const sortMode = this.sortMode();

    let filtered = this.products();

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
    this.products()
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
    const texts = this.homeContent().badges;

    if (product.featured) {
      return texts.topSales;
    }

    if (product.price <= 60) {
      return texts.offer;
    }

    if (product.category === 'Wearables' || product.category === 'Camaras') {
      return texts.new;
    }

    return '';
  }

  protected getReferencePrice(price: number): string {
    return this.formatPrice(price * 1.18);
  }

  protected getOfferPrice(price: number): string {
    const discountRate = this.homeContent().offer.discountRate;
    return this.formatPrice(price * (1 - discountRate));
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
