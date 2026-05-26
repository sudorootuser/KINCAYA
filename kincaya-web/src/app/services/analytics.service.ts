import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

import { AnalyticsSummary } from '../interfaces/analytics.interface';
import { Lead } from '../interfaces/lead.interface';
import { LeadService } from './lead.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  readonly summary$: Observable<AnalyticsSummary>;

  constructor(
    private readonly leadService: LeadService,
    private readonly productService: ProductService,
  ) {
    this.summary$ = combineLatest([this.leadService.leads$, this.productService.products$]).pipe(
      map(([leads]) => this.buildSummary(leads)),
    );
  }

  private buildSummary(leads: Lead[]): AnalyticsSummary {
    const totalLeads = leads.length;
    const pdfsGenerados = leads.filter((lead) => lead.pdfGenerated).length;
    const aperturasWhatsapp = leads.filter((lead) => lead.whatsappOpened).length;

    const byProduct = new Map<string, number>();
    const byDay = new Map<string, number>();

    leads.forEach((lead) => {
      const dayKey = lead.fechaIso.slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);

      lead.productos.forEach((item) => {
        byProduct.set(item.nombre, (byProduct.get(item.nombre) ?? 0) + item.cantidad);
      });
    });

    const productosMasConsultados = Array.from(byProduct.entries())
      .map(([nombre, totalConsultas]) => ({ nombre, totalConsultas }))
      .sort((a, b) => b.totalConsultas - a.totalConsultas)
      .slice(0, 5);

    const consultasPorDia = Array.from(byDay.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      totalLeads,
      pdfsGenerados,
      aperturasWhatsapp,
      productosMasConsultados,
      consultasPorDia,
    };
  }
}
