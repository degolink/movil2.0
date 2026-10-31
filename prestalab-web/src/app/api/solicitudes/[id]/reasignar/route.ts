import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nuevaSalaId, motivoReasignacion, gestorId, gestorNombre } = body;

    if (!nuevaSalaId || !motivoReasignacion) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar la nueva sala y el motivo institucional de la reasignación.' },
        { status: 400 }
      );
    }

    const solRef = adminDb.collection('solicitudes').doc(id);
    const solSnap = await solRef.get();

    if (!solSnap.exists) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const solData = solSnap.data();

    // Obtener datos de la nueva sala
    const salaDoc = await adminDb.collection('salas').doc(nuevaSalaId).get();
    if (!salaDoc.exists) {
      return NextResponse.json({ success: false, error: 'La nueva sala seleccionada no existe' }, { status: 404 });
    }
    const nuevaSalaData = salaDoc.data();

    const updates = {
      salaOriginalId: solData?.salaOriginalId || solData?.salaId,
      salaOriginalNombre: solData?.salaOriginalNombre || solData?.salaNombre,
      salaId: nuevaSalaId,
      salaNombre: nuevaSalaData?.nombre,
      fueReasignada: true,
      motivoReasignacion: motivoReasignacion.trim(),
      gestorId: gestorId || solData?.gestorId || 'user-gestor-1',
      gestorNombre: gestorNombre || solData?.gestorNombre || 'Gestor de Laboratorio',
      updatedAt: new Date().toISOString(),
    };

    await solRef.update(updates);
    await adminDb.collection('prestamos').doc(id).set(updates, { merge: true });

    // Emitir notificación persistente de reasignación para el estudiante
    try {
      await adminDb.collection('notificaciones').add({
        userId: solData?.userId,
        tipo: 'sala_modificada',
        titulo: 'Espacio Reasignado por el Gestor',
        mensaje: `Tu solicitud ha sido reasignada a la sala "${nuevaSalaData?.nombre}" (Original: ${updates.salaOriginalNombre}). Motivo: ${motivoReasignacion.trim()}`,
        prestamoId: id,
        salaNombre: nuevaSalaData?.nombre,
        leida: false,
        fecha: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn('Error emitiendo notificación:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Sala reasignada exitosamente a ${nuevaSalaData?.nombre}. Notificación registrada para el usuario.`,
      data: { id, ...solData, ...updates },
    });
  } catch (error: any) {
    console.error('Error reassigning room:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
