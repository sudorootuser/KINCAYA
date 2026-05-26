# Migracion Simulada a Firebase (Backend)

Este documento muestra, con ejemplos comentados, que cambiar en tu arquitectura actual para pasar de modo simulado local a Firebase real.

Estado actual:

- La app guarda en localStorage.
- El transporte usa outbox y logs.
- No envia datos reales al servidor.

Objetivo de este ejemplo:

- Mantener UI y servicios de negocio.
- Cambiar solo infraestructura (auth + persistencia + transporte).

## Decision rapida: que opcion es mas valida

La opcion mas valida es esta combinacion:

- Documentacion central en este MD (fuente de verdad).
- Comentarios cortos dentro de environment para recordar switches rapidos.

### TL;DR

- Si vas a consumir backend HTTP (API): en este proyecto normalmente basta ajustar variables en environment.
- Si vas a consumir Firebase real: ademas de variables, debes activar providers y cambiar la implementacion de transporte/auth como se explica abajo.

### Variables que cambias cuando solo activas API HTTP

En src/environments/environment.ts (o environment.development.ts):

- publicDataSource.mode = 'api-http'
- publicDataSource.apiBaseUrl = URL real
- publicDataSource.endpoints.products
- publicDataSource.endpoints.homeContent
- publicDataSource.endpoints.testimonials
- adminDataSource.mode = 'api-http' (si admin tambien va por API)
- adminDataSource.sendEnabled = true
- adminDataSource.apiBaseUrl y endpoints

Nota importante: si dejas mode en api-http pero apiBaseUrl no es valida, la app hace fallback automatico a JSON local para no romper catalogo.

## 1) Instalar dependencias

Comando sugerido:

```bash
npm i firebase @angular/fire
```

## 2) Configurar variables Firebase

Crear el archivo de ambiente con tu proyecto real, por ejemplo en src/environments/environment.ts:

```ts
export const environment = {
  production: false,
  firebase: {
    apiKey: 'TU_API_KEY',
    authDomain: 'tu-proyecto.firebaseapp.com',
    projectId: 'tu-proyecto',
    storageBucket: 'tu-proyecto.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abcdef',
  },
};
```

## 3) Activar providers Firebase en app.config

En src/app/app.config.ts, agrega providers de AngularFire.

Ejemplo comentado:

```ts
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...providers actuales

    // Inicializa Firebase App
    provideFirebaseApp(() => initializeApp(environment.firebase)),

    // Habilita Firebase Authentication
    provideAuth(() => getAuth()),

    // Habilita Firestore
    provideFirestore(() => getFirestore()),
  ],
};
```

## 4) Cambiar el modo de data source

En src/app/core/config/admin-data-source.config.ts:

- Antes:

```ts
export const ADMIN_DATA_SOURCE_CONFIG: AdminDataSourceConfig = LOCAL_SIMULATION_CONFIG;
```

- Para Firebase:

```ts
export const ADMIN_DATA_SOURCE_CONFIG: AdminDataSourceConfig = FIREBASE_CONFIG;
```

Nota:

- Puedes dejar sendEnabled=true en modo firebase.
- El endpoint HTTP no se usa en Firestore.

## 5) Reemplazo del transporte simulado por Firestore

Tu clase actual DataTransportService ya centraliza envio. Esta es la mejor pieza para cambiar sin tocar pantallas.

Ejemplo simulado (comentado) para src/app/core/transport/data-transport.service.ts:

```ts
import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, serverTimestamp } from '@angular/fire/firestore';

import { ADMIN_DATA_SOURCE_CONFIG } from '../config/admin-data-source.config';

@Injectable({ providedIn: 'root' })
export class DataTransportService {
  private readonly firestore = inject(Firestore);

  async enqueue(channel: string, payload: unknown) {
    // 1) Mantener outbox local para trazabilidad (opcional)
    // 2) Si modo firebase, persistir en coleccion correspondiente

    if (ADMIN_DATA_SOURCE_CONFIG.mode === 'firebase') {
      const target = this.resolveCollection(channel); // leads, products, analytics, events

      await addDoc(collection(this.firestore, target), {
        channel,
        payload,
        createdAt: serverTimestamp(),
        source: 'kincaya-web',
      });

      // Log para verificar flujo durante rollout
      console.info('[DataTransport][FIREBASE] Documento guardado', { channel, target });
      return;
    }

    // Modo simulado actual
    console.info('[DataTransport][SIMULATED] Payload preparado, no enviado', { channel, payload });
  }

  private resolveCollection(channel: string): string {
    if (channel.includes('lead')) return 'leads';
    if (channel.includes('product')) return 'products';
    if (channel.includes('analytics')) return 'analytics_events';
    if (channel.includes('auth')) return 'auth_events';
    return 'events';
  }
}
```

## 6) Migrar AuthService a Firebase Auth

Servicio actual usa credenciales fijas. Cambiar por signInWithEmailAndPassword.

Ejemplo simulado:

```ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly userState = signal<any | null>(null);

  readonly isAuthenticated = computed(() => this.userState() !== null);

  constructor() {
    // Persistencia de sesion la maneja Firebase Auth
    onAuthStateChanged(this.auth, (user) => {
      this.userState.set(user);
    });
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((cred) => ({
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName ?? 'Administrador Kincaya',
        lastLoginAtIso: new Date().toISOString(),
      })),
    );
  }

  logout(): void {
    void signOut(this.auth);
  }
}
```

## 7) Estructura recomendada de colecciones Firestore

Mantener colecciones simples para MVP:

- leads
- products
- analytics_events
- auth_events

Documento lead recomendado:

```json
{
  "sessionId": "sess-...",
  "fecha": "serverTimestamp",
  "productos": [{ "nombre": "Producto X", "cantidad": 2 }],
  "whatsappOpened": true,
  "pdfGenerated": true,
  "origen": "checkout_whatsapp",
  "estado": "nuevo"
}
```

## 8) Que NO cambiar (para mantener estabilidad)

No cambies estas piezas por ahora:

- pantallas admin
- rutas admin y guard
- flujo UI de carrito y WhatsApp
- servicios de negocio (LeadService, ProductService, AnalyticsService)

Solo cambia:

- providers (app.config)
- modo en admin-data-source.config
- implementacion de DataTransportService
- autenticacion en AuthService

## 9) Plan de rollout seguro (recomendado)

1. Activar Firebase en dev.
2. Mantener logs + outbox durante 1 semana.
3. Verificar conteos entre local vs Firestore.
4. Cuando valides, desactivar outbox opcional.

## 10) Checklist rapido

- Dependencias instaladas (firebase y angular/fire).
- Providers Firebase activos en app.config.
- Modo FIREBASE_CONFIG activo.
- DataTransport guardando en Firestore.
- AuthService usando Firebase Auth.
- Login admin funcional en /admin/login.
- Captura de leads funcionando antes de abrir WhatsApp.
