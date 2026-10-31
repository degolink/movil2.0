import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { gestorId, gestorNombre, motivoRechazo } = body;

    if (!motivoRechazo || motivoRechazo.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar un motivo justificativo detallado para rechazar la solicitud.' },
        { status: 400 }
      );
    }

    const solRef = adminDb.collection('solicitudes').doc(id);
    const solSnap = await solRef.get();

    if (!solSnap.exists) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const solData = solSnap.data();

    const updates = {
      estado: 'rechazado',
      gestorId: gestorId || 'user-gestor-1',
      gestorNombre: gestorNombre || 'Gestor de Laboratorio',
      motivoRechazo: motivoRechazo.trim(),
      fechaRechazo: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await solRef.update(updates);
    await adminDb.collection('prestamos').doc(id).set(updates, { merge: true });

    // Emitir notificación persistente de rechazo para el estudiante
    try {
      await adminDb.collection('notificaciones').add({
        userId: solData?.userId,
        tipo: 'rechazada',
        titulo: 'Solicitud Denegada',
        mensaje: `Tu solicitud de ${solData?.articuloNombre || 'espacio'} fue denegada por el gestor. Justificación: ${motivoRechazo.trim()}`,
        prestamoId: id,
        salaNombre: solData?.salaNombre,
        leida: false,
        fecha: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn('Error emitiendo notificación:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud rechazada con justificación debidamente registrada.',
      data: { id, ...solData, ...updates },
    });
  } catch (error: any) {
    console.error('Error rejecting solicitud:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
