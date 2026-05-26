import { environment } from '../../../environments/environment';

export type AdminDataSourceMode = 'local-simulated' | 'api-http' | 'firebase';

export interface AdminDataSourceConfig {
  mode: AdminDataSourceMode;
  sendEnabled: boolean;
  apiBaseUrl: string;
  endpoints: {
    leads: string;
    products: string;
    analytics: string;
    authLogin: string;
  };
  requestTimeoutMs: number;
}

export const ADMIN_DATA_SOURCE_CONFIG: AdminDataSourceConfig = {
  mode: environment.adminDataSource.mode,
  sendEnabled: environment.adminDataSource.sendEnabled,
  apiBaseUrl: environment.adminDataSource.apiBaseUrl,
  endpoints: {
    leads: environment.adminDataSource.endpoints.leads,
    products: environment.adminDataSource.endpoints.products,
    analytics: environment.adminDataSource.endpoints.analytics,
    authLogin: environment.adminDataSource.endpoints.authLogin,
  },
  requestTimeoutMs: environment.adminDataSource.requestTimeoutMs,
};
