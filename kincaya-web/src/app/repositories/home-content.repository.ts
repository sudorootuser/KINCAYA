import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';

import { DATA_SOURCE_CONFIG, DataSourceConfig } from '../config/data-source.config';
import { HomeContent } from '../models/home-content.model';
import { environment } from '../../environments/environment';

interface HomeContentResponse {
  homeContent?: HomeContent;
}

export interface HomeContentRepository {
  getHomeContent(): Observable<HomeContent>;
}

class LocalJsonHomeContentRepository implements HomeContentRepository {
  constructor(private readonly http: HttpClient) {}

  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContent>('assets/data/home.json');
  }
}

class ApiHttpHomeContentRepository implements HomeContentRepository {
  private readonly url: string;

  constructor(
    private readonly http: HttpClient,
    private readonly config: DataSourceConfig,
  ) {
    this.url = buildSafeApiUrl(config.apiBaseUrl, config.endpoints.homeContent);
  }

  getHomeContent(): Observable<HomeContent> {
    return this.http.get<HomeContentResponse | HomeContent>(this.url).pipe(
      timeout(this.config.requestTimeoutMs),
      map((response) => {
        if (response && typeof response === 'object' && 'hero' in response) {
          return response as HomeContent;
        }

        return (response as HomeContentResponse)?.homeContent ?? ({} as HomeContent);
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
  const fallback = environment.publicDataSource.apiBaseUrl || 'http://localhost:3000/api';

  try {
    const parsed = new URL(baseUrl);
    const allowed = parsed.protocol === 'http:' || parsed.protocol === 'https:';
    return allowed ? parsed.toString().replace(/\/$/, '') : fallback;
  } catch {
    return fallback;
  }
}

export const HOME_CONTENT_REPOSITORY = new InjectionToken<HomeContentRepository>(
  'HOME_CONTENT_REPOSITORY',
  {
    providedIn: 'root',
    factory: () => {
      const http = inject(HttpClient);
      const config = DATA_SOURCE_CONFIG;

      if (config.mode === 'api-http') {
        return new ApiHttpHomeContentRepository(http, config);
      }

      return new LocalJsonHomeContentRepository(http);
    },
  },
);
