import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InvoiceSnapshot, InvoicePdfService } from '../../services/invoice-pdf.service';
import { OrderHistoryEntry, OrderHistoryService } from '../../services/order-history.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css',
})
export class HistoryComponent {
  private readonly phoneNumber = '573227405024';

  private readonly historyService = inject(OrderHistoryService);
  private readonly invoicePdfService = inject(InvoicePdfService);

  protected readonly entries = this.historyService.entries;
  protected readonly hasEntries = computed(() => this.entries().length > 0);

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  protected formatDate(createdAtIso: string): string {
    const date = new Date(createdAtIso);
    return date.toLocaleString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  protected async previewPdf(entry: OrderHistoryEntry): Promise<void> {
    await this.invoicePdfService.openInvoicePreview(entry.snapshot);
  }

  protected async downloadPdf(entry: OrderHistoryEntry): Promise<void> {
    await this.invoicePdfService.downloadTemporaryInvoice(entry.snapshot, 'factura-historial');
  }

  protected resendToWhatsApp(entry: OrderHistoryEntry): void {
    if (typeof window === 'undefined') {
      return;
    }

    const message = this.buildWhatsAppMessage(entry.snapshot);
    const url = `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected removeEntry(entryId: string): void {
    this.historyService.remove(entryId);
  }

  protected clearAllHistory(): void {
    this.historyService.clear();
  }

  private buildWhatsAppMessage(snapshot: InvoiceSnapshot): string {
    const line = '---------------------';
    const thick = '=====================';

    const productLines = snapshot.items.flatMap((item) => [
      `- *${item.name}*`,
      `  ${item.quantity} unid. x $${item.unitPrice.toFixed(2)} = *$${item.total.toFixed(2)}*`,
    ]);

    const shippingLine =
      snapshot.shipping === 0
        ? `  Envio:      *GRATIS*`
        : `  Envio:      *$${snapshot.shipping.toFixed(2)}*`;

    return [
      `*PEDIDO - KINCAYA*`,
      thick,
      `Fecha:  ${snapshot.date}`,
      `Ref:    #${snapshot.reference}`,
      thick,
      '',
      `*PRODUCTOS SOLICITADOS*`,
      line,
      ...productLines,
      line,
      '',
      `*RESUMEN*`,
      `  Subtotal:   *$${snapshot.subtotal.toFixed(2)}*`,
      shippingLine,
      `  ---------------------`,
      `  TOTAL:      *$${snapshot.total.toFixed(2)}*`,
      '',
      thick,
      `_Reenvio del pedido desde historial._`,
      `_Por favor confirmar disponibilidad y tiempo de envio._`,
      `_Atencion personalizada en menos de 24 horas._`,
    ].join('\n');
  }
}
