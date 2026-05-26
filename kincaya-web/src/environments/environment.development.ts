export const environment = {
  production: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
  publicDataSource: {
    mode: 'local-json',
    apiBaseUrl: 'http://localhost:3000/api',
    endpoints: {
      products: '/products',
      homeContent: '/home-content',
      testimonials: '/testimonials',
    },
    requestTimeoutMs: 8000,
  },
  adminDataSource: {
    mode: 'local-simulated',
    sendEnabled: false,
    apiBaseUrl: 'http://localhost:3000/api',
    endpoints: {
      leads: '/admin/leads',
      products: '/admin/products',
      analytics: '/admin/analytics',
      authLogin: '/admin/auth/login',
    },
    requestTimeoutMs: 8000,
  },
} as const;
