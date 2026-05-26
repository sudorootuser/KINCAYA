import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./pages/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'nosotros',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
