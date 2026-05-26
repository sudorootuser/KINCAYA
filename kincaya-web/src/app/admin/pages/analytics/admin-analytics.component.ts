import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';

import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page" *ngIf="summary$ | async as summary">
      <header>
        <h1>Analytics basicos</h1>
        <p>Metrica simple para validar comportamiento de clientes.</p>
      </header>

      <div class="cards">
        <article>
          <small>Total leads</small>
          <strong>{{ summary.totalLeads }}</strong>
        </article>

        <article>
          <small>PDFs generados</small>
          <strong>{{ summary.pdfsGenerados }}</strong>
        </article>

        <article>
          <small>Aperturas WhatsApp</small>
          <strong>{{ summary.aperturasWhatsapp }}</strong>
        </article>
      </div>

      <article class="panel">
        <h2>Consultas por dia</h2>
        <ul>
          <li *ngFor="let day of summary.consultasPorDia">
            <span>{{ day.fecha }}</span>
            <strong>{{ day.total }}</strong>
          </li>
        </ul>
      </article>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 14px;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .cards article,
      .panel {
        background: #fff;
        border: 1px solid #dae3ef;
        border-radius: 14px;
        padding: 14px;
      }

      .cards small {
        color: #5f7290;
      }

      .cards strong {
        display: block;
        font-size: 30px;
        margin-top: 8px;
        color: #14335f;
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 8px;
      }

      li {
        display: flex;
        justify-content: space-between;
        border: 1px solid #edf2f8;
        border-radius: 10px;
        padding: 8px 10px;
      }

      @media (max-width: 800px) {
        .cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminAnalyticsComponent {
  private readonly analyticsService = inject(AnalyticsService);

  readonly summary$ = this.analyticsService.summary$;
}
