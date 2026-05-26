import { Injectable, computed, inject, signal } from '@angular/core';

import { HomeContent } from '../models/home-content.model';
import { HOME_CONTENT_REPOSITORY } from '../repositories/home-content.repository';

const DEFAULT_HOME_CONTENT: HomeContent = {
  hero: {
    tag: 'Asesoria real + tecnologia que simplifica tu dia',
    titleLead: 'Equipos confiables para',
    titleHighlight: 'hogar, oficina y negocio.',
    highlightOptions: ['hogar y oficina.', 'tecnologia diaria.', 'negocio y trabajo.'],
    description:
      'Compra en minutos, recibe recomendacion personalizada y confirma pedido por WhatsApp con seguimiento real.',
    kpisAriaLabel: 'Beneficios principales',
    scrollCueAriaLabel: 'Deslizar hasta el catalogo de productos',
    scrollCueText: 'Desliza para ver productos',
    primaryActionLabel: 'Comprar ahora',
    primaryActionHref: '#products',
    secondaryActionLabel: 'Ver oferta semanal',
    secondaryActionHref: '#offer',
    kpis: [
      { value: '4.9/5', label: 'valoracion promedio' },
      { value: '< 24h', label: 'respuesta por WhatsApp' },
      { value: 'Garantia', label: 'soporte post compra' },
    ],
    floatingCards: [
      { label: 'Entrega rapida', value: '24-48 horas' },
      { label: 'Asesoria experta', value: '1 a 1 por chat' },
    ],
  },
  trust: {
    ariaLabel: 'Prueba social',
    stats: [
      { value: '+850', label: 'pedidos completados' },
      { value: '98%', label: 'satisfaccion de clientes' },
      { value: '100%', label: 'acompanamiento por WhatsApp' },
      { value: '7 dias', label: 'garantia de cambio' },
    ],
  },
  collections: {
    ariaLabel: 'Colecciones destacadas',
    sectionTitle: 'Compra por necesidad',
    sectionDescription:
      'Elige una coleccion y te mostramos productos listos para resolver ese escenario.',
    exploreLabel: 'Explorar',
    items: [],
  },
  featured: {
    sectionTitle: 'Destacados Kincaya',
    sectionDescription: 'Productos con mejor relacion entre rendimiento, confianza y demanda.',
    viewPhotosLabel: 'Ver fotos',
    addLabel: 'Agregar',
  },
  offer: {
    ariaLabel: 'Oferta semanal',
    sectionTag: 'Oferta semanal',
    sectionTitle: 'Descuento especial del 15%',
    sectionDescription:
      'Solo por esta semana en uno de nuestros productos favoritos para clientes frecuentes.',
    discountRate: 0.15,
    viewLabel: 'Ver oferta',
    addLabel: 'Agregar al carrito',
  },
  catalog: {
    sectionTitle: 'Catalogo de productos',
    sectionDescription: 'Busca, filtra y compara para comprar con mayor claridad.',
    filtersAriaLabel: 'Filtrar productos por categoria',
    advancedFiltersAriaLabel: 'Filtros avanzados',
    paginationAriaLabel: 'Paginacion de productos',
    prevPageLabel: 'Anterior',
    nextPageLabel: 'Siguiente',
    quickViewLabel: 'Ver',
    addToCartLabel: 'Agregar',
    searchLabel: 'Buscar producto',
    searchPlaceholder: 'Ejemplo: camara, audio, smartwatch',
    clearSearchLabel: 'Limpiar',
    featuredOnlyLabel: 'Solo destacados',
    sortLabel: 'Ordenar',
    resetFiltersLabel: 'Reset filtros',
    resultSuffix: 'resultados',
    emptyTitle: 'Sin resultados',
    emptyDescription:
      'Prueba con otra categoria, rango de precio o cambia tu busqueda para encontrar mas opciones.',
    emptyCtaLabel: 'Ver todo el catalogo',
  },
  testimonials: {
    ariaLabel: 'Opiniones de clientes',
    sectionTitle: 'Lo que dicen nuestros clientes',
    sectionDescription: 'Experiencias reales de compra con asesoria personalizada.',
    prevButtonLabel: 'Testimonio anterior',
    nextButtonLabel: 'Testimonio siguiente',
    navigationAriaLabel: 'Navegar testimonios',
    goToItemPrefix: 'Ir al testimonio',
    starsSuffix: 'de 5 estrellas',
    emptyTitle: 'Pronto publicaremos nuevos comentarios',
    emptyDescription:
      'Esta seccion se conectara a la base de datos para mostrar opiniones reales de clientes.',
    items: [],
  },
  metrics: {
    ariaLabel: 'Metricas de conversion',
    sectionTitle: 'Panel de conversion',
    sectionDescription:
      'Datos de interaccion capturados en la app para optimizar experiencia y ventas.',
    activityLabel: 'Actividad en sesion',
    conversionLabel: 'Tasas de conversion',
    labels: {
      visits: 'Visitas',
      productViews: 'Vistas de producto',
      addsToCart: 'Agregados a carrito',
      checkoutIntents: 'Intencion de checkout',
      addToViewRate: 'Tasa ver a carrito',
      checkoutRate: 'Tasa carrito a checkout',
    },
  },
  badges: {
    topSales: 'Top ventas',
    offer: 'Oferta',
    new: 'Nuevo',
  },
};

@Injectable({
  providedIn: 'root',
})
export class HomeContentService {
  private readonly repository = inject(HOME_CONTENT_REPOSITORY);

  private readonly contentState = signal<HomeContent>(DEFAULT_HOME_CONTENT);
  private readonly loadedState = signal(false);
  private readonly loadingState = signal(false);

  readonly content = computed(() => this.contentState());
  readonly loaded = computed(() => this.loadedState());

  constructor() {
    this.ensureLoaded();
  }

  ensureLoaded(): void {
    if (this.loadedState() || this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    this.repository.getHomeContent().subscribe({
      next: (response) => {
        this.contentState.set({ ...DEFAULT_HOME_CONTENT, ...response });
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
      error: () => {
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
    });
  }
}
