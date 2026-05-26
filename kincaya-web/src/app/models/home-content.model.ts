export interface HomeHeroKpi {
  value: string;
  label: string;
}

export interface HomeFloatingCard {
  label: string;
  value: string;
}

export interface HomeCollection {
  title: string;
  description: string;
  category: string;
  image: string;
}

export interface HomeTestimonial {
  name: string;
  role: string;
  quote: string;
  score: string;
}

export interface HomeContent {
  hero: {
    tag: string;
    titleLead: string;
    titleHighlight: string;
    description: string;
    primaryActionLabel: string;
    primaryActionHref: string;
    secondaryActionLabel: string;
    secondaryActionHref: string;
    kpis: HomeHeroKpi[];
    floatingCards: HomeFloatingCard[];
  };
  trust: {
    stats: HomeHeroKpi[];
  };
  collections: {
    sectionTitle: string;
    sectionDescription: string;
    items: HomeCollection[];
  };
  featured: {
    sectionTitle: string;
    sectionDescription: string;
  };
  offer: {
    sectionTag: string;
    sectionTitle: string;
    sectionDescription: string;
    discountRate: number;
    viewLabel: string;
    addLabel: string;
  };
  catalog: {
    sectionTitle: string;
    sectionDescription: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearchLabel: string;
    featuredOnlyLabel: string;
    sortLabel: string;
    resetFiltersLabel: string;
    resultSuffix: string;
    emptyTitle: string;
    emptyDescription: string;
    emptyCtaLabel: string;
  };
  testimonials: {
    sectionTitle: string;
    sectionDescription: string;
    items: HomeTestimonial[];
  };
  metrics: {
    sectionTitle: string;
    sectionDescription: string;
    labels: {
      visits: string;
      productViews: string;
      addsToCart: string;
      checkoutIntents: string;
      addToViewRate: string;
      checkoutRate: string;
    };
  };
  badges: {
    topSales: string;
    offer: string;
    new: string;
  };
}
