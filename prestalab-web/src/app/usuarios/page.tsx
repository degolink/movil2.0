'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Lock,
  GraduationCap,
  Briefcase,
  DoorOpen,
} from 'lucide-react';
import Header from '@/components/Header';
import { useActiveRole } from '@/context/RoleContext';
import { Usuario, Sala, UserRole, UserGender } from '@/types';

export default function UsuariosPage() {
  const { activeUser } = useActiveRole();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filterRol, setFilterRol] = useState('todos');
  const [filterGenero, setFilterGenero] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    genero: 'Masculino' as UserGender,
    rol: 'estudiante' as UserRole,
    departamento: 'Ingeniería de Sistemas',
    matriculaOCodigo: '',
    laboratoriosAsignados: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUsers, resSalas] = await Promise.all([
        fetch('/api/usuarios'),
        fetch('/api/salas'),
      ]);
      const dataUsers = await resUsers.json();
      const dataSalas = await resSalas.json();
      if (dataUsers.success) setUsuarios(dataUsers.data || []);
      if (dataSalas.success) setSalas(dataSalas.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono || '',
        genero: user.genero || 'Masculino',
        rol: user.rol,
        departamento: user.departamento || '',
        matriculaOCodigo: user.matriculaOCodigo || '',
        laboratoriosAsignados: user.laboratoriosAsignados || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        genero: 'Masculino',
        rol: 'estudiante',
        departamento: 'Ingeniería de Sistemas',
        matriculaOCodigo: `USR-${Math.floor(100 + Math.random() * 900)}`,
        laboratoriosAsignados: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleLab = (salaId: string) => {
    const current = [...formData.laboratoriosAsignados];
    const index = current.indexOf(salaId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(salaId);
    }
    setFormData({ ...formData, laboratoriosAsignados: current });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado
  const filteredUsuarios = usuarios.filter((u) => {
    if (filterRol !== 'todos' && u.rol !== filterRol) return false;
    if (filterGenero !== 'todos' && (u.genero || 'Masculino') !== filterGenero) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.nombre?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchCode = u.matriculaOCodigo?.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchCode) return false;
    }
    return true;
  });

  return (
    <>
      <Header
        title="Gestión Integral de Usuarios y Matriz de Roles"
        subtitle="Administración de cuentas académicas, género, asignación de privilegios y vinculación de laboratorios a gestores."
      />

      <main className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, código o correo institucional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los Roles</option>
              <option value="estudiante">Estudiantes</option>
              <option value="docente">Docentes</option>
              <option value="gestor">Gestores de Laboratorio</option>
              <option value="admin">Administradores del Sistema</option>
            </select>

            <select
              value={filterGenero}
              onChange={(e) => setFilterGenero(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los Géneros</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar Usuario
          </button>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Directorio Institucional de Usuarios ({filteredUsuarios.length})
              </h3>
              <p className="text-xs text-slate-500">
                Control RBAC con auditoría de género y asignación de facultades
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">Cargando directorio de usuarios...</div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No se encontraron usuarios con los criterios de búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Sexo / Género</th>
                    <th className="p-4">Rol Asignado</th>
                    <th className="p-4">Facultad / Programa</th>
                    <th className="p-4">Laboratorios Supervisados</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredUsuarios.map((u) => {
                    const labsSupervisados = (u.laboratoriosAsignados || [])
                      .map((id) => salas.find((s) => s.id === id)?.codigo)
                      .filter(Boolean);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {u.nombre.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.nombre}</div>
                              <div className="text-[11px] text-slate-400">{u.email}</div>
                              {u.matriculaOCodigo && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {u.matriculaOCodigo}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              u.genero === 'Femenino'
                                ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                                : u.genero === 'Masculino'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.genero || 'Masculino'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                              u.rol === 'admin'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : u.rol === 'gestor'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : u.rol === 'docente'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-blue-50 text-blue-800 border-blue-300'
                            }`}
                          >
                            {u.rol === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                            {u.rol === 'gestor' && <Briefcase className="w-3.5 h-3.5" />}
                            {u.rol === 'docente' && <GraduationCap className="w-3.5 h-3.5" />}
                            {u.rol}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-slate-800 font-medium">
                            {u.departamento || 'Sin especificar'}
                          </span>
                        </td>

                        <td className="p-4">
                          {u.rol === 'admin' ? (
                            <span className="text-xs text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Acceso Total Global (Todas las Salas)
                            </span>
                          ) : u.rol === 'gestor' ? (
                            labsSupervisados.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {labsSupervisados.map((code) => (
                                  <span
                                    key={code}
                                    className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200"
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Sin laboratorios asignados</span>
                            )
                          ) : (
                            <span className="text-slate-400 text-xs">N/A (Consumidor)</span>
                          )}
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => openModal(u)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Modificar rol o asignación"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL CREAR / EDITAR USUARIO */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUser ? 'Modificar Privilegios y Rol' : 'Registrar Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Ing. Carlos Mendoza"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Institucional *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@universidad.edu.co"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sexo / Género *
                    </label>
                    <select
                      value={formData.genero}
                      onChange={(e) =>
                        setFormData({ ...formData, genero: e.target.value as UserGender })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rol en la Matriz *
                    </label>
                    <select
                      value={formData.rol}
                      onChange={(e) =>
                        setFormData({ ...formData, rol: e.target.value as UserRole })
                      }
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white font-semibold"
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="docente">Docente</option>
                      <option value="gestor">Gestor de Laboratorio</option>
                      <option value="admin">Administrador (Full Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Matrícula o Código
                    </label>
                    <input
                      type="text"
                      value={formData.matriculaOCodigo}
                      onChange={(e) =>
                        setFormData({ ...formData, matriculaOCodigo: e.target.value })
                      }
                      placeholder="EST-2024-001"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento o Facultad
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    placeholder="Facultad de Ingeniería Electrónica y Telecomunicaciones"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                {/* Si es GESTOR, seleccionar qué laboratorios supervisa */}
                {formData.rol === 'gestor' && (
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <label className="block text-xs font-bold text-amber-900">
                      Laboratorios Asignados para Supervisión Operativa:
                    </label>
                    <p className="text-[11px] text-amber-800/80">
                      El gestor solo podrá aprobar, rechazar y reasignar solicitudes dirigidas a estas salas:
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                      {salas.map((sala) => {
                        const isChecked = formData.laboratoriosAsignados.includes(sala.id);
                        return (
                          <label
                            key={sala.id}
                            className="flex items-center gap-2 text-xs text-slate-700 hover:bg-white/80 p-1 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleLab(sala.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>
                              <strong>{sala.codigo}</strong> - {sala.nombre}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    Guardar Cambios
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
