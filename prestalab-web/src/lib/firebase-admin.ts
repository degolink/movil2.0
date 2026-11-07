import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

const clean = (v?: string) => (v || '').trim().replace(/^["']|["']$/g, '');

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // 1. Variable con JSON completo (serviceAccountKey en una sola variable)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (
        (rawKey.startsWith("'") && rawKey.endsWith("'")) ||
        (rawKey.startsWith('"') && rawKey.endsWith('"'))
      ) {
        rawKey = rawKey.slice(1, -1);
      }
      if (!rawKey.startsWith('{')) {
        rawKey = Buffer.from(rawKey, 'base64').toString('utf8');
      }
      const serviceAccount = JSON.parse(rawKey);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || clean(process.env.FIREBASE_PROJECT_ID),
      });
    } catch (error) {
      console.error('[Firebase Admin] Error parseando FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  // 2. Variables de entorno individuales
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && rawPrivateKey) {
    try {
      const privateKey = clean(rawPrivateKey).replace(/\\n/g, '\n');
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (error) {
      console.error('[Firebase Admin] Error inicializando credenciales individuales:', error);
    }
  }

  // 3. Archivo local de credenciales (Desarrollo local)
  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      console.error('[Firebase Admin] Error leyendo serviceAccountKey.json:', error);
    }
  }

  console.warn('[Firebase Admin] Sin credenciales explícitas: usando credenciales por defecto.');
  return initializeApp();
}

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);

// Lazy Proxy para adminAuth: evita cargar jwks-rsa/jose hasta que realmente se use un método de Auth
let _adminAuth: Auth | null = null;
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_adminAuth) {
      const { getAuth } = require('firebase-admin/auth');
      _adminAuth = getAuth(app);
    }
    const val = (_adminAuth as any)[prop];
    if (typeof val === 'function') {
      return val.bind(_adminAuth);
    }
    return val;
  },
});

export default app;
