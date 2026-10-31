import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('prestalab_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    if (!parsed?.id) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    // Consultar datos actualizados de Firestore
    const userDoc = await adminDb.collection('usuarios').doc(parsed.id).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      const updatedUser = {
        id: userDoc.id,
        nombre: data?.nombre || parsed.nombre,
        email: data?.email || parsed.email,
        rol: data?.rol || parsed.rol,
        laboratoriosAsignados: data?.laboratoriosAsignados || parsed.laboratoriosAsignados || [],
        departamento: data?.departamento || parsed.departamento || '',
      };
      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ success: true, user: parsed });
  } catch (error: any) {
    if (error?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw error;
    }
    console.error('Error in me route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
