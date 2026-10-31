'use client';

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, LogOut, Bell, X, Check } from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { activeUser, logout } = useActiveRole();
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  // Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const fetchNotificaciones = async () => {
    try {
      const res = await fetch('/api/notificaciones');
      const data = await res.json();
      if (data.success) {
        setNotificaciones(data.data || []);
      }
    } catch (e) {
      console.warn('Error fetching notificaciones:', e);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 25000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notificaciones.filter(n => !n.leida).length;

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notificaciones.filter(n => !n.leida).map(n =>
          fetch('/api/notificaciones', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: n.id, leida: true }),
          })
        )
      );
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    if (!confirm('¿Deseas poblar la base de datos de PrestaLab con los laboratorios, inventarios, usuarios y solicitudes demo iniciales?')) {
      return;
    }

    setSeeding(true);
    setSeedStatus(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedStatus('¡Base de datos inicializada con éxito!');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setSeedStatus(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setSeedStatus(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-xs relative z-30">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {seedStatus && (
          <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{seedStatus}</span>
          </div>
        )}

        {/* Campana de Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Centro de Alertas y Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 space-y-3 animate-fadeIn z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-slate-900">Notificaciones y Alertas</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Marcar leídas
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-1">
                {notificaciones.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No hay notificaciones recientes.
                  </div>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`py-2 px-1 text-xs space-y-1 ${!n.leida ? 'bg-emerald-50/40 rounded-lg p-2' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{n.titulo}</span>
                        <span className="text-[10px] text-slate-400">
                          {n.fecha ? new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{n.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          title="Inicializar datos en Firebase Firestore"
        >
          <Database className={`w-3.5 h-3.5 text-emerald-600 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Cargando Datos...' : 'Poblar Datos Demo'}</span>
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3 pl-2">
          <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold flex items-center justify-center text-xs shadow-xs">
            {activeUser.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{activeUser.nombre}</p>
            <p className="text-[11px] text-slate-500 capitalize">{activeUser.rol}</p>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Cerrar sesión?')) logout();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
