import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-page">
      <article class="login-card">
        <h1>Acceso administrativo</h1>
        <p>Modo simulado activo. Usuario: admin@kincaya.com / Admin123*</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            Correo
            <input type="email" formControlName="email" placeholder="admin@kincaya.com" />
          </label>

          <label>
            Contrasena
            <input type="password" formControlName="password" placeholder="********" />
          </label>

          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <small class="error" *ngIf="error()">{{ error() }}</small>
      </article>
    </section>
  `,
  styles: [
    `
      .login-page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at 12% 18%, #193a6a 0%, #0b1a30 45%, #070e1c 100%);
        padding: 20px;
      }

      .login-card {
        width: min(460px, 100%);
        border-radius: 16px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 16px 44px rgba(9, 20, 35, 0.35);
      }

      h1 {
        margin: 0 0 8px;
        color: #0f1d36;
      }

      p {
        margin: 0 0 20px;
        color: #61718b;
      }

      form {
        display: grid;
        gap: 12px;
      }

      label {
        display: grid;
        gap: 6px;
        color: #22314a;
      }

      input {
        border: 1px solid #cfdae8;
        border-radius: 10px;
        padding: 10px 12px;
      }

      button {
        margin-top: 4px;
        border: none;
        border-radius: 10px;
        padding: 11px;
        color: white;
        background: #1c4f8f;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.6;
        cursor: default;
      }

      .error {
        color: #af1d2f;
        display: block;
        margin-top: 12px;
      }
    `,
  ],
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['admin@kincaya.com', [Validators.required, Validators.email]],
    password: ['Admin123*', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        const redirectTo =
          this.route.snapshot.queryParamMap.get('redirectTo') || '/admin/dashboard';
        this.loading.set(false);
        this.router.navigateByUrl(redirectTo);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message || 'No fue posible iniciar sesion.');
      },
    });
  }
}
