export const environment = {
  production: true,
  firebase: {
    apiKey: 'REEMPLAZAR_API_KEY',
    authDomain: 'REEMPLAZAR_AUTH_DOMAIN',
    projectId: 'REEMPLAZAR_PROJECT_ID',
    storageBucket: 'REEMPLAZAR_STORAGE_BUCKET',
    messagingSenderId: 'REEMPLAZAR_MESSAGING_SENDER_ID',
    appId: 'REEMPLAZAR_APP_ID',
  },
  publicDataSource: {
    // Mientras no exista backend productivo real, mantener consumo desde JSON local.
    mode: 'local-json',
    // Cuando actives API real: coloca URL valida y cambia mode a 'api-http'.
    apiBaseUrl: '',
    endpoints: {
      products: '/catalog/products',
      homeContent: '/content/home',
      testimonials: '/content/testimonials',
    },
    requestTimeoutMs: 10000,
  },
  adminDataSource: {
    // Cambiar a 'firebase' cuando conectes AngularFire + Firestore/Auth.
    mode: 'local-simulated',
    // En simulacion permanece false. Para envio real: true.
    sendEnabled: false,
    // Si usas API HTTP para admin, cambia esta URL.
    apiBaseUrl: 'https://api.tu-dominio.com/v1',
    endpoints: {
      leads: '/admin/leads',
      products: '/admin/products',
      analytics: '/admin/analytics',
      authLogin: '/admin/auth/login',
    },
    requestTimeoutMs: 10000,
  },
} as const;
