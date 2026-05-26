import { Injectable, computed, signal } from '@angular/core';

import { InvoiceSnapshot } from './invoice-pdf.service';

export type OrderHistoryEntry = {
  id: string;
  createdAtIso: string;
  snapshot: InvoiceSnapshot;
};

const COOKIE_KEY = 'kincaya_order_history_v1';
const STORAGE_KEY = 'kincaya_order_history_v1';
const MAX_HISTORY_ITEMS = 20;
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 180;

@Injectable({
  providedIn: 'root',
})
export class OrderHistoryService {
  private readonly entriesState = signal<OrderHistoryEntry[]>(this.readStoredEntries());

  readonly entries = computed(() => this.entriesState());

  add(snapshot: InvoiceSnapshot): OrderHistoryEntry {
    const createdAtIso = new Date().toISOString();
    const entry: OrderHistoryEntry = {
      id: `${snapshot.reference}-${createdAtIso}`,
      createdAtIso,
      snapshot,
    };

    this.entriesState.update((current) => [entry, ...current].slice(0, MAX_HISTORY_ITEMS));
    this.persist();
    return entry;
  }

  remove(entryId: string): void {
    this.entriesState.update((current) => current.filter((entry) => entry.id !== entryId));
    this.persist();
  }

  clear(): void {
    this.entriesState.set([]);
    this.persist();
  }

  private readStoredEntries(): OrderHistoryEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const cookiePayload = this.readCookie(COOKIE_KEY);
    const parsedFromCookie = this.parseEntries(cookiePayload);
    if (parsedFromCookie.length > 0) {
      return parsedFromCookie;
    }

    const rawLocal = window.localStorage.getItem(STORAGE_KEY);
    const parsedFromLocal = this.parseEntries(rawLocal);
    if (parsedFromLocal.length > 0) {
      this.writeCookie(COOKIE_KEY, JSON.stringify(parsedFromLocal));
      return parsedFromLocal;
    }

    return [];
  }

  private parseEntries(raw: string | null): OrderHistoryEntry[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as OrderHistoryEntry[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((entry) => {
          const id = String(entry?.id ?? '').trim();
          const createdAtIso = String(entry?.createdAtIso ?? '').trim();
          const snapshot = entry?.snapshot as InvoiceSnapshot | undefined;

          if (!id || !createdAtIso || !snapshot || !Array.isArray(snapshot.items)) {
            return null;
          }

          return {
            id,
            createdAtIso,
            snapshot,
          } satisfies OrderHistoryEntry;
        })
        .filter((entry): entry is OrderHistoryEntry => entry !== null)
        .slice(0, MAX_HISTORY_ITEMS);
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const payload = JSON.stringify(this.entriesState());
    window.localStorage.setItem(STORAGE_KEY, payload);
    this.writeCookie(COOKIE_KEY, payload);
  }

  private writeCookie(key: string, value: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_TTL_SECONDS}; SameSite=Lax`;
  }

  private readCookie(key: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const entries = document.cookie.split(';').map((part) => part.trim());
    const pair = entries.find((part) => part.startsWith(`${key}=`));
    if (!pair) {
      return null;
    }

    const encodedValue = pair.slice(key.length + 1);
    try {
      return decodeURIComponent(encodedValue);
    } catch {
      return null;
    }
  }
}
