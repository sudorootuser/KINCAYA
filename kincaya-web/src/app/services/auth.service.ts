import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import { DataTransportService } from '../core/transport/data-transport.service';
import { AdminUser } from '../interfaces/user.interface';

const SESSION_STORAGE_KEY = 'kincaya_admin_session_v1';
const SIMULATED_CREDENTIALS = {
  email: 'admin@kincaya.com',
  password: 'Admin123*',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userState = signal<AdminUser | null>(this.readSession());

  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => this.userState() !== null);

  constructor(private readonly transport: DataTransportService) {}

  login(email: string, password: string): Observable<AdminUser> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return throwError(() => new Error('Credenciales invalidas.'));
    }

    if (
      normalizedEmail !== SIMULATED_CREDENTIALS.email ||
      password !== SIMULATED_CREDENTIALS.password
    ) {
      return throwError(() => new Error('Usuario o clave incorrectos en simulacion.'));
    }

    const user: AdminUser = {
      uid: 'sim-admin-001',
      email: normalizedEmail,
      displayName: 'Administrador Kincaya',
      lastLoginAtIso: new Date().toISOString(),
    };

    this.userState.set(user);
    this.persistSession(user);

    this.transport.enqueue('auth.login', {
      email: normalizedEmail,
      simulated: true,
      at: user.lastLoginAtIso,
    });

    return of(user).pipe(delay(280));
  }

  logout(): void {
    const email = this.userState()?.email ?? null;
    this.userState.set(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    this.transport.enqueue('auth.logout', {
      email,
      at: new Date().toISOString(),
    });
  }

  private readSession(): AdminUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AdminUser;
      if (!parsed?.uid || !parsed?.email) {
        return null;
      }

      return {
        uid: parsed.uid,
        email: parsed.email,
        displayName: parsed.displayName ?? 'Administrador Kincaya',
        lastLoginAtIso: parsed.lastLoginAtIso ?? new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  private persistSession(user: AdminUser): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }
}
