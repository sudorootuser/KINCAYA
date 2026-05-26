import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';

import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { HomeContentService } from '../../services/home-content.service';
import { ProductCatalogService } from '../../services/product-catalog.service';
import { ProductViewerService } from '../../services/product-viewer.service';
import { TestimonialService } from '../../services/testimonial.service';
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
  private static readonly PAGE_SIZE = 8;

  protected readonly activeCategory = signal('Todos');
  protected readonly searchTerm = signal('');
  protected readonly activePriceBand = signal<PriceBand>('all');
  protected readonly onlyFeatured = signal(false);
  protected readonly sortMode = signal<SortMode>('relevance');
  protected readonly currentPage = signal(1);
  protected readonly lastTrackedSearch = signal('');
  protected readonly recentlyAddedId = signal<number | null>(null);
  protected readonly fallbackImagePath = 'assets/placeholders/product-fallback.svg';
  protected readonly activeTestimonialIndex = signal(0);
  protected readonly heroHighlightIndex = signal(0);
  protected readonly heroHighlightChanging = signal(false);
  protected readonly heroHighlightOutgoingText = signal<string | null>(null);
  protected readonly heroHighlightIncomingText = signal<string | null>(null);
  protected readonly focusedSectionId = signal<string | null>(null);
  private testimonialTimer: ReturnType<typeof setInterval> | null = null;
  private heroHighlightTimer: ReturnType<typeof setInterval> | null = null;
  private heroHighlightSwapTimeout: ReturnType<typeof setTimeout> | null = null;
  private hashNavigationTimeout: ReturnType<typeof setTimeout> | null = null;
  private hashFocusTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly handleHashChange = () => this.scrollToHashTarget(window.location.hash);
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
  private readonly testimonialService = inject(TestimonialService);

  protected readonly homeContent = this.homeContentService.content;
  protected readonly products = this.catalogService.products;
  protected readonly categories = this.catalogService.categories;
  protected readonly testimonials = this.testimonialService.items;
  protected readonly featuredProducts = this.catalogService.featuredProducts;
  protected readonly featuredShowcaseProducts = computed(() => {
    const featured = this.featuredProducts();
    if (featured.length > 0) {
      return featured;
    }

    return this.products().slice(0, 4);
  });
  protected readonly offerProduct = computed(
    () => this.featuredShowcaseProducts()[0] ?? this.products()[0] ?? null,
  );
  protected readonly totalTestimonials = computed(() => this.testimonials().length);
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
    this.testimonialService.ensureLoaded();
    this.metricsService.trackVisit();

    effect(() => {
      const totalPages = this.totalProductPages();
      if (this.currentPage() > totalPages) {
        this.currentPage.set(totalPages);
      }
    });

    effect(() => {
      const totalTestimonials = this.totalTestimonials();
      if (totalTestimonials <= 0) {
        this.activeTestimonialIndex.set(0);
        return;
      }

      if (this.activeTestimonialIndex() >= totalTestimonials) {
        this.activeTestimonialIndex.set(0);
      }
    });

    afterNextRender(() => {
      this.setupScrollReveal();
      this.startTestimonialAutoPlay();
      this.startHeroHighlightRotation();
      this.setupHashNavigation();
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

    if (this.hashNavigationTimeout !== null) {
      clearTimeout(this.hashNavigationTimeout);
    }

    if (this.hashFocusTimeout !== null) {
      clearTimeout(this.hashFocusTimeout);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.handleHashChange);
    }
  }

  protected nextTestimonial(): void {
    const total = this.totalTestimonials();
    if (total <= 1) {
      return;
    }

    this.activeTestimonialIndex.update((i) => (i + 1) % total);
  }

  protected prevTestimonial(): void {
    const total = this.totalTestimonials();
    if (total <= 1) {
      return;
    }

    this.activeTestimonialIndex.update((i) => (i - 1 + total) % total);
  }

  protected goToTestimonial(index: number): void {
    if (this.totalTestimonials() <= 0) {
      return;
    }

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

  protected handleHeroActionClick(event: MouseEvent, href: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const rawHref = (href ?? '').trim();
    if (!rawHref.startsWith('#')) {
      return;
    }

    event.preventDefault();

    if (window.location.hash !== rawHref) {
      window.location.hash = rawHref;
      return;
    }

    this.scrollToHashTarget(rawHref);
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
      const total = this.totalTestimonials();
      if (!this.testimonialPaused && total > 1) {
        this.activeTestimonialIndex.update((i) => (i + 1) % total);
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

  private setupHashNavigation(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('hashchange', this.handleHashChange);
  }

  private scrollToHashTarget(rawHash: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const hash = rawHash.trim();
    if (!hash || hash.length <= 1) {
      return;
    }

    const targetId = decodeURIComponent(hash.slice(1));

    if (this.hashNavigationTimeout !== null) {
      clearTimeout(this.hashNavigationTimeout);
    }

    this.hashNavigationTimeout = setTimeout(() => {
      const target = window.document.getElementById(targetId);
      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      this.highlightTargetSection(targetId);
    }, 90);
  }

  private highlightTargetSection(targetId: string): void {
    this.focusedSectionId.set(targetId);

    if (this.hashFocusTimeout !== null) {
      clearTimeout(this.hashFocusTimeout);
    }

    this.hashFocusTimeout = setTimeout(() => {
      if (this.focusedSectionId() === targetId) {
        this.focusedSectionId.set(null);
      }
    }, 1800);
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

  protected readonly totalProductPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProducts().length / HomeComponent.PAGE_SIZE)),
  );

  protected readonly visibleProducts = computed(() => {
    const page = Math.min(this.currentPage(), this.totalProductPages());
    const start = (page - 1) * HomeComponent.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + HomeComponent.PAGE_SIZE);
  });

  protected readonly pageRange = computed(() => {
    const total = this.totalProductPages();
    return Array.from({ length: total }, (_, index) => index + 1);
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
    this.currentPage.set(1);
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
    this.currentPage.set(1);

    const normalized = term.trim().toLowerCase();
    if (normalized.length >= 3 && this.lastTrackedSearch() !== normalized) {
      this.lastTrackedSearch.set(normalized);
      this.metricsService.trackSearch();
    }
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  protected setPriceBand(priceBand: PriceBand): void {
    this.activePriceBand.set(priceBand);
    this.currentPage.set(1);
    this.metricsService.trackFilterUse();
  }

  protected setSortMode(mode: SortMode): void {
    this.sortMode.set(mode);
    this.currentPage.set(1);
    this.metricsService.trackFilterUse();
  }

  protected setFeaturedOnly(value: boolean): void {
    this.onlyFeatured.set(value);
    this.currentPage.set(1);
    this.metricsService.trackFilterUse();
  }

  protected resetAdvancedFilters(): void {
    this.activePriceBand.set('all');
    this.onlyFeatured.set(false);
    this.sortMode.set('relevance');
    this.currentPage.set(1);
  }

  protected goToPage(page: number): void {
    const total = this.totalProductPages();
    const nextPage = Math.max(1, Math.min(page, total));
    this.currentPage.set(nextPage);

    if (typeof window !== 'undefined') {
      const target = window.document.getElementById('products');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  protected prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected nextPage(): void {
    this.goToPage(this.currentPage() + 1);
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
    this.currentPage.set(1);
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
