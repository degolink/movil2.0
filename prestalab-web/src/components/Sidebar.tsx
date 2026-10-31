'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  DoorOpen,
  Boxes,
  Users,
  BarChart3,
  ShieldCheck,
  Sparkles,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { activeUser, setActiveUserKey, activeUserKey, currentUser, logout } = useActiveRole();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'],
    },
    {
      label: 'Préstamos y Solicitudes',
      href: '/prestamos',
      icon: ArrowLeftRight,
      badge: 'Control',
      allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'],
    },
    {
      label: 'Salas y Laboratorios',
      href: '/salas',
      icon: DoorOpen,
      allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'],
    },
    {
      label: 'Inventario Localizado',
      href: '/inventario',
      icon: Boxes,
      allowedRoles: ['admin', 'gestor', 'estudiante', 'docente'],
    },
    {
      label: 'Usuarios y Roles',
      href: '/usuarios',
      icon: Users,
      badge: 'Admin',
      allowedRoles: ['admin'],
    },
    {
      label: 'Analítica (BI)',
      href: '/analitica',
      icon: BarChart3,
      badge: 'BI',
      allowedRoles: ['admin', 'gestor'],
    },
  ];

  const handleLogout = async () => {
    if (confirm('¿Deseas cerrar tu sesión en PrestaLab Web?')) {
      await logout();
    }
  };

  return (
    <aside className="w-72 bg-emerald-950 text-white flex flex-col shrink-0 border-r border-emerald-900/60 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-emerald-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-inner">
            PL
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              PrestaLab <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-400/30">Web</span>
            </h1>
            <p className="text-xs text-emerald-300/70 font-medium">Plataforma Administrativa</p>
          </div>
        </div>
      </div>

      {/* Role Switcher Sandbox */}
      <div className="p-4 mx-3 my-4 bg-emerald-900/50 rounded-xl border border-emerald-700/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Vista de Rol Activa
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
            activeUser.rol === 'admin'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : activeUser.rol === 'gestor'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {activeUser.rol}
          </span>
        </div>

        <select
          value={activeUserKey}
          onChange={(e) => setActiveUserKey(e.target.value)}
          className="w-full text-xs bg-emerald-950/80 border border-emerald-600/50 text-emerald-100 rounded-lg p-2 font-medium focus:ring-2 focus:ring-emerald-400 focus:outline-none cursor-pointer"
        >
          <option value="admin">Administrador (Full Access)</option>
          <option value="gestorCarlos">Gestor: Ing. Carlos Mendoza (Redes/Robótica)</option>
          <option value="gestorElena">Gestor: Dra. Elena Silva (Cómputo/Multiuso)</option>
          <option value="estudiante">Usuario: Alejandro Morales (Estudiante)</option>
        </select>

        <p className="text-[11px] text-emerald-200/70 mt-2 leading-relaxed">
          {activeUser.laboratoriosNombres || 'Permisos activos según rol'}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/60">
          Módulos del Sistema
        </div>
        {navItems.map((item) => {
          const isAllowed = item.allowedRoles.includes(activeUser.rol);
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (!isAllowed) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-emerald-700/40 cursor-not-allowed select-none"
                title="Acceso restringido para este rol"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-emerald-800" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-900">
                  Bloqueado
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-900 text-emerald-300 border border-emerald-700/50'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="p-4 border-t border-emerald-900/80 bg-emerald-950/90 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-700/60 text-emerald-300 flex items-center justify-center text-xs font-bold">
              {activeUser.nombre.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate max-w-[130px]">
              <p className="text-xs font-semibold text-emerald-100 truncate">{activeUser.nombre}</p>
              <p className="text-[10px] text-emerald-400/80 capitalize">{activeUser.rol}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-emerald-900/80 hover:bg-rose-900/60 text-emerald-400 hover:text-rose-300 transition-colors cursor-pointer border border-emerald-800 hover:border-rose-700"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-2 border-t border-emerald-900/50 flex items-center justify-between text-[10px] text-emerald-300/60">
          <span>Firebase prestalab-f2436</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300">Conectado</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
