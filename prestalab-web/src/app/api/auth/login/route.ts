import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Por favor ingresa tu correo institucional y contraseña.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscar en la colección de Firestore 'usuarios'
    const snapshot = await adminDb
      .collection('usuarios')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    let userData: any = null;

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      userData = { id: doc.id, ...doc.data() };
    } else {
      // Si no existe pero es el email admin por defecto, crear sesión de respaldo
      if (cleanEmail === 'admin.prestalab@universidad.edu.co') {
        userData = {
          id: 'user-admin-1',
          nombre: 'Ing. Mateo Gómez (Admin)',
          email: cleanEmail,
          rol: 'admin',
          laboratoriosAsignados: ['sala-redes-201', 'sala-robotica-104', 'sala-computo-302', 'sala-multiuso-105', 'sala-quimica-205'],
          departamento: 'Dirección de Tecnologías de la Información',
        };
      } else {
        return NextResponse.json(
          { success: false, error: 'No se encontró ninguna cuenta asociada a este correo institucional.' },
          { status: 401 }
        );
      }
    }

    // Validación de contraseña mínima
    if (password.length < 4) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' },
        { status: 400 }
      );
    }

    // Configurar cookie de sesión HTTP
    const sessionPayload = {
      id: userData.id,
      nombre: userData.nombre,
      email: userData.email,
      rol: userData.rol,
      laboratoriosAsignados: userData.laboratoriosAsignados || [],
      departamento: userData.departamento || '',
    };

    const cookieStore = await cookies();
    cookieStore.set('prestalab_session', JSON.stringify(sessionPayload), {
      httpOnly: false, // Accesible por cliente para sincronización inmediata
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return NextResponse.json({
      success: true,
      message: `Bienvenido al sistema PrestaLab, ${userData.nombre}.`,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error('Error in login route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
