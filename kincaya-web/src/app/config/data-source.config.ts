import { environment } from '../../environments/environment';

export type DataSourceMode = 'local-json' | 'api-http';

export interface DataSourceConfig {
  mode: DataSourceMode;
  apiBaseUrl: string;
  endpoints: {
    products: string;
    homeContent: string;
    testimonials: string;
  };
  requestTimeoutMs: number;
}

function hasRealApiBaseUrl(url: string): boolean {
  const value = (url ?? '').trim();
  if (!value) {
    return false;
  }

  const looksLikePlaceholder =
    value.includes('tu-dominio.com') ||
    value.includes('REEMPLAZAR') ||
    value.includes('example.com');
  if (looksLikePlaceholder) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const requestedMode = environment.publicDataSource.mode as DataSourceMode;
const shouldUseApiHttp =
  requestedMode === 'api-http' && hasRealApiBaseUrl(environment.publicDataSource.apiBaseUrl);

if (requestedMode === 'api-http' && !shouldUseApiHttp) {
  console.warn('[DataSource] API no configurada. Se usa local JSON automaticamente.');
}

export const DATA_SOURCE_CONFIG: DataSourceConfig = {
  mode: shouldUseApiHttp ? 'api-http' : 'local-json',
  apiBaseUrl: shouldUseApiHttp ? environment.publicDataSource.apiBaseUrl : '',
  endpoints: {
    products: environment.publicDataSource.endpoints.products,
    homeContent: environment.publicDataSource.endpoints.homeContent,
    testimonials: environment.publicDataSource.endpoints.testimonials,
  },
  requestTimeoutMs: environment.publicDataSource.requestTimeoutMs,
};
