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

// Recommended configuration for local development using JSON files.
const DEV_LOCAL_JSON_CONFIG: DataSourceConfig = {
  mode: 'local-json',
  apiBaseUrl: 'http://localhost:3000/api',
  endpoints: {
    products: '/products',
    homeContent: '/home-content',
    testimonials: '/testimonials',
  },
  requestTimeoutMs: 8000,
};

// Commented example for production (real API).
// 1) Replace `apiBaseUrl` and endpoints with real values.
// 2) Comment out the development export line.
// 3) Uncomment the production export line.
const PROD_API_HTTP_CONFIG: DataSourceConfig = {
  mode: 'api-http',
  apiBaseUrl: 'https://api.tu-dominio.com/v1',
  endpoints: {
    products: '/catalog/products',
    homeContent: '/content/home',
    testimonials: '/content/testimonials',
  },
  requestTimeoutMs: 10000,
};

// Development (active by default)
export const DATA_SOURCE_CONFIG: DataSourceConfig = DEV_LOCAL_JSON_CONFIG;

// Production (uncomment when deploying)
// export const DATA_SOURCE_CONFIG: DataSourceConfig = PROD_API_HTTP_CONFIG;
