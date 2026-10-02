'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Users, Database, Activity, UserPlus, Key, Loader2, AlertCircle, Ban, Trash2 } from 'lucide-react';
import { ROLES } from '@/lib/constants/roles';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import {
  ApiError,
  BackendUsuario,
  CedulaBloqueada,
  DocenteResumen,
  actualizarActivoUsuario,
  eliminarCedulaBloqueada,
  fetchBackendHealth,
  fetchCedulasBloqueadas,
  fetchDocentes,
  fetchDocumentos,
  fetchUsuariosStaff,
} from '@/lib/api';
import { CreateStaffModal } from '@/components/admin/CreateStaffModal';
import { ResetPasswordModal, ResetPasswordTarget } from '@/components/admin/ResetPasswordModal';
import { ChangeRoleModal, ChangeRoleTarget } from '@/components/admin/ChangeRoleModal';
import { AddCedulaBloqueadaModal } from '@/components/admin/AddCedulaBloqueadaModal';

export default function AdminDashboardPage() {
  const { role, user, getAccessToken } = useAuth();

  const [staff, setStaff] = useState<BackendUsuario[]>([]);
  const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
  const [documentosAprobados, setDocumentosAprobados] = useState<number | null>(null);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [cedulasBloqueadas, setCedulasBloqueadas] = useState<CedulaBloqueada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingCedulaId, setRemovingCedulaId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
  const [roleTarget, setRoleTarget] = useState<ChangeRoleTarget | null>(null);

  const loadData = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [staffData, docentesData, aprobados, healthOk, cedulasBloqueadasData] = await Promise.all([
        fetchUsuariosStaff(token),
        fetchDocentes(token),
        fetchDocumentos(token, { estado: 'APROBADO' }),
        fetchBackendHealth(),
        fetchCedulasBloqueadas(token),
      ]);
      setStaff(staffData);
      setDocentes(docentesData);
      setDocumentosAprobados(aprobados.length);
      setBackendUp(healthOk);
      setCedulasBloqueadas(cedulasBloqueadasData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los datos de administración.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActivo = async (staffUser: BackendUsuario) => {
    if (staffUser.id === user?.id) {
      alert('No puedes desactivar tu propia cuenta.');
      return;
    }
    const token = await getAccessToken();
    if (!token) return;
    setTogglingId(staffUser.id);
    try {
      await actualizarActivoUsuario(token, staffUser.id, !staffUser.activo);
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleRemoveCedula = async (entry: CedulaBloqueada) => {
    const token = await getAccessToken();
    if (!token) return;
    setRemovingCedulaId(entry.id);
    try {
      await eliminarCedulaBloqueada(token, entry.id);
      await loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo quitar la cédula de la lista negra.');
    } finally {
      setRemovingCedulaId(null);
    }
  };

  const totalDocumentosPosibles = TOTAL_CHECKLIST_ITEMS * docentes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-100 text-brand-800 rounded-md">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Administración General del Proceso de Posesión
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Gestión de funcionarios, asignación de roles y trazabilidad del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar nuevo funcionario</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Docentes en proceso</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {isLoading ? '—' : docentes.length}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">
            {isLoading
              ? 'Cargando...'
              : `${docentes.filter((d) => d.registroCompletado).length} completaron el registro`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Documentos validados</span>
            <Database className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">
            {isLoading || documentosAprobados === null ? '—' : documentosAprobados}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">
            {isLoading ? 'Cargando...' : `de ${totalDocumentosPosibles} ítems x docente (${TOTAL_CHECKLIST_ITEMS} c/u)`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Roles activos</span>
            <Key className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">{Object.keys(ROLES).length} roles</div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">Control de acceso por rutas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Estado de la plataforma</span>
            <Activity className={`w-4 h-4 ${backendUp ? 'text-emerald-600' : 'text-neutral-400'}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${backendUp ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {backendUp === null ? '—' : backendUp ? 'Operativa' : 'Sin conexión'}
          </div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">Backend en localhost:4000</div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">Usuarios Institucionales</h2>
          <span className="text-xs bg-brand-50 text-brand-800 px-2.5 py-1 rounded-full font-semibold border border-brand-200">
            Rol actual: {role ? ROLES[role].label : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : staff.length === 0 ? (
          <div className="px-6 py-12 text-center text-xs text-neutral-500">
            No hay personal interno registrado todavía.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Nombre y Apellido</th>
                  <th className="py-3 px-6 font-semibold">Correo</th>
                  <th className="py-3 px-6 font-semibold">Teléfono</th>
                  <th className="py-3 px-6 font-semibold">Rol Asignado</th>
                  <th className="py-3 px-6 font-semibold">Estado</th>
                  <th className="py-3 px-6 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">
                      {u.nombres} {u.apellidos}
                    </td>
                    <td className="py-3.5 px-6 text-neutral-600">{u.email}</td>
                    <td className="py-3.5 px-6 text-neutral-600">{u.telefono || '—'}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border">
                        {ROLES[u.rol].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            u.activo
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {u.debeCambiarPassword && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap">
                            Pendiente cambio de clave
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {u.id === user?.id ? (
                        <span className="text-[11px] text-neutral-400 font-medium">Tu cuenta</span>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          {role === 'SUPER_USUARIO' && (
                            <button
                              type="button"
                              onClick={() =>
                                setRoleTarget({
                                  usuarioId: u.id,
                                  nombre: `${u.nombres} ${u.apellidos}`,
                                  rolActual: u.rol as ChangeRoleTarget['rolActual'],
                                })
                              }
                              className="font-semibold text-brand-700 hover:text-brand-900"
                            >
                              Cambiar rol
                            </button>
                          )}
                          {role === 'SUPER_USUARIO' && (
                            <button
                              type="button"
                              onClick={() => setResetTarget({ usuarioId: u.id, nombre: `${u.nombres} ${u.apellidos}` })}
                              className="font-semibold text-amber-700 hover:text-amber-900"
                            >
                              Restablecer contraseña
                            </button>
                          )}
                          {role === 'SUPER_USUARIO' && (
                            <button
                              type="button"
                              disabled={togglingId === u.id}
                              onClick={() => handleToggleActivo(u)}
                              className={`font-semibold disabled:opacity-60 ${
                                u.activo ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'
                              }`}
                            >
                              {u.activo ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista negra de cédulas */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-800">Lista Negra de Cédulas</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Bloquea el auto-registro de una cédula (ej. título académico falso reportado). No afecta cuentas ya
              registradas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBlacklistModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-xs transition-colors"
          >
            <Ban className="w-4 h-4" />
            <span>Agregar a lista negra</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : cedulasBloqueadas.length === 0 ? (
          <div className="px-6 py-12 text-center text-xs text-neutral-500">
            No hay cédulas bloqueadas por ahora.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Cédula</th>
                  <th className="py-3 px-6 font-semibold">Motivo</th>
                  <th className="py-3 px-6 font-semibold">Agregada el</th>
                  <th className="py-3 px-6 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {cedulasBloqueadas.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">{entry.cedula}</td>
                    <td className="py-3.5 px-6 text-neutral-600 max-w-md">{entry.motivo}</td>
                    <td className="py-3.5 px-6 text-neutral-600">
                      {new Date(entry.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        type="button"
                        disabled={removingCedulaId === entry.id}
                        onClick={() => handleRemoveCedula(entry)}
                        className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-60 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateStaffModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={loadData} />
      <AddCedulaBloqueadaModal
        isOpen={blacklistModalOpen}
        onClose={() => setBlacklistModalOpen(false)}
        onAdded={loadData}
      />
      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} />
      <ChangeRoleModal
        target={roleTarget}
        onClose={() => setRoleTarget(null)}
        onChanged={() => {
          setRoleTarget(null);
          loadData();
        }}
      />
    </div>
  );
}
