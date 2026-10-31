import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { gestorId, gestorNombre, nuevaSalaId, motivoReasignacion } = body;

    const solRef = adminDb.collection('solicitudes').doc(id);
    const solSnap = await solRef.get();

    if (!solSnap.exists) {
      return NextResponse.json({ success: false, error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const solData = solSnap.data();

    const updates: Record<string, any> = {
      estado: 'activo',
      gestorId: gestorId || 'user-gestor-1',
      gestorNombre: gestorNombre || 'Gestor de Laboratorio',
      fechaAprobacion: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Si se reasignó sala antes o durante la aprobación
    if (nuevaSalaId && nuevaSalaId !== solData?.salaId) {
      const salaDoc = await adminDb.collection('salas').doc(nuevaSalaId).get();
      if (salaDoc.exists) {
        const salaData = salaDoc.data();
        updates.salaOriginalId = solData?.salaId;
        updates.salaOriginalNombre = solData?.salaNombre;
        updates.salaId = nuevaSalaId;
        updates.salaNombre = salaData?.nombre;
        updates.fueReasignada = true;
        updates.motivoReasignacion = motivoReasignacion || 'Reasignación de espacio por disponibilidad y mantenimiento.';
      }
    }

    // Si la solicitud incluye artículo, descontar stock en tiempo real
    if (solData?.articuloId) {
      const artRef = adminDb.collection('articulos').doc(solData.articuloId);
      const artSnap = await artRef.get();
      if (artSnap.exists) {
        const artData = artSnap.data();
        const nuevoStock = Math.max(0, (artData?.stock || 1) - (solData.cantidad || 1));
        await artRef.update({
          stock: nuevoStock,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await solRef.update(updates);

    // Actualizar también en colección prestamos
    await adminDb.collection('prestamos').doc(id).set(updates, { merge: true });

    // Emitir notificación persistente para el estudiante
    try {
      await adminDb.collection('notificaciones').add({
        userId: solData?.userId,
        tipo: updates.fueReasignada ? 'sala_modificada' : 'aprobada',
        titulo: updates.fueReasignada ? 'Sala Reasignada y Préstamo Aprobado' : '¡Préstamo Aprobado!',
        mensaje: updates.fueReasignada
          ? `Tu solicitud de ${solData?.articuloNombre || 'espacio'} fue aprobada y reasignada a: ${updates.salaNombre}. Motivo: ${updates.motivoReasignacion}`
          : `Tu solicitud de ${solData?.articuloNombre || 'espacio'} ha sido aprobada. Puedes utilizarlo en ${solData?.salaNombre}.`,
        prestamoId: id,
        salaNombre: updates.salaNombre || solData?.salaNombre,
        leida: false,
        fecha: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn('Error emitiendo notificación:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: updates.fueReasignada ? 'Solicitud aprobada con reasignación de sala' : 'Solicitud aprobada exitosamente',
      data: { id, ...solData, ...updates },
    });
  } catch (error: any) {
    console.error('Error approving solicitud:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
