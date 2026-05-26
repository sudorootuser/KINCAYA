import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';

import { DATA_SOURCE_CONFIG, DataSourceConfig } from '../config/data-source.config';
import { Product } from '../models/product.model';

interface ProductCatalogResponse {
  products: Product[];
}

export interface ProductRepository {
  getProducts(): Observable<Product[]>;
}

class LocalJsonProductRepository implements ProductRepository {
  constructor(private readonly http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http
      .get<ProductCatalogResponse>('assets/data/products.json')
      .pipe(map((response) => (Array.isArray(response?.products) ? response.products : [])));
  }
}

class ApiHttpProductRepository implements ProductRepository {
  private readonly url: string;

  constructor(
    private readonly http: HttpClient,
    private readonly config: DataSourceConfig,
  ) {
    this.url = buildSafeApiUrl(config.apiBaseUrl, config.endpoints.products);
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<ProductCatalogResponse | Product[]>(this.url).pipe(
      timeout(this.config.requestTimeoutMs),
      map((response) => {
        if (Array.isArray(response)) {
          return response;
        }

        return Array.isArray(response?.products) ? response.products : [];
      }),
    );
  }
}

function buildSafeApiUrl(baseUrl: string, endpoint: string): string {
  const sanitizedBase = sanitizeBaseUrl(baseUrl);
  const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${sanitizedBase}${sanitizedEndpoint}`;
}

function sanitizeBaseUrl(baseUrl: string): string {
  const fallback = 'http://localhost:3000/api';

  try {
    const parsed = new URL(baseUrl);
    const allowed = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return allowed ? parsed.toString().replace(/\/$/, '') : fallback;
  } catch {
    return fallback;
  }
}

export const PRODUCT_REPOSITORY = new InjectionToken<ProductRepository>('PRODUCT_REPOSITORY', {
  providedIn: 'root',
  factory: () => {
    const http = inject(HttpClient);
    const config = DATA_SOURCE_CONFIG;

    if (config.mode === 'api-http') {
      return new ApiHttpProductRepository(http, config);
    }

    return new LocalJsonProductRepository(http);
  },
});
