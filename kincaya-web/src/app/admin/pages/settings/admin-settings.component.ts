import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { CurrencyCode, StoreSettingsService } from '../../../services/store-settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="settings-page">
      <header>
        <h1>Configuracion de la tienda</h1>
        <p>Personaliza los parametros globales de tu tienda. Los cambios se guardan automaticamente.</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="save()" class="settings-form">
        <div class="settings-grid">
          <label class="field">
            <span>Nombre de la tienda</span>
            <input type="text" formControlName="storeName" />
          </label>

          <label class="field">
            <span>Telefono WhatsApp</span>
            <input type="text" formControlName="phoneNumber" />
          </label>

          <label class="field">
            <span>Moneda</span>
            <select formControlName="currency">
              <option value="COP">COP — Peso colombiano</option>
              <option value="USD">USD — Dolar estadounidense</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </label>

          <label class="field">
            <span>Envio gratis a partir de</span>
            <input type="number" formControlName="freeShippingThreshold" min="0" />
          </label>
        </div>

        <div class="actions">
          <button type="submit" class="save-btn">Guardar cambios</button>
          @if (saved()) {
          <span class="saved-msg">Guardado ✓</span>
          }
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .settings-page {
        padding: 1.5rem;
      }

      header {
        margin-bottom: 1.2rem;
      }

      h1 {
        margin: 0;
        color: #0f1d36;
        font-size: 1.4rem;
      }

      header p {
        margin: 0.3rem 0 0;
        color: #61718b;
        font-size: 0.9rem;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .field {
        display: grid;
        gap: 0.35rem;
      }

      .field span {
        font-weight: 600;
        font-size: 0.85rem;
        color: #22314a;
      }

      .field input,
      .field select {
        border: 1px solid #cfdae8;
        border-radius: 0.55rem;
        padding: 0.55rem 0.7rem;
        font-size: 0.9rem;
        color: #1a202c;
        background: #ffffff;
      }

      .field input:focus,
      .field select:focus {
        outline: 2px solid rgb(59 155 198 / 30%);
        border-color: #3b9bc6;
      }

      .actions {
        margin-top: 1.2rem;
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }

      .save-btn {
        border: 0;
        border-radius: 0.6rem;
        padding: 0.6rem 1.2rem;
        background: linear-gradient(145deg, #49add9, #2f8fba);
        color: white;
        font-weight: 700;
        cursor: pointer;
        transition: box-shadow 200ms ease;
      }

      .save-btn:hover {
        box-shadow: 0 6px 16px rgb(59 155 198 / 30%);
      }

      .saved-msg {
        color: #15803d;
        font-weight: 700;
        font-size: 0.85rem;
      }

      @media (max-width: 640px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(StoreSettingsService);
  protected readonly saved = signal(false);

  private readonly current = this.settingsService.settings();

  readonly form = this.fb.nonNullable.group({
    storeName: [this.current.storeName],
    phoneNumber: [this.current.phoneNumber],
    currency: [this.current.currency as CurrencyCode],
    freeShippingThreshold: [this.current.freeShippingThreshold],
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    this.settingsService.update({
      storeName: values.storeName.trim(),
      phoneNumber: values.phoneNumber.trim(),
      currency: values.currency as CurrencyCode,
      freeShippingThreshold: Number(values.freeShippingThreshold) || 0,
    });

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}
