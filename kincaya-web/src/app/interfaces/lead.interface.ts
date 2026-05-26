export type LeadStatus = 'nuevo' | 'contactado' | 'cerrado' | 'descartado';

export interface LeadProductItem {
  nombre: string;
  cantidad: number;
}

export interface Lead {
  id: string;
  sessionId: string;
  fechaIso: string;
  productos: LeadProductItem[];
  whatsappOpened: boolean;
  pdfGenerated: boolean;
  origen: string;
  estado: LeadStatus;
}
