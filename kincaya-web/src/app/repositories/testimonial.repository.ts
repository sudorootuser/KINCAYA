import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';

import { DATA_SOURCE_CONFIG, DataSourceConfig } from '../config/data-source.config';
import { Testimonial } from '../models/testimonial.model';

interface TestimonialResponse {
  testimonials?: Testimonial[];
}

export interface TestimonialRepository {
  getTestimonials(): Observable<Testimonial[]>;
}

class LocalJsonTestimonialRepository implements TestimonialRepository {
  constructor(private readonly http: HttpClient) {}

  getTestimonials(): Observable<Testimonial[]> {
    return this.http
      .get<TestimonialResponse | Testimonial[]>('assets/data/testimonials.json')
      .pipe(map((response) => extractTestimonials(response)));
  }
}

class ApiHttpTestimonialRepository implements TestimonialRepository {
  private readonly url: string;

  constructor(
    private readonly http: HttpClient,
    private readonly config: DataSourceConfig,
  ) {
    this.url = buildSafeApiUrl(config.apiBaseUrl, config.endpoints.testimonials);
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<TestimonialResponse | Testimonial[]>(this.url).pipe(
      timeout(this.config.requestTimeoutMs),
      map((response) => extractTestimonials(response)),
    );
  }
}

function extractTestimonials(
  response: TestimonialResponse | Testimonial[] | null | undefined,
): Testimonial[] {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response?.testimonials) ? response.testimonials : [];
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

export const TESTIMONIAL_REPOSITORY = new InjectionToken<TestimonialRepository>(
  'TESTIMONIAL_REPOSITORY',
  {
    providedIn: 'root',
    factory: () => {
      const http = inject(HttpClient);
      const config = DATA_SOURCE_CONFIG;

      if (config.mode === 'api-http') {
        return new ApiHttpTestimonialRepository(http, config);
      }

      return new LocalJsonTestimonialRepository(http);
    },
  },
);
