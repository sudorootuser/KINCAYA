import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="brand">Kincaya Admin</div>

        <nav>
          <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/admin/leads" routerLinkActive="active">Leads</a>
          <a routerLink="/admin/products" routerLinkActive="active">Productos</a>
          <a routerLink="/admin/analytics" routerLinkActive="active">Analytics</a>
        </nav>

        <button type="button" class="logout" (click)="logout()">Cerrar sesion</button>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 260px 1fr;
        background: linear-gradient(180deg, #eef2f8 0%, #f8fafd 100%);
      }

      .sidebar {
        background: #0f1d36;
        color: #fff;
        padding: 24px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .brand {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: 0.4px;
        margin-bottom: 12px;
      }

      nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      nav a {
        color: #d8e4ff;
        text-decoration: none;
        border: 1px solid transparent;
        padding: 10px 12px;
        border-radius: 10px;
        transition: all 0.2s ease;
      }

      nav a:hover,
      nav a.active {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        color: #ffffff;
      }

      .logout {
        margin-top: auto;
        background: transparent;
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        padding: 10px;
        cursor: pointer;
      }

      .content {
        padding: 24px;
      }

      @media (max-width: 900px) {
        .admin-shell {
          grid-template-columns: 1fr;
        }

        .sidebar {
          position: sticky;
          top: 0;
          z-index: 10;
        }
      }
    `,
  ],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
