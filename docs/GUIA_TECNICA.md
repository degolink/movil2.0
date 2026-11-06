# PrestaLab — Guía técnica del ecosistema

> Documento para el equipo: cómo está construido PrestaLab por dentro, qué hace cada
> tecnología, cómo se protege la información y cómo se conectan la app móvil y la web.
>
> **Repositorio:** `degolink/movil2.0`
> **Producción web:** `https://movil2-0.vercel.app`
> **Proyecto Firebase:** `prestalab-f2436`
> **Última actualización:** noviembre de 2026

---

## Índice

1. [Qué es PrestaLab](#1-qué-es-prestalab)
2. [Arquitectura general](#2-arquitectura-general)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Tecnologías y paquetes](#4-tecnologías-y-paquetes)
5. [App móvil en profundidad](#5-app-móvil-en-profundidad)
6. [Web en profundidad](#6-web-en-profundidad)
7. [Seguridad](#7-seguridad)
8. [Base de datos](#8-base-de-datos)
9. [Funciones clave del código](#9-funciones-clave-del-código)
10. [Flujos completos](#10-flujos-completos)
11. [Configuración y ejecución](#11-configuración-y-ejecución)
12. [Estado actual y pendientes](#12-estado-actual-y-pendientes)
13. [Glosario](#13-glosario)

---

## 1. Qué es PrestaLab

PrestaLab es un sistema para gestionar préstamos de equipos y reservas de laboratorios
universitarios. Tiene tres piezas:

| Pieza | Para quién | Qué hace |
| --- | --- | --- |
| **App móvil** (Expo) | Estudiantes y docentes | Ver catálogo, solicitar préstamos, devolver, historial. Funciona sin internet. |
| **Web** (Next.js) | Gestores y administradores | Aprobar/rechazar/reasignar, inventario, salas, usuarios y analítica. |
| **API** (misma web) | La app móvil | Expone `/api/mobile/*` con autenticación por token. |

La regla de oro de la arquitectura actual:

> **La app móvil no habla con Firebase.** Solo habla con la API de PrestaLab.
> Las credenciales de Firebase viven únicamente en el servidor (Vercel).

---

## 2. Arquitectura general

```
┌──────────────────────────┐        HTTPS + Bearer JWT        ┌───────────────────────────┐
│      APP MÓVIL           │ ───────────────────────────────▶ │        API (Vercel)       │
│  React Native + Expo     │ ◀─────────────────────────────── │  Next.js /api/mobile/*    │
│                          │              JSON                │                           │
│  SQLite (caché local)    │                                  │  JWT HS256 + AUTH_SECRET  │
│  Outbox (cola de envío)  │                                  │  Firebase Admin SDK       │
└──────────────────────────┘                                  └─────────────┬─────────────┘
                                                                            │
                                                                            │ Admin SDK
                                                                            ▼
┌──────────────────────────┐                                  ┌───────────────────────────┐
│       WEB (Vercel)       │ ─────────── Admin SDK ─────────▶ │        FIRESTORE          │
│  Next.js App Router      │                                  │  usuarios / salas         │
│  /login /register        │                                  │  articulos / prestamos    │
│  Cookie httpOnly         │                                  │  notificaciones           │
└──────────────────────────┘                                  └───────────────────────────┘
                                                                            ▲
                                                                            │ Identity Toolkit
                                                                  ┌─────────┴─────────┐
                                                                  │   FIREBASE AUTH   │
                                                                  └───────────────────┘
```

### Decisiones importantes

1. **Una sola colección `prestamos`.** Antes existían `solicitudes` y `prestamos` en
   paralelo; eso hacía que una solicitud creada en el móvil no apareciera en la web.
   Hoy todo vive en `prestamos`.
2. **Offline-first en el móvil.** La UI lee siempre de SQLite; el servidor solo se usa
   para sincronizar. Si no hay red, la app sigue funcionando.
3. **Sin `onSnapshot` en el móvil.** El SDK de Firestore en React Native tenía un crash
   interno (`INTERNAL ASSERTION FAILED: b815`, issues #9968/#9794). Se reemplazó por
   *pull* periódico y por eventos locales.
4. **La web es solo para gestores/admin.** El registro crea estudiantes; esos estudiantes
   entran por la app móvil.

---

## 3. Estructura del repositorio

```
movil2.0/
├── README.md                     # presentación general del proyecto
├── docs/
│   ├── INTEGRACION.md            # bitácora de la integración y pendientes
│   └── GUIA_TECNICA.md           # este documento
│
├── prestalab-app-update/         # APP MÓVIL (Expo / React Native)
│   ├── App.js                    # arranque: fuentes, splash, SQLite, sync, navegación
│   ├── app.json                  # configuración de Expo (splash, iconos, plugins)
│   ├── firestore.rules           # reglas de Firestore (heredadas; ver §7.5)
│   └── src/
│       ├── components/           # Brand, SplashScreen, AppTextInput, OfflineBanner…
│       ├── config/               # apiConfig.js (URL de la API)
│       ├── contexts/             # userContext.js (sesión global)
│       ├── data/                 # SQLite + repositorios (fuente de lectura)
│       ├── navegations/          # authStack.js / mainStack.js
│       ├── screens/              # pantallas
│       ├── services/             # apiClient, authService, session, firestoreService
│       ├── sync/                 # outbox, syncEngine, connectivity
│       └── theme/                # paleta, tipografía
│
└── prestalab-web/                # WEB + API (Next.js 16)
    ├── next.config.ts
    ├── .env.example
    └── src/
        ├── app/                  # App Router: páginas y rutas API
        │   ├── login/ register/  # autenticación
        │   ├── page.tsx          # dashboard
        │   ├── prestamos/ salas/ inventario/ usuarios/ analitica/
        │   └── api/
        │       ├── auth/         # login, logout, me, register (web)
        │       ├── mobile/       # login, register, me, recuperar, sync, prestamos
        │       ├── solicitudes/  # listar/crear + aprobar, rechazar, reasignar
        │       ├── salas/ articulos/ usuarios/ notificaciones/ stats/ seed/
        │       └── reportes/     # inventario, salas, prestamos, segmentado…
        ├── components/           # Shell, Sidebar, Header, Brand, StatCard…
        ├── context/              # RoleContext (usuario activo en la UI)
        ├── lib/                  # session, guards, mobile-auth, firebase-admin…
        ├── middleware.ts         # protección de páginas y APIs web
        └── types/                # tipos compartidos (SolicitudPrestamo, Sala…)
```

---

## 4. Tecnologías y paquetes

### 4.1 App móvil (`prestalab-app-update`)

| Paquete | Para qué |
| --- | --- |
| `expo` ~58 | Runtime y herramientas de la app. |
| `react` 19.3 / `react-native` 0.88 | Base de la UI nativa. |
| `expo-sqlite` | Base de datos local (offline-first). |
| `@react-native-async-storage/async-storage` | Guardar el token y el perfil de sesión. |
| `@react-native-community/netinfo` | Detectar cuándo vuelve la conexión. |
| `@react-navigation/native`, `native-stack`, `bottom-tabs` | Navegación entre pantallas y tabs. |
| `react-native-paper` | Componentes Material 3 (inputs, botones, checkboxes). |
| `@expo/vector-icons` | Iconos (MaterialCommunityIcons), incluido el matraz de la marca. |
| `@expo-google-fonts/inter` | Tipografía Inter en 4 pesos. |
| `react-native-safe-area-context`, `react-native-screens` | Márgenes seguros y navegación nativa. |
| `expo-status-bar`, `expo-font` | Barra de estado y carga de fuentes. |
| `react-native-pager-view`, `react-native-tab-view` | Soporte de vistas deslizables. |
| `react-native-vector-icons` | Fuentes de iconos requeridas por la navegación. |

> **Ya no está:** `firebase`. Se desinstaló (67 paquetes menos) cuando la app pasó a
> consumir la API. Tampoco existe `src/config/fbConfig.js`.

### 4.2 Web (`prestalab-web`)

| Paquete | Para qué |
| --- | --- |
| `next` 16.4.3 | Framework (App Router + Turbopack + API Routes). |
| `react` / `react-dom` 19.3 | UI. |
| `firebase-admin` 14.5 | Acceso al servidor: Firestore, Auth y cookies de sesión. |
| `tailwindcss` 4 + `@tailwindcss/turbopack` | Estilos utilitarios. |
| `lucide-react` | Iconos de la interfaz. |
| `@mdi/js` | Path exacto del icono `flask-outline` de la marca. |
| `highcharts` + `highcharts-react-official` | Gráficas de analítica (donut, barras, stacked). |
| `clsx` / `tailwind-merge` | Utilidades para combinar clases CSS. |
| `typescript` 5 | Tipado estático. |
| `eslint` + `eslint-config-next` | Linting. |

### 4.3 Servicios externos

| Servicio | Uso |
| --- | --- |
| **Firebase Auth (Identity Toolkit)** | Verificar correo/contraseña y crear cuentas. |
| **Cloud Firestore** | Base de datos principal. |
| **Vercel** | Hosting de la web y de la API móvil. |
| **GitHub** | Repositorio y pull requests. |

---

## 5. App móvil en profundidad

### 5.1 Arranque (`App.js`)

1. Se inicializan las fuentes Inter; mientras tanto se muestra un fondo `#F5FBF6`.
2. Se ejecuta `initDb()`: crea las tablas SQLite si no existen y aplica migraciones.
3. `UserProvider` lee la sesión guardada en `AsyncStorage`.
4. Se muestra el `SplashScreen` animado (mínimo 4.5 s) hasta que la sesión termina de cargar.
5. Si hay usuario, `MainStack` inicia `iniciarSync(user.uid)`.
6. Si no hay usuario, `AuthStack` muestra Login/Register.

### 5.2 Navegación

```
AuthStack (sin sesión)          MainStack (con sesión)
├── Login                       ├── MainTabs (bottom tabs)
└── Register                    │   ├── Inicio
                                │   ├── Artículos
                                │   └── Perfil
                                ├── ArticleDetail
                                ├── LoanRequest
                                └── LoanHistory
```

### 5.3 Capas de la app

```
Pantallas (screens/)
      │  usan las mismas firmas de siempre
      ▼
services/firestoreService.js  ← fachada (getArticles, createLoan, returnLoan…)
      │
      ├── data/*Repo.js  ──▶  SQLite (lectura inmediata, offline)
      └── sync/outbox.js ──▶  cola persistente de escrituras

sync/syncEngine.js  ──▶  API /api/mobile/*  (push + pull)
services/apiClient.js ──▶  fetch con Bearer token
```

La clave: **las pantallas no cambiaron** cuando migramos de Firebase a la API. La fachada
`firestoreService` conserva las firmas (`createLoan`, `getLoans`, `subscribeToLoans`…).

### 5.4 SQLite: esquema local

La base local replica lo necesario para funcionar sin red:

| Tabla | Contenido |
| --- | --- |
| `usuarios` | Perfil local (uid, email, rol, género, departamento). |
| `salas` | Laboratorios y salas. |
| `articulos` | Inventario (stock, estado, condición). |
| `prestamos` | Préstamos y solicitudes, con `dirty` para saber si hay cambios pendientes. |
| `sync_outbox` | Cola de operaciones por subir (ver §5.5). |
| `sync_state` | Última sincronización por colección. |

Migraciones: `PRAGMA user_version` + un array `MIGRACIONES`. Cada versión nueva se aplica
en una transacción.

### 5.5 Outbox: la cola que nunca pierde datos

Cuando el usuario solicita un préstamo o devuelve uno:

1. Se escribe el cambio en SQLite **de inmediato** (la UI lo ve al instante).
2. Se inserta una operación en `sync_outbox`.
3. `syncEngine` intenta subirla cuando hay red.

Estados de una operación:

| Estado | Significado |
| --- | --- |
| `pending` | Esperando turno. |
| `in_flight` | Enviándose ahora. |
| `done` | Confirmada por el servidor. |
| `error` | Falló; se reintenta hasta 5 veces (`attempts`). |

También existe `pendientesDe(entity, recordId)`: evita que un *pull* del servidor pise un
registro que todavía tiene cambios locales sin subir.

### 5.6 Sincronización

`sync/syncEngine.js` hace dos cosas:

**Push** (subir la outbox):

```js
if (op.action === 'create') {
  await apiFetch('/api/mobile/prestamos', {
    method: 'POST',
    body: { ...payload, clientId: op.record_id },
  });
} else if (op.action === 'update') {
  await apiFetch(`/api/mobile/prestamos/${op.record_id}`, {
    method: 'PATCH',
    body: payload,
  });
}
```

El `clientId` es el id generado en el teléfono. El servidor usa ese mismo id, así que un
reintento **no duplica** la solicitud (idempotencia).

**Pull** (bajar datos):

```js
const data = await apiFetch('/api/mobile/sync');
// data = { salas, articulos, prestamos, notificaciones, serverTime }
```

Se aplica a SQLite con `aplicarSala`, `aplicarArticulo` y `aplicarPrestamo`
(`INSERT … ON CONFLICT DO UPDATE`).

**Disparadores** (`sync/connectivity.js`):

- cada 30 segundos,
- al volver la app a primer plano,
- al recuperar conexión (NetInfo),
- tras cada acción local (`emit('sync')`).

Si el token venció (`401`), se cierra la sesión automáticamente.

### 5.7 Autenticación móvil

```
loginScreen → authService.loginUser()
            → POST /api/mobile/auth/login
            → guarda { token, user } en AsyncStorage
            → session.js notifica
            → userContext actualiza el usuario
            → App cambia de AuthStack a MainStack
```

Archivos:

| Archivo | Responsabilidad |
| --- | --- |
| `config/apiConfig.js` | `EXPO_PUBLIC_API_VERCEL` (única variable de entorno). |
| `services/apiClient.js` | `fetch` + `Authorization: Bearer` + timeout + errores. |
| `services/session.js` | Token y perfil en `AsyncStorage`; pub/sub de cambios. |
| `services/authService.js` | Login, registro, recuperar contraseña, logout, refrescar perfil. |
| `contexts/userContext.js` | Estado global `user` / `loading`. |

### 5.8 UI/UX

- Paleta única en `src/theme/palette.js`:
  `#256B42` (primario), `#1F5B3A` (oscuro), `#F5FBF6` (fondo), `#FFFFFF` (superficie),
  `#E1EAE3` (borde), `#FCF2E4` (aviso).
- Tipografía Inter (400/500/600/700).
- Tarjetas blancas con radio 18, bordes suaves y sombras mínimas.
- `SplashScreen`: logo que rota de 35° a 0° con rebote, texto a los 0.6 s y salida a los 4.5 s.
- `OfflineBanner`: chip “Sin conexión” debajo del título cuando NetInfo lo detecta.

---

## 6. Web en profundidad

### 6.1 Páginas (App Router)

| Ruta | Quién entra | Contenido |
| --- | --- | --- |
| `/login` | Público | Login del personal. |
| `/register` | Público | Registro (crea rol estudiante). |
| `/` | Staff | Dashboard: KPIs y pendientes. |
| `/prestamos` | Staff | Bandeja de solicitudes + aprobar/rechazar/reasignar. |
| `/salas` | Staff | CRUD de laboratorios. |
| `/inventario` | Staff | CRUD de artículos y stock. |
| `/usuarios` | Admin | Usuarios y roles. |
| `/analitica` | Staff | Reportes con Highcharts. |

“Staff” = `gestor` o `admin`. El middleware redirige a `/login` si no hay cookie.

### 6.2 API

**Web (cookie httpOnly):**

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Verifica con Firebase y crea la cookie de sesión. |
| POST | `/api/auth/register` | Crea cuenta + perfil (estudiante). |
| POST | `/api/auth/logout` | Borra la cookie. |
| GET | `/api/auth/me` | Usuario de la sesión. |
| GET/POST | `/api/solicitudes` | Lista/crea solicitudes. |
| POST | `/api/solicitudes/[id]/aprobar` | Transacción: estado + stock + notificación. |
| POST | `/api/solicitudes/[id]/rechazar` | Rechazo con motivo obligatorio. |
| POST | `/api/solicitudes/[id]/reasignar` | Cambia de sala y notifica. |
| GET/POST | `/api/salas`, `/api/articulos`, `/api/usuarios` | Catálogos. |
| PUT/DELETE | `/api/salas/[id]`, `/api/articulos/[id]`, `/api/usuarios/[id]` | Edición. |
| GET | `/api/stats` | KPIs del dashboard. |
| GET/PUT | `/api/notificaciones` | Centro de alertas / marcar como leídas. |
| POST | `/api/seed` | Datos de ejemplo (solo admin). |
| GET | `/api/reportes/*` | Inventario, salas, préstamos, segmentado, usuarios. |

**Móvil (Bearer JWT):**

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/mobile/auth/login` | Login; devuelve `token` + perfil. |
| POST | `/api/mobile/auth/register` | Registro; devuelve `token` + perfil. |
| GET | `/api/mobile/auth/me` | Perfil fresco. |
| POST | `/api/mobile/auth/recuperar` | Correo de recuperación. |
| GET | `/api/mobile/sync` | Salas + artículos + préstamos + notificaciones del usuario. |
| POST | `/api/mobile/prestamos` | Crear solicitud (idempotente con `clientId`). |
| PATCH | `/api/mobile/prestamos/[id]` | Devuelve un préstamo (solo el dueño). |

### 6.3 Autenticación web (cookie)

1. El login envía correo/contraseña a `/api/auth/login`.
2. El servidor verifica con **Identity Toolkit** (Firebase Auth).
3. Lee el perfil en `usuarios/{uid}` y exige `rol` gestor/admin.
4. Crea una **session cookie** firmada por Firebase:

```ts
const sessionCookie = await adminAuth.createSessionCookie(idToken, {
  expiresIn: 5 * 24 * 60 * 60 * 1000, // 5 días
});
cookies().set('prestalab_session', sessionCookie, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});
```

5. `getSessionUser()` verifica la cookie y devuelve el usuario en cada petición.

### 6.4 Autenticación móvil (JWT propio)

La app no tiene cookie ni SDK de Firebase. El backend firma su propio token:

```ts
const token = signMobileToken(uid);
// header.payload.signature  (HS256)
```

- **Duración:** 30 días.
- **Secreto:** `AUTH_SECRET` (mínimo 16 caracteres; en producción, 64).
- **Audiencia:** `prestalab-mobile`.
- **Envío:** `Authorization: Bearer <token>`.

`requireMobileAuth()` valida la firma, la expiración y luego lee el perfil actual en
Firestore (así un cambio de rol se refleja sin esperar a que caduque el token).

### 6.5 Reglas de negocio

- **Aprobación transaccional:** estado, descuento de stock y notificación ocurren en una
  sola transacción. Si algo falla, nada se aplica.
- **Idempotencia:** si la solicitud ya está `activo`/`aprobado`, no se descuenta stock otra vez.
- **Stock:** se valida `stock >= cantidad` antes de descontar.
- **Rechazo:** exige un motivo de al menos 5 caracteres.
- **Devolución:** solo el dueño; solo desde `activo`/`aprobado`; pasa a `devuelto`.
- **Estados:** `pendiente → aprobado → activo → devuelto`, más `rechazado` y `vencido`.

### 6.6 Analítica

`highcharts` + `highcharts-react-official`, cargados en cliente. Los endpoints de
`/api/reportes/*` agregan los datos en el servidor y devuelven series listas para graficar:

- inventario por condición (buen estado / dañado / perdido),
- uso de laboratorios (horas, tasa de ocupación, hora pico),
- préstamos por estado y tipo de recurso,
- segmentación por género × sala × usuario.

### 6.7 Sistema de diseño

`globals.css` define tokens y clases reutilizables:

- `.card`, `.card-pad`
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`
- `.field`
- `.chip`, `.chip-active`
- `.pill-green`, `.pill-warn`, `.pill-danger`, `.pill-neutral`
- `.table-shell`

Los componentes `Brand`, `StatCard`, `StatusPill`, `EmptyState`, `PageContainer` y
`SectionHeader` encapsulan los patrones visuales de la app móvil.

---

## 7. Seguridad

### 7.1 Contraseñas

- Las contraseñas **nunca** se guardan en el código ni en Firestore.
- Firebase Auth las almacena con su propio hash y política.
- El backend las verifica con `accounts:signInWithPassword` (Identity Toolkit).

### 7.2 Sesiones

| Cliente | Mecanismo | Vida |
| --- | --- | --- |
| Web | Cookie `prestalab_session` httpOnly, `secure` en producción, `sameSite=lax` | 5 días |
| Móvil | JWT HS256 en `AsyncStorage` + `Authorization: Bearer` | 30 días |

- La cookie **no** es accesible desde JavaScript (`httpOnly`), lo que mitiga XSS.
- El JWT móvil se firma con `AUTH_SECRET`; sin ese secreto el servidor responde 503.
- Al expirar, el móvil limpia la sesión y vuelve al login.

### 7.3 Roles y permisos (RBAC)

| Rol | App móvil | Web |
| --- | --- | --- |
| `estudiante` | Solicita, devuelve, ve su historial. | ❌ No entra (el login lo rechaza). |
| `docente` | Igual que estudiante. | ❌ No entra. |
| `gestor` | Puede entrar, pero su trabajo es la web. | Aprueba, rechaza, reasigna, inventario. |
| `admin` | Acceso total. | Todo, incluido usuarios y seed. |

Guard del servidor:

```ts
export async function requireStaff(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return { response: unauthorized() };
  if (!puedeGestionar(user)) return { response: forbidden() };
  return { user };
}
```

Se aplica en aprobar, rechazar, reasignar, crear solicitud y seed.

### 7.4 Secretos

| Secreto | Dónde vive | ¿Se versiona? |
| --- | --- | --- |
| `FIREBASE_PRIVATE_KEY` | `.env.local` / Vercel | ❌ Nunca |
| `serviceAccountKey.json` | Raíz de `prestalab-web` | ❌ Ignorado |
| `AUTH_SECRET` | `.env.local` / Vercel | ❌ Nunca |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.env.local` / Vercel | ❌ No (aunque es pública por diseño) |
| `EXPO_PUBLIC_API_VERCEL` | `.env` del móvil | ✅ Sí (solo es una URL) |

Los `.env.example` existen para documentar las variables, siempre **vacías**.
El repositorio fue auditado: no contiene claves reales ni en el historial.

### 7.5 Reglas de Firestore

El archivo `prestalab-app-update/firestore.rules` es heredado y actualmente es permisivo:

```js
allow read, write: if isAuthenticated();
```

**Riesgo:** cualquier cliente con un token de Firebase podría escribir directamente.
Como la app móvil ya no usa Firestore, se recomienda endurecerlo:

- `salas` y `articulos`: lectura autenticada, escritura solo `admin`/`gestor`.
- `prestamos`: el estudiante solo crea/lee lo suyo; el staff gestiona todo.
- `usuarios`: cada usuario lee su perfil; solo admin escribe roles.
- `notificaciones`: el usuario solo ve las suyas.

La web no se ve afectada por estas reglas porque usa **Admin SDK**, que las omite.

### 7.6 Riesgos conocidos

- No hay verificación de correo ni límite de intentos propio (Firebase aplica los suyos).
- El JWT no se puede revocar antes de expirar (no hay lista negra).
- Las reglas de Firestore deben endurecerse (§7.5).
- Falta rate limiting en los endpoints públicos de registro/login.
- `middleware.ts` está deprecado en Next 16 (migrar a `proxy.ts`).

---

## 8. Base de datos

### 8.1 Firestore (servidor)

**`usuarios`**

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | string | Igual al UID de Firebase Auth. |
| `nombre`, `email`, `telefono` | string | Datos de contacto. |
| `genero` | `Masculino` \| `Femenino` \| `Otro` | Para reportes segmentados. |
| `rol` | `estudiante` \| `docente` \| `gestor` \| `admin` | Autorización. |
| `departamento`, `matriculaOCodigo` | string | Información académica. |
| `laboratoriosAsignados` | string[] | Salas que gestiona un gestor. |
| `createdAt` | ISO string | Alta. |

**`salas`**

`id`, `nombre`, `codigo`, `edificio`, `capacidad`, `tipo`,
`estado` (`disponible` \| `ocupado` \| `mantenimiento`),
`gestorResponsableId`, `gestorNombre`, `equiposCount`, `descripcion`.

**`articulos`**

`id`, `nombre`, `categoria`, `salaId`, `salaNombre`, `stock`, `stockTotal`,
`estado` (`operativo` \| `en_reparacion` \| `de_baja`),
`condicion` (`buen_estado` \| `daniado` \| `perdido`),
`codigoActivo`, `fechaRegistro`, `descripcion`.

**`prestamos`**

| Grupo | Campos |
| --- | --- |
| Identidad | `id`, `userId`, `userNombre`, `userEmail`, `userRol`, `userGenero` |
| Recurso | `tipoRecurso`, `articuloId`, `articuloNombre`, `salaId`, `salaNombre`, `cantidad` |
| Reasignación | `salaOriginalId`, `salaOriginalNombre`, `fueReasignada`, `motivoReasignacion` |
| Trámite | `motivo`, `observaciones`, `estado`, `fechaSolicitud` |
| Fechas | `fechaInicio`, `fechaFin`, `fechaAprobacion`, `fechaDevolucion` |
| Gestión | `gestorId`, `gestorNombre`, `motivoRechazo` |
| Auditoría | `createdAt`, `updatedAt` |

**`notificaciones`**

`userId`, `tipo`, `titulo`, `mensaje`, `prestamoId`, `salaNombre`, `leida`, `fecha`.

### 8.2 SQLite (móvil)

Se usa como **caché de lectura** y como **origen de las escrituras offline**. Las tablas
están en §5.4. Cada tabla guarda `updated_at` y, en catálogos, `deleted_at` para
sincronizar borrados lógicos.

### 8.3 Mapeo de nombres

Firestore y la API usan `camelCase` (`stockTotal`, `fechaInicio`); SQLite usa
`snake_case` (`stock_total`, `fecha_inicio`). Los repositorios hacen la traducción con
alias en SQL (`stock_total AS stockTotal`). Así las pantallas reciben siempre el mismo
formato, sin importar de dónde venga el dato.

---

## 9. Funciones clave del código

### 9.1 App móvil

#### `crearSolicitud(data)` — `data/prestamosRepo.js`

Escribe el préstamo en SQLite y encola la subida en una sola transacción:

```js
db.withTransactionSync(() => {
  db.runSync(`INSERT INTO prestamos (...) VALUES (...)`, [...]);
  encolar(db, {
    entity: 'prestamos',
    recordId: id,
    action: 'create',
    payload,
  });
});
emit('prestamos'); // la UI se actualiza al instante
```

#### `registrarDevolucion(id)`

Actualización optimista + operación de outbox:

```js
const payload = { estado: 'devuelto', fechaDevolucion: ahora };
db.runSync(
  `UPDATE prestamos SET estado = 'devuelto', fecha_devolucion = ?, dirty = 1 …`,
  [ahora, ahora, id],
);
encolar(db, { entity: 'prestamos', recordId: id, action: 'update', payload });
```

#### `encolar(db, { entity, recordId, action, payload })` — `sync/outbox.js`

Es la única puerta de entrada a la cola. Guarda el payload como JSON:

```js
db.runSync(
  `INSERT INTO sync_outbox (entity, record_id, action, payload, status, attempts, created_at)
   VALUES (?, ?, ?, ?, 'pending', 0, ?)`,
  [entity, recordId, action, JSON.stringify(payload), nowIso()],
);
```

#### `sincronizar(uid)` — `sync/syncEngine.js`

Orquesta el ciclo completo y evita ejecuciones simultáneas con el flag `sincronizando`:

```js
try {
  await empujarOutbox();   // sube pendientes
  await bajarTodo();       // baja catálogo + préstamos
} catch (e) {
  if (e?.status === 401) await clearSession();
}
```

#### `apiFetch(path, options)` — `services/apiClient.js`

Cliente HTTP único de la app:

```js
const headers = { Accept: 'application/json' };
if (auth) headers.Authorization = `Bearer ${getToken()}`;

const res = await fetch(`${API_BASE_URL}${path}`, {
  method, headers, body: body && JSON.stringify(body), signal,
});
```

- Timeout de 15 s con `AbortController`.
- Si la respuesta trae `success: false`, lanza `ApiError` con el mensaje del servidor.
- `auth: false` solo para login, registro y recuperación.

#### `saveSession(token, user)` / `loadSession()` — `services/session.js`

Persisten la sesión y notifican a los suscriptores:

```js
export async function saveSession(token, user) {
  cache = { token, user };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  notify(); // userContext cambia a MainStack
}
```

#### `loginUser(email, password)` — `services/authService.js`

Mantiene la firma antigua para no tocar las pantallas:

```js
const data = await apiFetch('/api/mobile/auth/login', {
  method: 'POST', auth: false, body: { email, password },
});
await saveSession(data.token, normalizarUsuario(data.user));
return { success: true, user };
```

### 9.2 Web

#### `setSessionCookie(idToken)` — `lib/session.ts`

```ts
const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
cookies().set(SESSION_COOKIE, sessionCookie, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 5,
});
```

#### `getSessionUser(request?)` — `lib/session.ts`

Verifica la cookie y busca el perfil:

```ts
const decoded = await adminAuth.verifySessionCookie(cookieValue, true);
const doc = await adminDb.collection('usuarios').doc(decoded.uid).get();
const rol = data.rol || decoded.rol || 'estudiante';
```

#### `requireStaff(request)` — `lib/guards.ts`

```ts
const user = await getSessionUser(request);
if (!user) return { response: unauthorized() };
if (!puedeGestionar(user)) return { response: forbidden() };
return { user };
```

#### `signMobileToken(uid)` / `verifyMobileToken(token)` — `lib/mobile-auth.ts`

```ts
const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = b64url(JSON.stringify({
  sub: uid,
  iat: now,
  exp: now + 30 * 24 * 60 * 60,
  aud: 'prestalab-mobile',
}));
const signature = createHmac('sha256', secret)
  .update(`${header}.${payload}`)
  .digest('base64url');
```

La verificación compara con `timingSafeEqual` y rechaza tokens expirados o con otra
audiencia.

#### `requireMobileAuth(request)` — `lib/mobile-auth.ts`

1. Exige `Authorization: Bearer`.
2. Verifica firma y expiración.
3. Lee `usuarios/{uid}` (perfil fresco).
4. Devuelve `{ user }` o una respuesta 401/403/503.

#### Aprobación transaccional — `api/solicitudes/[id]/aprobar/route.ts`

Resumido (se omiten validaciones de estado y notificaciones):

```ts
const resultado = await adminDb.runTransaction(async (tx) => {
  const solSnap = await tx.get(solRef);
  if (solSnap.data()?.estado === 'activo') return { yaAprobada: true };

  const art = await tx.get(artRef);
  if (Number(art.data()?.stock ?? 0) < cantidad) throw new Error('Stock insuficiente');

  tx.update(artRef, { stock: disponible - cantidad });
  tx.update(solRef, { estado: 'activo', gestorId: user.id, fechaAprobacion: now });
  tx.set(notifRef, { userId, titulo: '¡Préstamo Aprobado!', leida: false, fecha: now });

  return { yaAprobada: false };
});
```

#### `identitySignIn(email, password)` — `lib/firebase-auth-rest.ts`

```ts
const res = await fetch(`${IDENTITY_BASE}:signInWithPassword?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
});
```

Los códigos de Firebase se traducen a mensajes en español (`INVALID_PASSWORD`,
`EMAIL_EXISTS`, `WEAK_PASSWORD`, etc.).

---

## 10. Flujos completos

### 10.1 Registro en la app móvil

```
RegisterScreen
  → registerUser()                    (valida campos en el cliente)
  → POST /api/mobile/auth/register
       → Identity Toolkit: signUp    (crea la cuenta en Firebase Auth)
       → Firestore: usuarios/{uid}   (rol: estudiante)
       → firma JWT
  → guarda token + perfil en AsyncStorage
  → userContext actualiza → MainStack
```

Si el perfil no se puede guardar, el servidor **revierte** el alta en Auth
(`adminAuth.deleteUser`) para no dejar cuentas huérfanas.

### 10.2 Login en la web

```
LoginPage
  → POST /api/auth/login
       → Identity Toolkit: signInWithPassword
       → Firestore: usuarios/{uid}   (exige gestor/admin)
       → createSessionCookie
       → Set-Cookie: prestalab_session (httpOnly)
  → RoleContext guarda el usuario
  → redirige a /
```

### 10.3 Solicitud → aprobación → reflejo en la app

```
[MÓVIL]
1. Estudiante envía solicitud sin red.
2. SQLite guarda el préstamo (estado pendiente).
3. Outbox guarda la operación 'create'.

[RED DISPONIBLE]
4. syncEngine hace POST /api/mobile/prestamos (con clientId).
5. Servidor crea prestamos/{clientId}.

[WEB]
6. El gestor ve la solicitud en /prestamos.
7. Aprueba: transacción → estado activo + stock -1 + notificación.

[MÓVIL]
8. En ≤30 s (o al volver a la app) el pull trae el préstamo actualizado.
9. La UI muestra "activo" y el stock nuevo.
```

### 10.4 Devolución

```
Móvil: returnLoan(id)
  → SQLite: estado 'devuelto' (optimista)
  → Outbox: update { estado: 'devuelto' }

syncEngine: PATCH /api/mobile/prestamos/{id}
  → servidor valida dueño y estado
  → actualiza fechaDevolucion
  → siguiente pull confirma el cambio
```

---

## 11. Configuración y ejecución

### 11.1 Variables de entorno — Web

Archivo `prestalab-web/.env.local`:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | ✅ | `prestalab-f2436`. |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Correo de la cuenta de servicio. |
| `FIREBASE_PRIVATE_KEY` | ✅* | Clave privada con `\n` escapados. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | API key del proyecto (login/registro). |
| `AUTH_SECRET` | ✅ | Firma de los JWT móviles (≥16 caracteres). |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Nombre visible. |

\* Alternativa recomendada: guardar el JSON de la cuenta de servicio como
`prestalab-web/serviceAccountKey.json` (ignorado por git).

### 11.2 Variables de entorno — App móvil

Archivo `prestalab-app-update/.env`:

```env
EXPO_PUBLIC_API_VERCEL=https://movil2-0.vercel.app
```

Para probar contra la PC (dispositivo físico, misma red):

```env
EXPO_PUBLIC_API_VERCEL=http://192.168.1.24:3000
```

### 11.3 Comandos

```bash
# Web
cd prestalab-web
npm install
npm run dev          # http://localhost:3000
npm run build        # verificación de producción
npm run lint

# App móvil
cd prestalab-app-update
npm install
npx expo start       # QR para Expo Go / emulador
npx expo export --platform android   # verificación del bundle
```

### 11.4 Despliegue

- **Vercel** está conectado al repositorio: cada merge a `main` despliega producción.
- Los cambios de **variables de entorno** requieren un **Redeploy** manual.
- La app móvil apunta a producción por defecto; si cambias la URL, reinicia con
  `npx expo start -c` (las variables `EXPO_PUBLIC_*` se incrustan en el bundle).

---

## 12. Estado actual y pendientes

### Funciona / verificado

- ✅ `next build` (34 rutas, TypeScript limpio).
- ✅ `expo export` Android (1224 módulos, sin Firebase).
- ✅ Login, registro y guards implementados en web y móvil.
- ✅ Sincronización offline con outbox e idempotencia.
- ✅ Aprobación transaccional con descuento de stock.
- ✅ Despliegue automático en Vercel desde `main`.
- ✅ Repositorio sin secretos versionados.

### Pendiente

1. **Credenciales reales de Firebase** en Vercel y en local. Sin ellas:
   - el registro devuelve 503 (“falta API key”),
   - las rutas que usan Admin SDK devuelven 500.
2. **Endurecer `firestore.rules`** (§7.5).
3. **Migrar `middleware.ts` a `proxy.ts`** (aviso de deprecación de Next 16).
4. **Pruebas E2E** de login/registro y del ciclo de préstamo.
5. **Rate limiting** en endpoints públicos.
6. **Verificación de correo** al registrarse (opcional).

---

## 13. Glosario

| Término | Significado |
| --- | --- |
| **Offline-first** | La app funciona con datos locales; la red es un extra. |
| **Outbox** | Cola persistente de operaciones pendientes de enviar. |
| **Pull / Push** | Bajar datos del servidor / subir cambios locales. |
| **Idempotencia** | Repetir una operación no produce duplicados. |
| **JWT** | Token firmado con la identidad del usuario. |
| **Bearer** | Forma de enviar el token: `Authorization: Bearer <token>`. |
| **Session cookie** | Cookie httpOnly que mantiene la sesión de la web. |
| **RBAC** | Control de acceso basado en roles. |
| **Admin SDK** | SDK de Firebase para servidor; omite las reglas de Firestore. |
| **Identity Toolkit** | API REST de Firebase Auth para verificar credenciales. |
| **Soft delete** | Borrado lógico (`deleted_at`) en vez de eliminar la fila. |

---

> **Consejo para el equipo:** si algo falla, revisa en este orden:
> 1) ¿Hay sesión/token? → 401.
> 2) ¿Están las variables de entorno? → 503.
> 3) ¿Firestore responde? → 500.
> 4) ¿La app tiene red? → el banner “Sin conexión” y la outbox te lo dicen.
