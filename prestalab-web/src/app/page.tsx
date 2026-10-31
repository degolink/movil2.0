'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  Boxes,
  Users,
  ArrowRight,
  ArrowUpRight,
  RefreshCw,
  GitPullRequest,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { SolicitudPrestamo, Sala } from '@/types';

export default function DashboardPage() {
  const { activeUser } = useActiveRole();
  const [stats, setStats] = useState<any>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudPrestamo[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resSols, resSalas] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/solicitudes?estado=pendiente'),
        fetch('/api/salas'),
      ]);

      const dataStats = await resStats.json();
      const dataSols = await resSols.json();
      const dataSalas = await resSalas.json();

      if (dataStats.success) setStats(dataStats.stats);
      if (dataSols.success) setSolicitudes(dataSols.data || []);
      if (dataSalas.success) setSalas(dataSalas.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUser.rol]);

  // Filtrar pendientes si el rol es gestor
  const pendientesFiltradas = solicitudes.filter((s) => {
    if (activeUser.rol === 'admin') return true;
    if (activeUser.rol === 'gestor') {
      return activeUser.laboratoriosAsignados?.includes(s.salaId);
    }
    return s.userId === activeUser.id;
  });

  return (
    <>
      <Header
        title="Panel de Control General"
        subtitle={`Bienvenido de nuevo, ${activeUser.nombre}. Visión operativa centralizada de PrestaLab.`}
      />

      <main className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Pendientes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Solicitudes Pendientes
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.pendientes ?? 0}
              </span>
              <span className="text-xs text-amber-700 bg-amber-100/60 font-medium px-2 py-0.5 rounded-full">
                Por evaluar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Requieren decisión del Gestor de Laboratorio
            </p>
          </div>

          {/* Card 2: Préstamos Activos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Préstamos Activos
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.activos ?? 0}
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-100/60 font-medium px-2 py-0.5 rounded-full">
                En uso
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {stats?.reasignadas ?? 0} préstamos con cambio de sala
            </p>
          </div>

          {/* Card 3: Salas y Laboratorios */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Salas y Laboratorios
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <DoorOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.totalSalas ?? 0}
              </span>
              <span className="text-xs text-blue-700 bg-blue-100/60 font-medium px-2 py-0.5 rounded-full">
                {stats?.salasDisponibles ?? 0} libres
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {stats?.salasMantenimiento ?? 0} en mantenimiento técnico
            </p>
          </div>

          {/* Card 4: Inventario Total */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Activos e Inventario
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {stats?.totalArticulos ?? 0}
              </span>
              <span className="text-xs text-purple-700 bg-purple-100/60 font-medium px-2 py-0.5 rounded-full">
                Unidades
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {stats?.articulosEnPrestamo ?? 0} prestados a usuarios
            </p>
          </div>
        </div>

        {/* Section: Solicitudes Pendientes de Atención Inmediata */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Bandeja de Decisiones del Gestor</span>
                {pendientesFiltradas.length > 0 && (
                  <span className="text-xs font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                    {pendientesFiltradas.length} pendientes
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evalúa, aprueba, rechaza con justificación o reasigna salas de laboratorio.
              </p>
            </div>

            <Link
              href="/prestamos"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition-colors"
            >
              Ver todas en Préstamos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" /> Cargando solicitudes...
            </div>
          ) : pendientesFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">
                No hay solicitudes pendientes en este momento
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todas las solicitudes de tus laboratorios asignados han sido evaluadas y resueltas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendientesFiltradas.slice(0, 3).map((sol) => (
                <div
                  key={sol.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {sol.userRol}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {sol.userNombre}
                      </h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {sol.userEmail}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                      <span>
                        <strong className="text-slate-900">Recurso:</strong>{' '}
                        {sol.articuloNombre || 'Reserva de Sala'} ({sol.cantidad} ud)
                      </span>
                      <span>
                        <strong className="text-slate-900">Sala solicitada:</strong>{' '}
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200/60">
                          {sol.salaNombre}
                        </span>
                      </span>
                      <span>
                        <strong className="text-slate-900">Fechas:</strong>{' '}
                        {sol.fechaInicio} al {sol.fechaFin}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                      "{sol.motivo}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/prestamos"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      Evaluar en Bandeja <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Estado de Laboratorios en Tiempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Salas y Espacios Académicos</h3>
                <p className="text-xs text-slate-500">Supervisión física y capacidad actual</p>
              </div>
              <Link href="/salas" className="text-xs text-emerald-700 font-semibold hover:underline">
                Gestionar salas →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salas.map((sala) => (
                <div
                  key={sala.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                        {sala.codigo}
                      </span>
                      <h4 className="font-semibold text-slate-800 text-xs mt-1.5 line-clamp-1">
                        {sala.nombre}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{sala.edificio}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      sala.estado === 'disponible'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : sala.estado === 'ocupado'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {sala.estado}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Capacidad: <strong>{sala.capacidad} estudiantes</strong></span>
                    <span>Gestor: <strong>{sala.gestorNombre?.split(' ')[1] || 'Asignado'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info & Matriz de Roles */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Matriz de Roles Activa</h3>
              <p className="text-xs text-slate-500 mb-4">
                Reglas de control de acceso aplicadas según tu sesión:
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl border text-xs ${
                  activeUser.rol === 'admin'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <p className="font-bold">Administrador del Sistema</p>
                  <p className="text-[11px] mt-0.5">Acceso irrestricto, configuración global, gestión de usuarios y auditoría.</p>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${
                  activeUser.rol === 'gestor'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <p className="font-bold">Gestor de Laboratorio</p>
                  <p className="text-[11px] mt-0.5">Evaluación de reservas (aprobar/denegar con motivo), reasignación de salas.</p>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${
                  activeUser.rol === 'estudiante' || activeUser.rol === 'docente'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <p className="font-bold">Estudiante / Docente</p>
                  <p className="text-[11px] mt-0.5">Solicitar préstamos, consultar inventario y consultar historial propio.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Next.js API Routes</span>
              <span className="font-semibold text-emerald-700">RESTful Active</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
