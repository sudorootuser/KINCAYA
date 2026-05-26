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
    highlightOptions: string[];
    description: string;
    kpisAriaLabel: string;
    scrollCueAriaLabel: string;
    scrollCueText: string;
    primaryActionLabel: string;
    primaryActionHref: string;
    secondaryActionLabel: string;
    secondaryActionHref: string;
    kpis: HomeHeroKpi[];
    floatingCards: HomeFloatingCard[];
  };
  trust: {
    ariaLabel: string;
    stats: HomeHeroKpi[];
  };
  collections: {
    ariaLabel: string;
    sectionTitle: string;
    sectionDescription: string;
    exploreLabel: string;
    items: HomeCollection[];
  };
  featured: {
    sectionTitle: string;
    sectionDescription: string;
    viewPhotosLabel: string;
    addLabel: string;
  };
  offer: {
    ariaLabel: string;
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
    filtersAriaLabel: string;
    advancedFiltersAriaLabel: string;
    paginationAriaLabel: string;
    prevPageLabel: string;
    nextPageLabel: string;
    quickViewLabel: string;
    addToCartLabel: string;
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
    ariaLabel: string;
    sectionTitle: string;
    sectionDescription: string;
    prevButtonLabel: string;
    nextButtonLabel: string;
    navigationAriaLabel: string;
    goToItemPrefix: string;
    starsSuffix: string;
    emptyTitle: string;
    emptyDescription: string;
    items: HomeTestimonial[];
  };
  metrics: {
    ariaLabel: string;
    sectionTitle: string;
    sectionDescription: string;
    activityLabel: string;
    conversionLabel: string;
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
