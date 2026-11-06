import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * Inicializa Firebase Admin con prioridad a variables de entorno
 * (recomendado para despliegue) y, como respaldo, serviceAccountKey.json.
 *
 * Variables esperadas en .env.local:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (con \n escapados)
 */
const clean = (v?: string) =>
  (v || '').trim().replace(/^["']|["']$/g, '');

function fromEnv(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }
  return null;
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const envCreds = fromEnv();
  if (envCreds) {
    return initializeApp({
      credential: cert(envCreds),
      projectId: envCreds.projectId,
    });
  }

  const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  // Último recurso: credenciales por defecto del entorno (GOOGLE_APPLICATION_CREDENTIALS)
  console.warn(
    '[firebase-admin] Sin credenciales explícitas: usando Application Default Credentials. ' +
      'Define FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local.',
  );
  return initializeApp();
}

const app = getFirebaseAdminApp();
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export default app;
