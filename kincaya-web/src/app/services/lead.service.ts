import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { DataTransportService } from '../core/transport/data-transport.service';
import { Lead, LeadProductItem, LeadStatus } from '../interfaces/lead.interface';
import { Product } from '../models/product.model';
import { InvoiceSnapshot } from './invoice-pdf.service';

interface CheckoutLeadInput {
  snapshot: InvoiceSnapshot;
  origen: string;
  pdfGenerated: boolean;
  whatsappOpened: boolean;
}

const LEADS_STORAGE_KEY = 'kincaya_admin_leads_v1';
const SESSION_STORAGE_KEY = 'kincaya_session_id_v1';

@Injectable({
  providedIn: 'root',
})
export class LeadService {
  private readonly sessionId = this.resolveSessionId();
  private readonly leadsSubject = new BehaviorSubject<Lead[]>(this.readStoredLeads());

  readonly leads$: Observable<Lead[]> = this.leadsSubject.asObservable();

  constructor(private readonly transport: DataTransportService) {}

  getSnapshot(): Lead[] {
    return this.leadsSubject.value;
  }

  trackProductConsultation(product: Product): Lead {
    const line: LeadProductItem = {
      nombre: product.name,
      cantidad: 1,
    };

    return this.createLead({
      productos: [line],
      origen: 'consulta_producto',
      pdfGenerated: false,
      whatsappOpened: false,
      estado: 'nuevo',
    });
  }

  trackQuoteRequest(products: LeadProductItem[] = []): Lead {
    return this.createLead({
      productos: products,
      origen: 'solicitud_cotizacion',
      pdfGenerated: false,
      whatsappOpened: true,
      estado: 'nuevo',
    });
  }

  captureCheckoutLead(input: CheckoutLeadInput): Lead {
    const products = input.snapshot.items.map((item) => ({
      nombre: item.name,
      cantidad: this.toSafeQuantity(item.quantity),
    }));

    return this.createLead({
      productos: products,
      origen: input.origen,
      pdfGenerated: input.pdfGenerated,
      whatsappOpened: input.whatsappOpened,
      estado: 'nuevo',
    });
  }

  markWhatsappOpened(leadId: string): void {
    this.patchLead(leadId, { whatsappOpened: true });
  }

  updateStatus(leadId: string, status: LeadStatus): void {
    this.patchLead(leadId, { estado: status });
  }

  private createLead(input: {
    productos: LeadProductItem[];
    origen: string;
    pdfGenerated: boolean;
    whatsappOpened: boolean;
    estado: LeadStatus;
  }): Lead {
    const nowIso = new Date().toISOString();
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: this.sessionId,
      fechaIso: nowIso,
      productos: this.normalizeProducts(input.productos),
      whatsappOpened: Boolean(input.whatsappOpened),
      pdfGenerated: Boolean(input.pdfGenerated),
      origen: (input.origen ?? 'desconocido').trim() || 'desconocido',
      estado: input.estado,
    };

    const next = [lead, ...this.leadsSubject.value].slice(0, 500);
    this.leadsSubject.next(next);
    this.persist(next);

    this.transport.enqueue('lead.create', lead);
    return lead;
  }

  private patchLead(leadId: string, patch: Partial<Lead>): void {
    const next = this.leadsSubject.value.map((lead) =>
      lead.id === leadId
        ? {
            ...lead,
            ...patch,
          }
        : lead,
    );

    this.leadsSubject.next(next);
    this.persist(next);

    this.transport.enqueue('lead.update', {
      leadId,
      patch,
      at: new Date().toISOString(),
    });
  }

  private normalizeProducts(lines: LeadProductItem[]): LeadProductItem[] {
    const map = new Map<string, number>();

    lines.forEach((line) => {
      const nombre = String(line?.nombre ?? '').trim();
      if (!nombre) {
        return;
      }

      const cantidad = this.toSafeQuantity(line.cantidad);
      map.set(nombre, (map.get(nombre) ?? 0) + cantidad);
    });

    return Array.from(map.entries()).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  }

  private toSafeQuantity(value: number): number {
    if (!Number.isFinite(value)) {
      return 1;
    }

    return Math.max(1, Math.floor(value));
  }

  private readStoredLeads(): Lead[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Lead[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persist(leads: Lead[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  }

  private resolveSessionId(): string {
    if (typeof window === 'undefined') {
      return 'ssr-session';
    }

    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const next = `sess-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  }
}
