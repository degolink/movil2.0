'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useActiveRole } from '@/context/RoleContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useActiveRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('prestalab2026');
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 text-slate-100">
      {/* Panel Izquierdo: Branding y Propuesta Institucional */}
      <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-r border-emerald-900/40 relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-extrabold text-2xl shadow-inner">
              PL
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                PrestaLab <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">Web</span>
              </h1>
              <p className="text-xs text-emerald-300/70 font-medium">
                Plataforma Administrativa y Centralizada
              </p>
            </div>
          </div>

          <div className="mt-14 space-y-5 max-w-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/80 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Gestión Integral de Laboratorios
            </span>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Control dinámico de préstamos, espacios académicos y analítica institucional.
            </h2>

            <p className="text-sm text-slate-300/80 leading-relaxed">
              Inicia sesión con tu cuenta institucional para evaluar solicitudes en tiempo real,
              reasignar laboratorios, auditar inventarios físicos y consultar reportes de Business Intelligence.
            </p>
          </div>
        </div>

        {/* Pilares Institucionales */}
        <div className="relative z-10 mt-12 grid grid-cols-3 gap-4 border-t border-emerald-900/50 pt-6 text-xs text-slate-300">
          <div>
            <strong className="text-white block font-bold text-sm">RBAC Seguro</strong>
            <span className="text-[11px] text-emerald-300/70">Roles y permisos granulares</span>
          </div>
          <div>
            <strong className="text-white block font-bold text-sm">Tiempo Real</strong>
            <span className="text-[11px] text-emerald-300/70">Decisiones y reasignación</span>
          </div>
          <div>
            <strong className="text-white block font-bold text-sm">Firebase Admin</strong>
            <span className="text-[11px] text-emerald-300/70">Cloud Firestore v12</span>
          </div>
        </div>
      </div>

      {/* Panel Derecho: Formulario de Login y Accesos Rápidos */}
      <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-center bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Acceso a la Plataforma</h3>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa tus credenciales universitarias autorizadas
            </p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@universidad.edu.co"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <span>Recordar sesión</span>
              </label>
              <a href="#" className="text-emerald-400 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando en Firebase...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos Rápidos para Evaluación Demo */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Cuentas Demo para Evaluación
              </span>
              <span className="text-[10px] text-slate-500">Haz clic para autocompletar</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin.prestalab@universidad.edu.co')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition-all text-xs text-left group"
              >
                <div className="flex items-center justify-between text-rose-400 font-bold text-[11px]">
                  <span>Administrador</span>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-300 font-semibold text-[11px] truncate mt-0.5">Ing. Mateo Gómez</div>
                <div className="text-[10px] text-slate-500">Acceso Total Global</div>
              </button>

              {/* Gestor Carlos */}
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos.mendoza@universidad.edu.co')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-xs text-left group"
              >
                <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                  <span>Gestor Redes</span>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-300 font-semibold text-[11px] truncate mt-0.5">Ing. Carlos Mendoza</div>
                <div className="text-[10px] text-slate-500">Lab. Redes / Robótica</div>
              </button>

              {/* Gestora Elena */}
              <button
                type="button"
                onClick={() => handleQuickLogin('elena.silva@universidad.edu.co')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all text-xs text-left group"
              >
                <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                  <span>Gestora Cómputo</span>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-300 font-semibold text-[11px] truncate mt-0.5">Dra. Elena Silva</div>
                <div className="text-[10px] text-slate-500">Lab. IA / Multiuso</div>
              </button>

              {/* Estudiante */}
              <button
                type="button"
                onClick={() => handleQuickLogin('alejandro.morales@estudiantes.edu.co')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 transition-all text-xs text-left group"
              >
                <div className="flex items-center justify-between text-blue-400 font-bold text-[11px]">
                  <span>Estudiante</span>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-300 font-semibold text-[11px] truncate mt-0.5">Alejandro Morales</div>
                <div className="text-[10px] text-slate-500">Consumo de Servicios</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

