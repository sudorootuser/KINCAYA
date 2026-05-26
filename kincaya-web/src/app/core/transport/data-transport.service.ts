import { Injectable } from '@angular/core';

import { ADMIN_DATA_SOURCE_CONFIG } from '../config/admin-data-source.config';

export interface OutboxEntry {
  id: string;
  createdAtIso: string;
  channel: string;
  payload: unknown;
  simulated: boolean;
  delivered: boolean;
}

const OUTBOX_STORAGE_KEY = 'kincaya_admin_outbox_v1';

@Injectable({
  providedIn: 'root',
})
export class DataTransportService {
  enqueue(channel: string, payload: unknown): OutboxEntry {
    const entry: OutboxEntry = {
      id: `${channel}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAtIso: new Date().toISOString(),
      channel,
      payload,
      simulated: ADMIN_DATA_SOURCE_CONFIG.mode === 'local-simulated',
      delivered: false,
    };

    const queue = this.readOutbox();
    queue.unshift(entry);
    this.writeOutbox(queue.slice(0, 300));

    if (!ADMIN_DATA_SOURCE_CONFIG.sendEnabled) {
      console.info('[DataTransport][SIMULATED] Payload preparado, no enviado.', {
        mode: ADMIN_DATA_SOURCE_CONFIG.mode,
        channel,
        endpoint: this.resolveEndpoint(channel),
        payload,
      });
      return entry;
    }

    // Real network transport intentionally pending until backend/Firebase setup is completed.
    // Firebase migration guide: FIREBASE_MIGRATION_SIMULADA.md
    console.warn('[DataTransport] sendEnabled=true pero transporte real no implementado aun.', {
      mode: ADMIN_DATA_SOURCE_CONFIG.mode,
      channel,
    });

    return entry;
  }

  getOutbox(): OutboxEntry[] {
    return this.readOutbox();
  }

  clearOutbox(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(OUTBOX_STORAGE_KEY);
  }

  private resolveEndpoint(channel: string): string {
    const config = ADMIN_DATA_SOURCE_CONFIG;
    const base = config.apiBaseUrl.replace(/\/$/, '');

    if (channel.includes('lead')) {
      return `${base}${config.endpoints.leads}`;
    }

    if (channel.includes('product')) {
      return `${base}${config.endpoints.products}`;
    }

    if (channel.includes('analytics')) {
      return `${base}${config.endpoints.analytics}`;
    }

    if (channel.includes('auth')) {
      return `${base}${config.endpoints.authLogin}`;
    }

    return base;
  }

  private readOutbox(): OutboxEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as OutboxEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeOutbox(entries: OutboxEntry[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(entries));
  }
}
