import { Routes } from '@angular/router';

import { adminAuthGuard } from '../guards/admin-auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: '',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./pages/leads/admin-leads.component').then((m) => m.AdminLeadsComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/admin-products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/admin-analytics.component').then(
            (m) => m.AdminAnalyticsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
