'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DoorOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Download,
  Calendar,
  Layers,
  Boxes,
  ClipboardList,
  Filter,
  RefreshCw,
  PieChart as PieIcon,
  ShieldCheck,
  XCircle,
  Activity,
} from 'lucide-react';
import Header from '@/components/Header';
import ChartWrapper from '@/components/ChartWrapper';
import { Sala } from '@/types';

type TabType = 'inventario' | 'uso_salas' | 'prestamos' | 'segmentado';

export default function AnaliticaPage() {
  const [activeTab, setActiveTab] = useState<TabType>('inventario');
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Global & Shared Filters
  const [selectedSala, setSelectedSala] = useState('todas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Specific Filters
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroCondicion, setFiltroCondicion] = useState('todas');
  const [filtroEstadoPrestamo, setFiltroEstadoPrestamo] = useState('todos');
  const [filtroGenero, setFiltroGenero] = useState('todos');
  const [filtroRol, setFiltroRol] = useState('todos');

  // Report Data
  const [inventarioData, setInventarioData] = useState<any>(null);
  const [usoSalasData, setUsoSalasData] = useState<any>(null);
  const [prestamosData, setPrestamosData] = useState<any>(null);
  const [segmentadoData, setSegmentadoData] = useState<any>(null);

  // Cargar lista de salas para filtros
  useEffect(() => {
    fetch('/api/salas')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSalas(data.data || []);
      })
      .catch(console.error);
  }, []);

  // Fetch datos según la pestaña activa y los filtros
  const fetchCurrentTabReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSala && selectedSala !== 'todas') params.append('salaId', selectedSala);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      if (activeTab === 'inventario') {
        if (filtroCategoria && filtroCategoria !== 'Todas') params.append('categoria', filtroCategoria);
        if (filtroCondicion && filtroCondicion !== 'todas') params.append('condicion', filtroCondicion);
        const res = await fetch(`/api/reportes/inventario?${params.toString()}`);
        const data = await res.json();
        if (data.success) setInventarioData(data);
      } else if (activeTab === 'uso_salas') {
        const res = await fetch(`/api/reportes/uso-laboratorios?${params.toString()}`);
        const data = await res.json();
        if (data.success) setUsoSalasData(data);
      } else if (activeTab === 'prestamos') {
        if (filtroEstadoPrestamo && filtroEstadoPrestamo !== 'todos') params.append('estado', filtroEstadoPrestamo);
        const res = await fetch(`/api/reportes/prestamos?${params.toString()}`);
        const data = await res.json();
        if (data.success) setPrestamosData(data);
      } else if (activeTab === 'segmentado') {
        if (filtroGenero && filtroGenero !== 'todos') params.append('genero', filtroGenero);
        if (filtroRol && filtroRol !== 'todos') params.append('rol', filtroRol);
        const res = await fetch(`/api/reportes/segmentado?${params.toString()}`);
        const data = await res.json();
        if (data.success) setSegmentadoData(data);
      }
    } catch (err) {
      console.error('Error fetching analytics tab:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedSala, fechaInicio, fechaFin, filtroCategoria, filtroCondicion, filtroEstadoPrestamo, filtroGenero, filtroRol]);

  useEffect(() => {
    fetchCurrentTabReport();
  }, [fetchCurrentTabReport]);

  const resetFilters = () => {
    setSelectedSala('todas');
    setFechaInicio('');
    setFechaFin('');
    setFiltroCategoria('Todas');
    setFiltroCondicion('todas');
    setFiltroEstadoPrestamo('todos');
    setFiltroGenero('todos');
    setFiltroRol('todos');
  };

  // ==============================================================
  // HIGHCHARTS CONFIGURATIONS
  // ==============================================================

  // Tab 1: Opciones Highcharts para Inventario (Pie + Bar)
  const inventarioPieOptions: Highcharts.Options = {
    chart: { type: 'pie', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Distribución por Condición Física', style: { fontSize: '13px', fontWeight: 'bold' } },
    tooltip: { pointFormat: '{series.name}: <b>{point.y} uds ({point.percentage:.1f}%)</b>' },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: '55%',
        dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}' },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Unidades',
        data: inventarioData?.graficas?.distribucionCondicion || [],
      },
    ],
    credits: { enabled: false },
  };

  const inventarioColumnOptions: Highcharts.Options = {
    chart: { type: 'column', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Condición de Activos por Laboratorio', style: { fontSize: '13px', fontWeight: 'bold' } },
    xAxis: {
      categories: (inventarioData?.graficas?.seriesPorSala || []).map((s: any) => s.nombre),
      crosshair: true,
    },
    yAxis: { min: 0, title: { text: 'Total Unidades' } },
    plotOptions: {
      column: { grouping: true },
    },
    series: [
      {
        type: 'column',
        name: 'Buen Estado',
        data: (inventarioData?.graficas?.seriesPorSala || []).map((s: any) => s.buenEstado),
        color: '#10B981',
      },
      {
        type: 'column',
        name: 'Dañados',
        data: (inventarioData?.graficas?.seriesPorSala || []).map((s: any) => s.daniado),
        color: '#F59E0B',
      },
      {
        type: 'column',
        name: 'Perdidos',
        data: (inventarioData?.graficas?.seriesPorSala || []).map((s: any) => s.perdido),
        color: '#EF4444',
      },
    ],
    credits: { enabled: false },
  };

  // Tab 2: Opciones Highcharts para Uso de Laboratorios
  const usoSalasBarOptions: Highcharts.Options = {
    chart: { type: 'bar', height: 320, backgroundColor: 'transparent' },
    title: { text: 'Horas Reservadas y Ocupación por Laboratorio', style: { fontSize: '13px', fontWeight: 'bold' } },
    xAxis: {
      categories: usoSalasData?.graficas?.categorias || [],
      title: { text: null },
    },
    yAxis: {
      min: 0,
      title: { text: 'Métricas de Uso', align: 'high' },
      labels: { overflow: 'justify' },
    },
    tooltip: { valueSuffix: ' hrs' },
    plotOptions: { bar: { dataLabels: { enabled: true } } },
    legend: { layout: 'horizontal', align: 'center', verticalAlign: 'bottom' },
    series: [
      {
        type: 'bar',
        name: 'Horas Ocupadas',
        data: usoSalasData?.graficas?.horasOcupadas || [],
        color: '#059669',
      },
      {
        type: 'bar',
        name: 'Total Solicitudes',
        data: usoSalasData?.graficas?.totalReservas || [],
        color: '#3B82F6',
      },
    ],
    credits: { enabled: false },
  };

  // Tab 3: Opciones Highcharts para Préstamos
  const prestamosPieOptions: Highcharts.Options = {
    chart: { type: 'pie', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Distribución por Estado de Solicitudes', style: { fontSize: '13px', fontWeight: 'bold' } },
    tooltip: { pointFormat: '{series.name}: <b>{point.y} solicitudes ({point.percentage:.1f}%)</b>' },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        innerSize: '50%',
        dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}' },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Solicitudes',
        data: prestamosData?.graficas?.estadosPie || [],
      },
    ],
    credits: { enabled: false },
  };

  const prestamosTiposOptions: Highcharts.Options = {
    chart: { type: 'column', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Solicitudes por Tipo de Recurso', style: { fontSize: '13px', fontWeight: 'bold' } },
    xAxis: {
      categories: (prestamosData?.graficas?.tiposPie || []).map((t: any) => t.name),
      crosshair: true,
    },
    yAxis: { min: 0, title: { text: 'Cantidad' } },
    series: [
      {
        type: 'column',
        name: 'Solicitudes',
        data: (prestamosData?.graficas?.tiposPie || []).map((t: any) => ({ y: t.y, color: t.color })),
        showInLegend: false,
      },
    ],
    credits: { enabled: false },
  };

  // Tab 4: Opciones Highcharts para Segmentación (Género + Sala + Usuario)
  const segmentadoStackedOptions: Highcharts.Options = {
    chart: { type: 'column', height: 320, backgroundColor: 'transparent' },
    title: { text: 'Préstamos por Laboratorio Segmentados por Género', style: { fontSize: '13px', fontWeight: 'bold' } },
    xAxis: {
      categories: segmentadoData?.graficas?.salasCategorias || [],
    },
    yAxis: {
      min: 0,
      title: { text: 'Número de Solicitudes' },
      stackLabels: { enabled: true },
    },
    legend: { align: 'center', verticalAlign: 'bottom' },
    tooltip: {
      formatter: function (this: any) {
        return `<b>${this.x}</b><br/>${this.series?.name}: ${this.y}<br/>Total en sala: ${this.total ?? this.point?.stackTotal ?? this.y}`;
      },
    },
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: { enabled: true },
      },
    },
    series: (segmentadoData?.graficas?.seriesPorGeneroYSala || []).map((s: any) => ({
      type: 'column',
      name: s.name,
      data: s.data,
      color: s.color,
    })),
    credits: { enabled: false },
  };

  const segmentadoPieOptions: Highcharts.Options = {
    chart: { type: 'pie', height: 280, backgroundColor: 'transparent' },
    title: { text: 'Distribución Global por Género', style: { fontSize: '13px', fontWeight: 'bold' } },
    tooltip: { pointFormat: '{series.name}: <b>{point.y} ({point.percentage:.1f}%)</b>' },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}' },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Préstamos',
        data: segmentadoData?.graficas?.generoPie || [],
      },
    ],
    credits: { enabled: false },
  };

  return (
    <>
      <Header
        title="Módulo de Analítica y Reportería (Business Intelligence)"
        subtitle="Reportes interactivos y analítica avanzada con Highcharts: Inventario, Uso de Espacios, Préstamos y Segmentación Demográfica."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Selector de Pestaña Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('inventario')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventario'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>1. Reporte de Inventario</span>
            </button>

            <button
              onClick={() => setActiveTab('uso_salas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'uso_salas'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <DoorOpen className="w-4 h-4" />
              <span>2. Uso de Laboratorios</span>
            </button>

            <button
              onClick={() => setActiveTab('prestamos')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prestamos'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>3. Reporte de Préstamos</span>
            </button>

            <button
              onClick={() => setActiveTab('segmentado')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'segmentado'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>4. Segmentación (Género/Sala/Usuario)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCurrentTabReport()}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Exportar Informe
            </button>
          </div>
        </div>

        {/* Panel de Filtros Compartido Dinámico */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filtros Paramétricos del Reporte ({activeTab.replace('_', ' ').toUpperCase()})</span>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {/* Laboratorio / Sala */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Laboratorio
              </label>
              <select
                value={selectedSala}
                onChange={(e) => setSelectedSala(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="todas">Todos los Laboratorios</option>
                {salas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo} - {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Fecha Inicio
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Fecha Fin
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filtros Contextuales según la pestaña */}
            {activeTab === 'inventario' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Todas">Todas las Categorías</option>
                    <option value="Herramientas">Herramientas</option>
                    <option value="Dispositivos">Dispositivos</option>
                    <option value="Cables">Cables</option>
                    <option value="Redes">Redes</option>
                    <option value="Instrumentos">Instrumentos</option>
                    <option value="Audio/Video">Audio/Video</option>
                    <option value="Equipos de Medición">Equipos de Medición</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Condición Física
                  </label>
                  <select
                    value={filtroCondicion}
                    onChange={(e) => setFiltroCondicion(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="todas">Todas las Condiciones</option>
                    <option value="buen_estado">Buen Estado</option>
                    <option value="daniado">Dañado</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'prestamos' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Estado Solicitud
                </label>
                <select
                  value={filtroEstadoPrestamo}
                  onChange={(e) => setFiltroEstadoPrestamo(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="pendiente">En Revisión (Pendiente)</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="activo">Activo en Curso</option>
                  <option value="devuelto">Devuelto</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
            )}

            {activeTab === 'segmentado' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Género / Sexo
                  </label>
                  <select
                    value={filtroGenero}
                    onChange={(e) => setFiltroGenero(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="todos">Todos los Géneros</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / No binario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Rol Académico
                  </label>
                  <select
                    value={filtroRol}
                    onChange={(e) => setFiltroRol(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="todos">Todos los Roles</option>
                    <option value="estudiante">Estudiantes</option>
                    <option value="docente">Docentes</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: REPORTE DE INVENTARIO (DAÑOS, PÉRDIDAS, BUEN ESTADO) */}
        {/* ============================================================== */}
        {activeTab === 'inventario' && (
          <div className="space-y-6">
            {/* KPI Cards de Condición */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Buen Estado
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-emerald-900">
                  {inventarioData?.totales?.buenEstado ?? 0} uds
                </div>
                <p className="text-xs text-slate-500 mt-1">Activos operativos y certificados</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    Dañados / Reparación
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-amber-900">
                  {inventarioData?.totales?.daniado ?? 0} uds
                </div>
                <p className="text-xs text-slate-500 mt-1">Requieren mantenimiento técnico</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    Pérdidas Registradas
                  </span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-rose-900">
                  {inventarioData?.totales?.perdido ?? 0} uds
                </div>
                <p className="text-xs text-slate-500 mt-1">Activos no localizados o extraviados</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Disponibles Ahora
                  </span>
                  <Boxes className="w-4 h-4 text-slate-600" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {inventarioData?.totales?.totalStock ?? 0} uds
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  En {inventarioData?.totales?.totalItems ?? 0} referencias catalogadas
                </p>
              </div>
            </div>

            {/* Gráficas Highcharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={inventarioPieOptions} />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={inventarioColumnOptions} />
              </div>
            </div>

            {/* Tabla Detallada de Activos Filtrados */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  Detalle del Inventario Auditado ({inventarioData?.data?.length ?? 0} registros)
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Código</th>
                      <th className="p-3">Nombre del Activo</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3">Laboratorio</th>
                      <th className="p-3">Stock Total</th>
                      <th className="p-3">Condición Física</th>
                      <th className="p-3">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(inventarioData?.data || []).map((art: any) => {
                      const cond = art.condicion || 'buen_estado';
                      return (
                        <tr key={art.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-600">{art.codigoActivo}</td>
                          <td className="p-3 font-bold text-slate-900">{art.nombre}</td>
                          <td className="p-3 text-slate-600">{art.categoria}</td>
                          <td className="p-3 text-emerald-800 font-semibold">{art.salaNombre}</td>
                          <td className="p-3">{art.stockTotal || art.stock} uds</td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                cond === 'buen_estado'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : cond === 'daniado'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {cond === 'buen_estado' ? 'Buen Estado' : cond === 'daniado' ? 'Dañado' : 'Perdido'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{art.fechaRegistro || '2026-10-01'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: REPORTE DE USO DE LABORATORIOS                      */}
        {/* ============================================================== */}
        {activeTab === 'uso_salas' && (
          <div className="space-y-6">
            {/* Gráfica de Ocupación con Highcharts */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <ChartWrapper options={usoSalasBarOptions} />
            </div>

            {/* Listado Analítico por Sala */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Índice de Saturación y Demanda Horaria por Espacio
                </h4>
                <p className="text-xs text-slate-500">
                  Detección de salas con alta saturación (&ge; 75%) y horas pico recomendadas para balanceo
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(usoSalasData?.data || []).map((sala: any) => {
                  const esSaturada = sala.tasaOcupacion >= 75;
                  const esModerada = sala.tasaOcupacion >= 45 && sala.tasaOcupacion < 75;

                  return (
                    <div
                      key={sala.salaId}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {sala.codigo}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{sala.nombre}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            esSaturada
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : esModerada
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {esSaturada ? 'Alta Saturación' : esModerada ? 'Demanda Media' : 'Alta Disponibilidad'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">RESERVAS</span>
                          <span className="font-extrabold text-slate-900">{sala.totalReservas}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">HORAS USO</span>
                          <span className="font-extrabold text-emerald-800">{sala.horasOcupadas} h</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-bold">HORA PICO</span>
                          <span className="font-bold text-indigo-700">{sala.horaPico}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                          <span>Tasa de Ocupación Nominal:</span>
                          <span className="font-bold text-slate-900">{sala.tasaOcupacion}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              esSaturada ? 'bg-rose-500' : esModerada ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${sala.tasaOcupacion}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: REPORTE GENERAL DE PRÉSTAMOS                        */}
        {/* ============================================================== */}
        {activeTab === 'prestamos' && (
          <div className="space-y-6">
            {/* KPI Cards de Préstamos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Solicitudes
                </span>
                <div className="mt-1 text-2xl font-extrabold text-slate-900">
                  {prestamosData?.total ?? 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  En Revisión
                </span>
                <div className="mt-1 text-2xl font-extrabold text-amber-800">
                  {prestamosData?.distribucion?.pendiente ?? 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 bg-emerald-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Activos en Curso
                </span>
                <div className="mt-1 text-2xl font-extrabold text-emerald-800">
                  {prestamosData?.distribucion?.activo ?? 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-200/90 bg-blue-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Devueltos
                </span>
                <div className="mt-1 text-2xl font-extrabold text-blue-800">
                  {prestamosData?.distribucion?.devuelto ?? 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-200/90 bg-rose-50/20 shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                  Rechazados
                </span>
                <div className="mt-1 text-2xl font-extrabold text-rose-800">
                  {prestamosData?.distribucion?.rechazado ?? 0}
                </div>
              </div>
            </div>

            {/* Gráficas Highcharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={prestamosPieOptions} />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={prestamosTiposOptions} />
              </div>
            </div>

            {/* Listado de Solicitudes Filtradas */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">
                  Trazabilidad de Solicitudes ({prestamosData?.data?.length ?? 0} registros)
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Solicitante</th>
                      <th className="p-3">Recurso / Espacio</th>
                      <th className="p-3">Laboratorio</th>
                      <th className="p-3">Rango Fechas</th>
                      <th className="p-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(prestamosData?.data || []).map((sol: any) => (
                      <tr key={sol.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{sol.userNombre}</div>
                          <div className="text-[11px] text-slate-400">{sol.userEmail}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {sol.articuloNombre || 'Reserva de Sala'}
                        </td>
                        <td className="p-3 text-emerald-800 font-semibold">{sol.salaNombre}</td>
                        <td className="p-3 text-slate-600">
                          {sol.fechaInicio} al {sol.fechaFin}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              sol.estado === 'activo'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sol.estado === 'pendiente'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : sol.estado === 'devuelto'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {sol.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: REPORTE SEGMENTADO (GÉNERO / SALA / USUARIO / FECHAS) */}
        {/* ============================================================== */}
        {activeTab === 'segmentado' && (
          <div className="space-y-6">
            {/* KPI Cards Demográficas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Masculino
                </span>
                <div className="mt-2 text-2xl font-extrabold text-blue-900">
                  {segmentadoData?.desgloseGenero?.Masculino ?? 0} solicitudes
                </div>
                <p className="text-xs text-slate-500 mt-1">Préstamos tramitados</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-pink-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">
                  Femenino
                </span>
                <div className="mt-2 text-2xl font-extrabold text-pink-900">
                  {segmentadoData?.desgloseGenero?.Femenino ?? 0} solicitudes
                </div>
                <p className="text-xs text-slate-500 mt-1">Préstamos tramitados</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs">
                <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                  Otro / No Binario
                </span>
                <div className="mt-2 text-2xl font-extrabold text-purple-900">
                  {segmentadoData?.desgloseGenero?.Otro ?? 0} solicitudes
                </div>
                <p className="text-xs text-slate-500 mt-1">Préstamos tramitados</p>
              </div>
            </div>

            {/* Gráficas Highcharts de Segmentación Demográfica y Espacial */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={segmentadoStackedOptions} />
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
                <ChartWrapper options={segmentadoPieOptions} />
              </div>
            </div>

            {/* Tabla Segmentada por Usuario Individual */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Auditoría Demográfica y de Uso por Usuario
                  </h4>
                  <p className="text-xs text-slate-500">
                    Frecuencia de solicitud, género, rol académico y laboratorios frecuentados
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Género</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Solicitudes</th>
                      <th className="p-3">Horas en Laboratorio</th>
                      <th className="p-3">Laboratorios Frecuentados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(segmentadoData?.usuariosResumen || []).map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{u.nombre}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              u.genero === 'Femenino'
                                ? 'bg-pink-50 text-pink-700 border-pink-200'
                                : u.genero === 'Masculino'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {u.genero}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              u.rol === 'docente'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.rol}
                          </span>
                        </td>

                        <td className="p-3 font-extrabold text-slate-900">
                          {u.totalSolicitudes} trámites
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {u.horas} horas
                          </span>
                        </td>

                        <td className="p-3 text-[11px] text-slate-600 max-w-xs">
                          {u.salasUtilizadas?.join(', ') || 'Sin salas'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
