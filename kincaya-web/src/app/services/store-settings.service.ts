import { Injectable, computed, signal } from '@angular/core';

export type CurrencyCode = 'COP' | 'USD' | 'EUR';

export interface StoreSettings {
  currency: CurrencyCode;
  storeName: string;
  phoneNumber: string;
  freeShippingThreshold: number;
}

const SETTINGS_KEY = 'kincaya_store_settings_v1';

const DEFAULT_SETTINGS: StoreSettings = {
  currency: 'COP',
  storeName: 'Kincaya',
  phoneNumber: '573227405024',
  freeShippingThreshold: 500000,
};

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; minDecimals: number; maxDecimals: number }> = {
  COP: { locale: 'es-CO', minDecimals: 0, maxDecimals: 0 },
  USD: { locale: 'en-US', minDecimals: 2, maxDecimals: 2 },
  EUR: { locale: 'es-ES', minDecimals: 2, maxDecimals: 2 },
};

@Injectable({ providedIn: 'root' })
export class StoreSettingsService {
  private readonly settingsState = signal<StoreSettings>(this.readSettings());

  readonly settings = computed(() => this.settingsState());
  readonly currency = computed(() => this.settingsState().currency);

  update(partial: Partial<StoreSettings>): void {
    this.settingsState.update((current) => ({ ...current, ...partial }));
    this.persist();
  }

  formatPrice(price: number): string {
    const s = this.settingsState();
    const config = CURRENCY_CONFIG[s.currency];
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.minDecimals,
      maximumFractionDigits: config.maxDecimals,
    }).format(price);
    return `${s.currency} ${formatted}`;
  }

  private readSettings(): StoreSettings {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoreSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settingsState()));
  }
}
