'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants/roles';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import { ApiError, DocenteResumen, fetchDocentes } from '@/lib/api';
import { FileCheck, CheckCircle2, Search, Loader2, AlertCircle, ChevronRight, Clock, BellRing } from 'lucide-react';

/** Documentos subidos que todavía no tienen una decisión (aprobado/rechazado). No es exacto si
 * hay archivos eliminados por el sistema, pero es suficiente para priorizar la lista. */
function pendientesPorRevisar(d: DocenteResumen): number {
  return Math.max(d.documentosSubidos - d.documentosAprobados - d.documentosRechazados, 0);
}

export default function ValidadorDashboardPage() {
  const { role, getAccessToken } = useAuth();
  const canValidate = role ? ROLES[role].canValidateDocuments : false;
  // Gestor Documental solo ve docentes con documentación ya aprobada (el backend ya filtra
  // la lista); el copy de "revisar/aprobar/rechazar" de las demás roles no le aplica.
  const esGestorDocumental = role === 'GESTOR_DOCUMENTAL';

  const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        setDocentes(await fetchDocentes(token));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de docentes.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getAccessToken]);

  const term = search.trim().toLowerCase();
  const filtered = docentes
    .filter((d) => {
      if (!term) return true;
      return (
        `${d.usuario.nombres} ${d.usuario.apellidos}`.toLowerCase().includes(term) ||
        d.usuario.cedula.includes(term)
      );
    })
    .sort((a, b) => pendientesPorRevisar(b) - pendientesPorRevisar(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              {esGestorDocumental ? 'Docentes con Documentación Aprobada' : 'Bandeja de Validación Documental'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {esGestorDocumental
              ? 'Consulta el perfil y los documentos de docentes que ya completaron su proceso de posesión.'
              : 'Selecciona un docente para revisar, aprobar o rechazar con comentario sus documentos radicados.'}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o cédula..."
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
          <h2 className="text-sm font-bold text-neutral-800">
            {esGestorDocumental ? 'Docentes con Proceso Culminado' : 'Docentes en Proceso de Posesión'}
          </h2>
          <span className="text-xs text-neutral-500">
            {isLoading ? 'Cargando...' : `Total: ${filtered.length}`}
          </span>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs px-6">
            {docentes.length === 0
              ? 'Todavía no hay docentes registrados en el sistema.'
              : 'No se encontraron docentes con ese nombre o cédula.'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((d) => {
              const pendientes = pendientesPorRevisar(d);
              return (
                <Link
                  key={d.id}
                  href={`/dashboard/validador/${d.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50/80 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 text-sm truncate">
                        {d.usuario.nombres} {d.usuario.apellidos}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
                        {d.tipoPosesion === 'ADMINISTRATIVO' ? 'Administrativo' : 'Docente'}
                      </span>
                    </div>
                    <div className="text-neutral-500 text-[11px]">
                      C.C. {d.usuario.cedula} · {d.documentosAprobados}/{TOTAL_CHECKLIST_ITEMS} aprobados
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {d.documentacionFinalizada && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-violet-100 text-violet-800 border-violet-200 whitespace-nowrap inline-flex items-center gap-1">
                        <BellRing className="w-3 h-3" />
                        Lista para revisión
                      </span>
                    )}
                    {d.usuario.debeCambiarPassword && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap">
                        Pendiente cambio de clave
                      </span>
                    )}
                    {d.documentosSubidos === 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
                        Sin documentos aún
                      </span>
                    ) : pendientes > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pendientes} por revisar
                      </span>
                    ) : d.documentosAprobados === TOTAL_CHECKLIST_ITEMS ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completo
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
                        Al día
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-brand-50 border border-brand-200/80 rounded-xl p-4 text-xs text-brand-900 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <span>
          Tu rol actual es <strong>{role ? ROLES[role].label : ''}</strong>.{' '}
          {canValidate
            ? role === 'SAC'
              ? 'Solo puedes aprobar o rechazar la autorización de notificación electrónica; el resto del checklist lo valida Talento Humano. Toda decisión queda registrada con usuario y fecha.'
              : role === 'TALENTO_HUMANO'
              ? 'Puedes aprobar o rechazar los 24 documentos del checklist, excepto la autorización de notificación electrónica (la valida SAC). Toda decisión queda registrada con usuario y fecha.'
              : 'Toda aprobación o rechazo queda registrado con usuario y fecha para trazabilidad ante la Secretaría.'
            : esGestorDocumental
            ? 'Tu rol tiene acceso de solo consulta y únicamente a docentes con toda su documentación ya aprobada; mientras un docente esté en proceso no aparece aquí.'
            : 'Tu rol tiene acceso de solo consulta; la aprobación o rechazo de documentos está reservada a SAC, Talento Humano y Super Usuario.'}
        </span>
      </div>

    </div>
  );
}
