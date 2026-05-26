import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Lead, LeadStatus } from '../../../interfaces/lead.interface';
import { LeadService } from '../../../services/lead.service';

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header>
        <h1>Leads</h1>
        <p>Registro de consultas, PDF y acciones WhatsApp.</p>
      </header>

      <div class="filters">
        <input [(ngModel)]="searchTerm" placeholder="Buscar por producto, origen o estado" />

        <select [(ngModel)]="statusFilter">
          <option value="all">Todos los estados</option>
          <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
        </select>
      </div>

      <div class="table-wrap" *ngIf="filteredLeads() as rows">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Cantidad</th>
              <th>Origen</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lead of rows">
              <td>{{ lead.fechaIso | date: 'short' }}</td>
              <td>{{ productNames(lead) }}</td>
              <td>{{ productQuantity(lead) }}</td>
              <td>{{ lead.origen }}</td>
              <td>
                <select [ngModel]="lead.estado" (ngModelChange)="changeStatus(lead.id, $event)">
                  <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 14px;
      }

      header h1 {
        margin: 0;
      }

      header p {
        margin: 4px 0 0;
        color: #60718c;
      }

      .filters {
        display: grid;
        grid-template-columns: 1fr 240px;
        gap: 10px;
      }

      input,
      select {
        border: 1px solid #cfdae8;
        border-radius: 10px;
        padding: 9px 10px;
        background: #fff;
      }

      .table-wrap {
        border: 1px solid #dde4f0;
        border-radius: 14px;
        background: #fff;
        overflow: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid #edf1f7;
      }

      th {
        color: #4f617f;
        font-size: 13px;
      }

      @media (max-width: 760px) {
        .filters {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminLeadsComponent {
  private readonly leadService = inject(LeadService);

  readonly statuses: LeadStatus[] = ['nuevo', 'contactado', 'cerrado', 'descartado'];
  readonly leads = signal<Lead[]>([]);

  searchTerm = '';
  statusFilter: 'all' | LeadStatus = 'all';

  constructor() {
    this.leadService.leads$.subscribe((rows) => this.leads.set(rows));
  }

  filteredLeads(): Lead[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.leads().filter((lead) => {
      if (this.statusFilter !== 'all' && lead.estado !== this.statusFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      const haystack = [lead.origen, lead.estado, ...lead.productos.map((item) => item.nombre)]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  productNames(lead: Lead): string {
    return lead.productos.map((item) => item.nombre).join(', ') || 'Sin detalle';
  }

  productQuantity(lead: Lead): number {
    return lead.productos.reduce((acc, item) => acc + item.cantidad, 0);
  }

  changeStatus(leadId: string, status: LeadStatus): void {
    this.leadService.updateStatus(leadId, status);
  }
}
