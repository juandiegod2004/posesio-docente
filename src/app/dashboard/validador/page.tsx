'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants/roles';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import {
  ApiError,
  DocenteResumen,
  DocumentoListItem,
  EstadoDocumento,
  descargarListadoAprobados,
  fetchDocentes,
  fetchDocumentoUrl,
  fetchDocumentos,
  validarDocumento,
} from '@/lib/api';
import { RejectDocumentModal, RejectableDocument } from '@/components/validador/RejectDocumentModal';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import {
  FileCheck,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  Clock,
  BellRing,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

const ESTADO_LABEL: Record<EstadoDocumento, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'Por verificar',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ARCHIVO_ELIMINADO: 'Archivo eliminado',
};

const ESTADO_BADGE_CLASS: Record<EstadoDocumento, string> = {
  PENDIENTE: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  EN_REVISION: 'bg-amber-100 text-amber-800 border-amber-200',
  APROBADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RECHAZADO: 'bg-red-100 text-red-800 border-red-200',
  ARCHIVO_ELIMINADO: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Bandeja exclusiva de SAC: perdió acceso a GET /api/docentes y a todo lo demás del perfil del
 * docente (solo conserva GET /api/documentos, ya filtrada server-side a la fila de autorización
 * de notificación electrónica, y GET /api/documentos/:id/url). Por eso no reutiliza la lista de
 * docentes de abajo ni enlaza a /dashboard/validador/[docenteId] — esa ruta le daría 403.
 */
function SacAutorizacionesInbox() {
  const { getAccessToken } = useAuth();
  const [documentos, setDocumentos] = useState<DocumentoListItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DocumentoListItem | null>(null);
  const [viewer, setViewer] = useState<{ url: string | null; fileName?: string; error?: string } | undefined>();

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setDocumentos(await fetchDocumentos(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la bandeja de autorizaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const term = search.trim().toLowerCase();
  const filtered = documentos.filter((d) => {
    if (!term) return true;
    return (
      `${d.docente.nombres} ${d.docente.apellidos}`.toLowerCase().includes(term) ||
      d.docente.cedula.includes(term)
    );
  });

  const handleView = async (documentoId: string, fileName?: string) => {
    setViewer({ url: null, fileName });
    const token = await getAccessToken();
    if (!token) return;
    try {
      const url = await fetchDocumentoUrl(token, documentoId);
      setViewer({ url, fileName });
    } catch (err) {
      setViewer({
        url: null,
        fileName,
        error: err instanceof ApiError ? err.message : 'No se pudo abrir el documento.',
      });
    }
  };

  // Dos SAC pueden tener esta bandeja abierta a la vez: si el backend responde 409, alguien
  // más ya decidió este documento. Refrescamos siempre para no reintentar sobre datos viejos.
  const handleValidationError = (err: unknown, fallbackMessage: string) => {
    alert(err instanceof ApiError ? err.message : fallbackMessage);
    load();
  };

  const handleApprove = async (doc: DocumentoListItem) => {
    const token = await getAccessToken();
    if (!token) return;
    setActingOnId(doc.id);
    try {
      await validarDocumento(token, doc.id, { estado: 'APROBADO' });
      await load();
    } catch (err) {
      handleValidationError(err, 'No se pudo aprobar el documento.');
    } finally {
      setActingOnId(null);
    }
  };

  const handleConfirmReject = async (comentario: string) => {
    const doc = rejectTarget;
    if (!doc) return;
    const token = await getAccessToken();
    if (!token) return;
    setActingOnId(doc.id);
    try {
      await validarDocumento(token, doc.id, { estado: 'RECHAZADO', comentario });
      await load();
      setRejectTarget(null);
    } catch (err) {
      handleValidationError(err, 'No se pudo rechazar el documento.');
    } finally {
      setActingOnId(null);
    }
  };

  const rejectableDoc: RejectableDocument | null = rejectTarget
    ? {
        docente: {
          nombres: rejectTarget.docente.nombres,
          apellidos: rejectTarget.docente.apellidos,
          cedula: rejectTarget.docente.cedula,
        },
        tipoDocumento: { orden: rejectTarget.tipoDocumento.orden, nombre: rejectTarget.tipoDocumento.nombre },
        archivoNombre: rejectTarget.archivoNombre,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Autorizaciones Pendientes</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Aprueba o rechaza la autorización de notificación electrónica de cada docente. No tienes acceso al
            resto de su perfil ni checklist.
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
          <h2 className="text-sm font-bold text-neutral-800">Autorizaciones de Notificación Electrónica</h2>
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
            {documentos.length === 0
              ? 'Todavía no hay autorizaciones radicadas.'
              : 'No se encontraron docentes con ese nombre o cédula.'}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-900 text-sm truncate">
                      {d.docente.nombres} {d.docente.apellidos}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${ESTADO_BADGE_CLASS[d.estado]}`}>
                      {ESTADO_LABEL[d.estado]}
                    </span>
                  </div>
                  <div className="text-neutral-500 text-[11px]">
                    C.C. {d.docente.cedula} · {d.archivoNombre} · {new Date(d.subidoEn).toLocaleDateString('es-CO')}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pl-0 sm:pl-0">
                  {d.estado !== 'ARCHIVO_ELIMINADO' && (
                    <button
                      type="button"
                      onClick={() => handleView(d.id, d.archivoNombre)}
                      className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-brand-700 hover:border-brand-300 hover:bg-neutral-50 transition-colors"
                      title="Ver documento radicado"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {(d.estado === 'PENDIENTE' || d.estado === 'EN_REVISION') && (
                    <>
                      <button
                        type="button"
                        disabled={actingOnId === d.id}
                        onClick={() => handleApprove(d)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-[11px] font-bold text-center transition-colors shadow-xs whitespace-nowrap"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={actingOnId === d.id}
                        onClick={() => setRejectTarget(d)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold text-center transition-colors whitespace-nowrap"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-brand-50 border border-brand-200/80 rounded-xl p-4 text-xs text-brand-900 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <span>
          Tu rol actual es <strong>SAC</strong>. Solo puedes aprobar o rechazar la autorización de notificación
          electrónica; no tienes acceso al resto del perfil ni checklist del docente. Toda decisión queda
          registrada con usuario y fecha.
        </span>
      </div>

      <RejectDocumentModal
        doc={rejectableDoc}
        isOpen={rejectTarget !== null}
        isSubmitting={!!rejectTarget && actingOnId === rejectTarget.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      <DocumentViewerModal
        url={viewer?.url}
        fileName={viewer?.fileName}
        error={viewer?.error}
        onClose={() => setViewer(undefined)}
      />
    </div>
  );
}

/** Documentos subidos que todavía no tienen una decisión (aprobado/rechazado). No es exacto si
 * hay archivos eliminados por el sistema, pero es suficiente para priorizar la lista. */
function pendientesPorRevisar(d: DocenteResumen): number {
  return Math.max(d.documentosSubidos - d.documentosAprobados - d.documentosRechazados, 0);
}

export default function ValidadorDashboardPage() {
  const { role, getAccessToken } = useAuth();
  const canValidate = role ? ROLES[role].canValidateDocuments : false;
  // Gestor Documental solo ve docentes con el resto del checklist ya aprobado (el backend ya
  // filtra la lista); el copy de "revisar/aprobar/rechazar todo" de las demás roles no le aplica.
  const esGestorDocumental = role === 'GESTOR_DOCUMENTAL';

  const [docentes, setDocentes] = useState<DocenteResumen[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingListado, setIsDownloadingListado] = useState(false);

  useEffect(() => {
    if (role === 'SAC') return;
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
  }, [getAccessToken, role]);

  const handleDescargarListado = async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsDownloadingListado(true);
    try {
      const { blob, fileName } = await descargarListadoAprobados(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo descargar el listado.');
    } finally {
      setIsDownloadingListado(false);
    }
  };

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

  // SAC perdió acceso a GET /api/docentes — bandeja completamente distinta, sin lista de
  // docentes ni link a /dashboard/validador/[docenteId] (le daría 403).
  if (role === 'SAC') {
    return <SacAutorizacionesInbox />;
  }

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
              {esGestorDocumental ? 'Docentes Listos para Acta de Posesión' : 'Bandeja de Validación Documental'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {esGestorDocumental
              ? 'Consulta el perfil y sube o valida el acta de posesión de docentes con el resto de su checklist ya aprobado.'
              : 'Selecciona un docente para revisar, aprobar o rechazar con comentario sus documentos radicados.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={isDownloadingListado}
            onClick={handleDescargarListado}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60 whitespace-nowrap"
            title="Descargar listado de docentes 100% aprobados (.xlsx)"
          >
            {isDownloadingListado ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            Listado de aprobados
          </button>
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
            {esGestorDocumental ? 'Docentes con Checklist Aprobado' : 'Docentes en Proceso de Posesión'}
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
            ? role === 'TALENTO_HUMANO'
              ? 'Puedes aprobar o rechazar los 23 documentos del checklist a tu cargo (no incluye la autorización, que valida SAC, ni el acta de posesión, que valida Gestor Documental). Toda decisión queda registrada con usuario y fecha.'
              : role === 'GESTOR_DOCUMENTAL'
              ? 'Solo puedes subir, aprobar o rechazar el acta de posesión, y únicamente de docentes con el resto de su checklist ya aprobado. Toda decisión queda registrada con usuario y fecha.'
              : 'Toda aprobación o rechazo queda registrado con usuario y fecha para trazabilidad ante la Secretaría.'
            : 'Tu rol tiene acceso de solo consulta; la aprobación o rechazo de documentos está reservada a SAC, Talento Humano, Gestor Documental y Super Usuario.'}
        </span>
      </div>

    </div>
  );
}
