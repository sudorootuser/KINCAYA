import { Injectable } from '@angular/core';

export type InvoiceLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceSnapshot = {
  date: string;
  reference: string;
  items: InvoiceLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

@Injectable({
  providedIn: 'root',
})
export class InvoicePdfService {
  async downloadTemporaryInvoice(snapshot: InvoiceSnapshot): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 40;
    const marginRight = pageWidth - 40;
    let y = 54;

    doc.setFillColor(59, 155, 198);
    doc.roundedRect(marginLeft, y - 22, pageWidth - 80, 92, 10, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('KINCAYA', marginLeft + 16, y + 6);
    doc.setFontSize(12);
    doc.text('Factura temporal de pedido', marginLeft + 16, y + 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${snapshot.date}`, marginLeft + 16, y + 44);
    doc.text(`Referencia: ${snapshot.reference}`, marginLeft + 16, y + 58);

    doc.setFillColor(255, 244, 204);
    doc.roundedRect(pageWidth - 195, y + 6, 140, 28, 7, 7, 'F');
    doc.setTextColor(132, 90, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DOCUMENTO TEMPORAL', pageWidth - 125, y + 24, { align: 'center' });

    doc.setTextColor(210, 220, 230);
    doc.setFontSize(32);
    doc.text('FACTURA TEMPORAL', pageWidth / 2, 430, { align: 'center', angle: 30 });

    doc.setTextColor(20, 31, 44);
    y += 92;
    doc.setDrawColor(210, 220, 230);
    doc.line(marginLeft, y, marginRight, y);
    y += 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detalle de productos', marginLeft, y);

    y += 14;
    doc.setFillColor(234, 243, 250);
    doc.roundedRect(marginLeft, y, pageWidth - 80, 22, 4, 4, 'F');
    doc.setFontSize(10);
    doc.text('Descripcion', marginLeft + 8, y + 14);
    doc.text('Cant.', 330, y + 14);
    doc.text('Unitario', 388, y + 14);
    doc.text('Total', 478, y + 14);

    y += 34;

    doc.setFont('helvetica', 'normal');
    snapshot.items.forEach((item) => {
      const safeName = item.name.length > 38 ? `${item.name.slice(0, 35)}...` : item.name;
      doc.text(safeName, marginLeft, y);
      doc.text(String(item.quantity), 330, y);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 380, y);
      doc.text(`$${item.total.toFixed(2)}`, 470, y);
      doc.setDrawColor(236, 240, 245);
      doc.line(marginLeft, y + 6, marginRight, y + 6);
      y += 18;

      if (y > 730) {
        doc.addPage();
        y = 66;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(59, 155, 198);
        doc.text(`KINCAYA | Factura temporal #${snapshot.reference}`, marginLeft, y);
        doc.setTextColor(20, 31, 44);
        y += 16;
      }
    });

    y += 10;
    doc.setFillColor(247, 250, 253);
    doc.roundedRect(330, y, 210, 74, 6, 6, 'F');
    y += 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Subtotal: $${snapshot.subtotal.toFixed(2)}`, 344, y);
    y += 16;
    doc.text(
      snapshot.shipping === 0 ? 'Envio: GRATIS' : `Envio: $${snapshot.shipping.toFixed(2)}`,
      344,
      y,
    );
    y += 16;
    doc.setTextColor(9, 76, 111);
    doc.setFontSize(12);
    doc.text(`TOTAL: $${snapshot.total.toFixed(2)}`, 344, y);

    y += 26;
    doc.setTextColor(20, 31, 44);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      'Este documento es informativo y temporal. La factura final sera emitida por Kincaya.',
      marginLeft,
      y,
    );
    y += 14;
    doc.text('Soporte y confirmacion por WhatsApp en menos de 24 horas.', marginLeft, y);

    doc.save(`factura-${snapshot.reference}.pdf`);
  }
}
