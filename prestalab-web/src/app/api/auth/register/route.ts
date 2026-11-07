import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Registro de cuentas:
 * 1. Crea el usuario en Firebase Auth usando Firebase Admin SDK (directo y seguro).
 * 2. Guarda el perfil en Firestore `usuarios/{uid}` con rol `estudiante`.
 */

const GENEROS = ['Masculino', 'Femenino', 'Otro'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const nombre = String(body.nombre || '').trim();
    const apellido = String(body.apellido || '').trim();
    const telefono = String(body.telefono || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const genero = GENEROS.includes(body.genero) ? body.genero : 'Otro';

    if (!nombre || !apellido || !telefono || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor completa todos los campos.' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ingresa un correo electrónico válido.' },
        { status: 400 },
      );
    }

    if (telefono.replace(/\D/g, '').length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ingresa un número de teléfono colombiano válido (ej. +57 300 123 4567).',
        },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }

    const displayName = `${nombre} ${apellido}`;

    // 1) Crear el usuario directamente en Firebase Auth usando Admin SDK
    let uid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
      uid = userRecord.uid;
    } catch (authError: any) {
      console.error('[register] adminAuth.createUser error:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { success: false, error: 'Ya existe una cuenta con este correo.' },
          { status: 409 },
        );
      }
      if (authError.code === 'auth/invalid-password') {
        return NextResponse.json(
          { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: authError.message || 'No se pudo crear el usuario en Firebase.' },
        { status: 400 },
      );
    }

    // 2) Perfil en Firestore
    try {
      await adminDb.collection('usuarios').doc(uid).set(
        {
          id: uid,
          nombre: displayName,
          email,
          telefono,
          genero,
          rol: 'estudiante',
          departamento: 'Estudiante',
          laboratoriosAsignados: [],
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (dbError) {
      // Revertir creación si falla Firestore
      await adminAuth.deleteUser(uid).catch(() => {});
      console.error('[register] No se pudo guardar el perfil:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo guardar el perfil en Firestore. Verifica las credenciales de Firebase.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cuenta creada correctamente.',
        user: { id: uid, nombre: displayName, email, rol: 'estudiante' },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error('Error in register route:', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al crear la cuenta.' },
      { status: 500 },
    );
  }
}
