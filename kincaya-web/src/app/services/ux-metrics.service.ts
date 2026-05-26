import { Injectable, computed, signal } from '@angular/core';

interface UxMetrics {
  visits: number;
  productViews: number;
  addsToCart: number;
  checkoutIntents: number;
  searches: number;
  filtersUsed: number;
}

const STORAGE_KEY = 'kincaya_ux_metrics_v1';

@Injectable({
  providedIn: 'root',
})
export class UxMetricsService {
  private readonly metricsState = signal<UxMetrics>(this.readStoredMetrics());

  readonly metrics = computed(() => this.metricsState());
  readonly addToViewRate = computed(() => {
    const value = this.metricsState();
    if (value.productViews === 0) {
      return 0;
    }

    return (value.addsToCart / value.productViews) * 100;
  });

  readonly checkoutRate = computed(() => {
    const value = this.metricsState();
    if (value.addsToCart === 0) {
      return 0;
    }

    return (value.checkoutIntents / value.addsToCart) * 100;
  });

  trackVisit(): void {
    this.increment('visits');
  }

  trackProductView(): void {
    this.increment('productViews');
  }

  trackAddToCart(): void {
    this.increment('addsToCart');
  }

  trackCheckoutIntent(): void {
    this.increment('checkoutIntents');
  }

  trackSearch(): void {
    this.increment('searches');
  }

  trackFilterUse(): void {
    this.increment('filtersUsed');
  }

  private increment(key: keyof UxMetrics): void {
    this.metricsState.update((value) => ({
      ...value,
      [key]: value[key] + 1,
    }));
    this.persist();
  }

  private readStoredMetrics(): UxMetrics {
    const fallback: UxMetrics = {
      visits: 0,
      productViews: 0,
      addsToCart: 0,
      checkoutIntents: 0,
      searches: 0,
      filtersUsed: 0,
    };

    if (typeof window === 'undefined') {
      return fallback;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UxMetrics>;
      return {
        visits: Number(parsed.visits) || 0,
        productViews: Number(parsed.productViews) || 0,
        addsToCart: Number(parsed.addsToCart) || 0,
        checkoutIntents: Number(parsed.checkoutIntents) || 0,
        searches: Number(parsed.searches) || 0,
        filtersUsed: Number(parsed.filtersUsed) || 0,
      };
    } catch {
      return fallback;
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metricsState()));
  }
}
