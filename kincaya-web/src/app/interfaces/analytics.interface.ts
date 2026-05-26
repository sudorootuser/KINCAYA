export interface AnalyticsTopProduct {
  nombre: string;
  totalConsultas: number;
}

export interface DailyLeadMetric {
  fecha: string;
  total: number;
}

export interface AnalyticsSummary {
  totalLeads: number;
  pdfsGenerados: number;
  aperturasWhatsapp: number;
  productosMasConsultados: AnalyticsTopProduct[];
  consultasPorDia: DailyLeadMetric[];
}
