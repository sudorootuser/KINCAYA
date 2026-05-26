import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AnalyticsService } from '../../../services/analytics.service';
import { LeadService } from '../../../services/lead.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard" *ngIf="summary$ | async as summary">
      <header>
        <h1>Dashboard administrativo</h1>
        <p>Resumen operativo inicial del MVP.</p>
      </header>

      <div class="cards">
        <article>
          <h2>Total leads</h2>
          <strong>{{ summary.totalLeads }}</strong>
        </article>

        <article>
          <h2>PDFs generados</h2>
          <strong>{{ summary.pdfsGenerados }}</strong>
        </article>

        <article>
          <h2>Aperturas WhatsApp</h2>
          <strong>{{ summary.aperturasWhatsapp }}</strong>
        </article>

        <article>
          <h2>Consultas por dia</h2>
          <strong>{{ summary.consultasPorDia.length }}</strong>
        </article>
      </div>

      <section class="list-card">
        <h3>Top productos consultados</h3>
        <ul>
          <li *ngFor="let item of summary.productosMasConsultados">
            <span>{{ item.nombre }}</span>
            <strong>{{ item.totalConsultas }}</strong>
          </li>
        </ul>
      </section>

      <section class="list-card">
        <h3>Ultimos leads</h3>
        <ul>
          <li *ngFor="let lead of latestLeads()">
            <span>{{ lead.fechaIso | date: 'short' }} · {{ lead.origen }}</span>
            <strong>{{ lead.estado }}</strong>
          </li>
        </ul>
      </section>
    </section>
  `,
  styles: [
    `
      .dashboard {
        display: grid;
        gap: 16px;
      }

      header h1 {
        margin: 0;
        color: #10203a;
      }

      header p {
        margin: 6px 0 0;
        color: #5a6a84;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .cards article,
      .list-card {
        background: #fff;
        border: 1px solid #dce3ef;
        border-radius: 14px;
        padding: 14px;
      }

      .cards h2 {
        margin: 0;
        font-size: 13px;
        color: #6d7f9a;
      }

      .cards strong {
        display: block;
        margin-top: 6px;
        font-size: 26px;
        color: #15325e;
      }

      ul {
        margin: 10px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }

      li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border: 1px solid #e8edf4;
        border-radius: 10px;
        padding: 8px 10px;
      }

      @media (max-width: 1100px) {
        .cards {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent {
  private readonly leadService = inject(LeadService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly summary$ = this.analyticsService.summary$;

  latestLeads() {
    return this.leadService.getSnapshot().slice(0, 6);
  }
}
