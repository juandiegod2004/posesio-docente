'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import { ApiError, DocenteResumen, actualizarActivoUsuario, fetchDocentes } from '@/lib/api';
import { ResetPasswordModal, ResetPasswordTarget } from '@/components/admin/ResetPasswordModal';
import { GraduationCap, Search, Loader2, AlertCircle, CheckCircle2, Clock, KeyRound, BellRing } from 'lucide-react';

/** Documentos subidos que todavía no tienen una decisión (aprobado/rechazado). No es exacto si
 * hay archivos eliminados por el sistema, pero es suficiente para un vistazo general. */
function pendientesPorRevisar(d: DocenteResumen): number {
  return Math.max(d.documentosSubidos - d.documentosAprobados - d.documentosRechazados, 0);
}

function EstadoBadge({ d }: { d: DocenteResumen }) {
  const pendientes = pendientesPorRevisar(d);
  if (d.documentosSubidos === 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
        Sin documentos aún
      </span>
    );
  }
  if (pendientes > 0) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap inline-flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {pendientes} por revisar
      </span>
    );
  }
  if (d.documentosAprobados === TOTAL_CHECKLIST_ITEMS) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Completo
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
      Al día
    </span>
  );
}

export default function DocentesDirectorioPage() {
  const { role, getAccessToken } = useAuth();

  const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadDocentes = React.useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setDocentes(await fetchDocentes(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el directorio de docentes.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadDocentes();
  }, [loadDocentes]);

  const handleToggleActivo = async (d: DocenteResumen) => {
    const token = await getAccessToken();
    if (!token) return;
    setTogglingId(d.usuario.id);
    try {
      await actualizarActivoUsuario(token, d.usuario.id, !d.usuario.activo);
      await loadDocentes();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setTogglingId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = docentes.filter((d) => {
    if (!term) return true;
    return (
      `${d.usuario.nombres} ${d.usuario.apellidos}`.toLowerCase().includes(term) ||
      d.usuario.cedula.includes(term) ||
      d.usuario.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Docentes</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Directorio de docentes en proceso de posesión y sus datos de contacto.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula o correo..."
            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-brand-600"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">Docentes Registrados</h2>
          <span className="text-xs text-neutral-500">
            {isLoading ? 'Cargando...' : `Total: ${filtered.length}`}
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-xs text-neutral-500">
            {docentes.length === 0
              ? 'Todavía no hay docentes registrados en el sistema.'
              : 'No se encontraron docentes con ese nombre, cédula o correo.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-6 font-semibold">Nombre y Apellido</th>
                  <th className="py-3 px-6 font-semibold">Cédula</th>
                  <th className="py-3 px-6 font-semibold">Correo</th>
                  <th className="py-3 px-6 font-semibold">Teléfono</th>
                  <th className="py-3 px-6 font-semibold">Estado</th>
                  <th className="py-3 px-6 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <span>{d.usuario.nombres} {d.usuario.apellidos}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
                          {d.tipoPosesion === 'ADMINISTRATIVO' ? 'Administrativo' : 'Docente'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-neutral-600">{d.usuario.cedula}</td>
                    <td className="py-3.5 px-6 text-neutral-600">{d.usuario.email}</td>
                    <td className="py-3.5 px-6 text-neutral-600">{d.usuario.telefono || '—'}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                            d.usuario.activo
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}
                        >
                          {d.usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <EstadoBadge d={d} />
                        {d.documentacionFinalizada && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-violet-100 text-violet-800 border-violet-200 whitespace-nowrap inline-flex items-center gap-1">
                            <BellRing className="w-3 h-3" />
                            Lista para revisión
                          </span>
                        )}
                        {d.usuario.debeCambiarPassword && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap">
                            Pendiente cambio de clave
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {role === 'SUPER_USUARIO' && (
                          <button
                            type="button"
                            onClick={() =>
                              setResetTarget({ usuarioId: d.usuario.id, nombre: `${d.usuario.nombres} ${d.usuario.apellidos}` })
                            }
                            className="inline-flex items-center gap-1.5 font-semibold text-amber-700 hover:text-amber-900"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Restablecer contraseña
                          </button>
                        )}
                        {role === 'SUPER_USUARIO' && (
                          <button
                            type="button"
                            disabled={togglingId === d.usuario.id}
                            onClick={() => handleToggleActivo(d)}
                            className={`font-semibold disabled:opacity-60 ${
                              d.usuario.activo ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'
                            }`}
                          >
                            {d.usuario.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}
