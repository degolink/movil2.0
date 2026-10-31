'use client';

import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  Plus,
  Users,
  Boxes,
  MapPin,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { Sala, Usuario } from '@/types';

export default function SalasPage() {
  const { activeUser } = useActiveRole();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [gestores, setGestores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSala, setEditingSala] = useState<Sala | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    edificio: '',
    capacidad: 25,
    tipo: 'Redes' as Sala['tipo'],
    estado: 'disponible' as Sala['estado'],
    gestorResponsableId: '',
    descripcion: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSalas, resUsers] = await Promise.all([
        fetch('/api/salas'),
        fetch('/api/usuarios?rol=gestor'),
      ]);
      const dataSalas = await resSalas.json();
      const dataUsers = await resUsers.json();
      if (dataSalas.success) setSalas(dataSalas.data || []);
      if (dataUsers.success) setGestores(dataUsers.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (sala?: Sala) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nombre: sala.nombre,
        codigo: sala.codigo,
        edificio: sala.edificio,
        capacidad: sala.capacidad,
        tipo: sala.tipo,
        estado: sala.estado,
        gestorResponsableId: sala.gestorResponsableId || '',
        descripcion: sala.descripcion || '',
      });
    } else {
      setEditingSala(null);
      setFormData({
        nombre: '',
        codigo: '',
        edificio: 'Edificio de Ingeniería - Bloque B',
        capacidad: 25,
        tipo: 'Redes',
        estado: 'disponible',
        gestorResponsableId: gestores[0]?.id || '',
        descripcion: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedGestor = gestores.find((g) => g.id === formData.gestorResponsableId);
      const payload = {
        ...formData,
        gestorNombre: selectedGestor?.nombre || '',
      };

      if (editingSala) {
        await fetch(`/api/salas/${editingSala.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/salas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEstado = async (sala: Sala, nuevoEstado: Sala['estado']) => {
    try {
      await fetch(`/api/salas/${sala.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const canEdit = activeUser.rol === 'admin';

  return (
    <>
      <Header
        title="Gestión de Salas y Espacios Académicos"
        subtitle="Control de infraestructura de laboratorios, capacidad física y gestores asignados."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Catálogo Maestro de Laboratorios</h3>
            <p className="text-xs text-slate-500">
              {salas.length} espacios académicos registrados en la plataforma
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" /> Agregar Laboratorio
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Cargando salas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salas.map((sala) => (
              <div
                key={sala.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {sala.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                        sala.estado === 'disponible'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : sala.estado === 'ocupado'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {sala.estado}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{sala.nombre}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{sala.edificio}</span>
                    </p>
                  </div>

                  {sala.descripcion && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      {sala.descripcion}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Capacidad
                      </span>
                      <strong className="text-slate-900">{sala.capacidad} estudiantes</strong>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Especialidad
                      </span>
                      <strong className="text-slate-900">{sala.tipo}</strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Gestor Responsable
                    </span>
                    <strong className="text-emerald-900 font-semibold">
                      {sala.gestorNombre || 'Sin gestor asignado'}
                    </strong>
                  </div>
                </div>

                {/* Acciones de Sala */}
                {canEdit && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleEstado(sala, 'disponible')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'disponible'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Libre
                      </button>
                      <button
                        onClick={() => toggleEstado(sala, 'ocupado')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'ocupado'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Ocupado
                      </button>
                      <button
                        onClick={() => toggleEstado(sala, 'mantenimiento')}
                        className={`text-[10px] px-2 py-1 rounded font-bold ${
                          sala.estado === 'mantenimiento'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Mantenimiento
                      </button>
                    </div>

                    <button
                      onClick={() => openModal(sala)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar parámetros de la sala"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL CREAR / EDITAR SALA */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingSala ? 'Editar Laboratorio' : 'Registrar Nuevo Laboratorio'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre del Laboratorio *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Laboratorio de Telecomunicaciones"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="LAB-201"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl uppercase"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ubicación Física / Edificio *
                  </label>
                  <input
                    type="text"
                    value={formData.edificio}
                    onChange={(e) => setFormData({ ...formData, edificio: e.target.value })}
                    placeholder="Ej: Edificio de Ingeniería - Bloque B (Piso 2)"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Capacidad Máxima *
                    </label>
                    <input
                      type="number"
                      value={formData.capacidad}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidad: Number(e.target.value) })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      required
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo / Especialidad
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value as Sala['tipo'] })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="Redes">Redes</option>
                      <option value="Electrónica">Electrónica</option>
                      <option value="Software">Software</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Multiuso">Multiuso</option>
                      <option value="Química">Química</option>
                      <option value="Física">Física</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gestor Responsable del Laboratorio
                  </label>
                  <select
                    value={formData.gestorResponsableId}
                    onChange={(e) =>
                      setFormData({ ...formData, gestorResponsableId: e.target.value })
                    }
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Sin gestor asignado</option>
                    {gestores.map((gestor) => (
                      <option key={gestor.id} value={gestor.id}>
                        {gestor.nombre} ({gestor.departamento})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Equipamiento y Descripción
                  </label>
                  <textarea
                    rows={2}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles sobre bancos de trabajo, tomas de corriente, instrumentación..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Guardar Laboratorio
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

