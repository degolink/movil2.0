# Integración movil2.0 — estado y pendientes

## Base
- Proyecto Firebase: **prestalab-f2436**
- Base de código: `C:\Users\LUIS\movil2.0` (app móvil + web Next.js)
- Modelo unificado: **una sola colección `prestamos`** (se eliminó el espejo `solicitudes`)

## Móvil (`prestalab-app-update/`)

### Hecho
- **Splash** animado (4.5s) integrado en `App.js` + color nativo `#F5FBF6`.
- **Offline-first (SQLite)**:
  - `src/data/localDb.js` — esquema `usuarios, salas, articulos, prestamos, sync_outbox, sync_state`
  - `src/data/{salasRepo,articulosRepo,prestamosRepo}.js`
  - `src/sync/{outbox,syncEngine,connectivity}.js` (push + pull, sin `onSnapshot`)
  - `src/services/firestoreService.js` reescrito como fachada: mismas funciones
    (`subscribeToLoans`, `subscribeToArticles`, `subscribeToSalas`, `createLoan`,
    `returnLoan`), pero respaldadas por SQLite → **pantallas intactas**.
  - `App.js`: inicializa SQLite y arranca el sync (30s, red, foreground, acciones).
- Estados soportados: `pendiente | aprobado | activo | devuelto | rechazado | vencido`.
- Verificación: `expo export` OK (1241 módulos).

### Pendiente
- `usuarioContext` aún lee el perfil con `getDoc` (falla offline): moverlo a SQLite.
- `onSnapshot` eliminado; la aprobación del gestor llega por el pull (≤30s o al abrir la app).
- Falta historial/mis préstamos si se quiere el mismo UX que la otra app.

## Web (`prestalab-web/`)

### Hecho
- **Auth real**: login contra Firebase Auth (Identity Toolkit) + **cookie de sesión
  httpOnly** firmada (`adminAuth.createSessionCookie`). `/api/auth/me` verifica la
  cookie; `/api/auth/logout` la borra.
- **RBAC**: `requireStaff()` en aprobar/rechazar/reasignar/crear solicitud y
  `seed` solo admin. El portal rechaza estudiantes (`403`).
- **Middleware** de sesión para páginas (`/login` público).
- **Aprobación transaccional**: stock descontado una sola vez, idempotente,
  validación de estado y de stock insuficiente.
- **Admin SDK** lee credenciales desde `.env.local` (con respaldo a
  `serviceAccountKey.json`).
- **Colección única `prestamos`** en todas las APIs y reportes.
- Verificación: `next build` OK (26 rutas, TypeScript ✓).

### Pendiente
- Rellenar `.env.local`: `FIREBASE_PRIVATE_KEY` y `NEXT_PUBLIC_FIREBASE_API_KEY`.
- Migrar documentos antiguos de `solicitudes` a `prestamos` (si existen datos).
- Reglas de Firestore + Cloud Functions para `prestalab-f2436` (máquina de estados,
  claims `rol`, vencimientos).

## Lo que falta para probar en vivo
1. App: `EXPO_PUBLIC_FIREBASE_API_KEY`, `..._MESSAGING_SENDER_ID`, `..._APP_ID`.
2. Web: `FIREBASE_PRIVATE_KEY` y `NEXT_PUBLIC_FIREBASE_API_KEY`.
3. Crear (o migrar) en Firebase Auth los usuarios gestor/admin y su doc `usuarios`
   con `rol` correcto.
4. Ejecutar `npm start` (app) y `npm run dev` (web).

## Registro de cuentas (web)

Portado de  + "egisterScreen.js" + @":
- Ruta /register (pública) + POST /api/auth/register.
- Campos: nombre, apellido, sexo/género, teléfono, correo y contraseña.
- Valida correo, teléfono colombiano (10 dígitos) y contraseña (mínimo 6).
- Crea el usuario en Firebase Auth (Identity Toolkit, requiere
   + "NEXT_PUBLIC_FIREBASE_API_KEY" + @") y el doc  + "usuarios/{uid}" + @"
  con  + "ol: 'estudiante'" + @", igual que la app móvil.
- Si falla el guardado del perfil, se revierte el alta en Auth.

## App móvil sin Firebase (consume la API de Vercel)

La app ya **no** usa el SDK de Firebase ni guarda credenciales. Sólo necesita:

```
EXPO_PUBLIC_API_VERCEL=https://movil2-0.vercel.app
```

### Endpoints móviles

| Método | Endpoint | Uso |
| --- | --- | --- |
| POST | /api/mobile/auth/login | Login; devuelve 	oken + perfil |
| POST | /api/mobile/auth/register | Registro (rol estudiante) + token |
| GET | /api/mobile/auth/me | Perfil fresco de la sesión |
| POST | /api/mobile/auth/recuperar | Envío de correo de recuperación |
| GET | /api/mobile/sync | Pull: salas, artículos, préstamos y notificaciones del usuario |
| POST | /api/mobile/prestamos | Crear solicitud (idempotente con clientId) |
| PATCH | /api/mobile/prestamos/[id] | Registrar devolución (sólo el dueño) |

### Sesión

- JWT **HS256** propio, firmado con AUTH_SECRET (30 días).
- Se envía como Authorization: Bearer <token>.
- El middleware deja pasar /api/mobile/*; cada ruta valida el token y lee
  el perfil desde usuarios.
- La app guarda token + perfil en AsyncStorage (sesión offline).

### Offline

- SQLite y la outbox se mantienen igual.
- El push de la outbox ahora hace POST / PATCH a la API.
- El pull baja catálogo, préstamos del usuario y notificaciones en una sola
  llamada; se dispara a los 30 s, al volver a primer plano, al recuperar red
  y tras cada acción local.
- Si el token vence (401), la app cierra la sesión y pide volver a entrar.

### Variables por entorno

- **Vercel**: NEXT_PUBLIC_FIREBASE_API_KEY, FIREBASE_PRIVATE_KEY,
  FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, AUTH_SECRET.
- **App**: sólo EXPO_PUBLIC_API_VERCEL.
