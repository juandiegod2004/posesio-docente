'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { puedeValidarDocumento } from '@/lib/constants/roles';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import {
  ApiError,
  ChecklistItemBackend,
  DocentePerfilCompleto,
  DocenteResumen,
  EstadoDocumento,
  actualizarActivoUsuario,
  descargarDocumentosAprobados,
  fetchChecklist,
  fetchDocentePerfil,
  fetchDocentes,
  fetchDocumentoUrl,
  validarDocumento,
} from '@/lib/api';
import {
  ESTADO_CIVIL_OPTIONS,
  SEXO_OPTIONS,
  TIPOS_DOCUMENTO_IDENTIDAD,
  TIPO_SANGRE_OPTIONS,
} from '@/lib/constants/informacion-adicional';
import { RejectDocumentModal, RejectableDocument } from '@/components/validador/RejectDocumentModal';
import { StaffUploadDocumentModal, StaffUploadTarget } from '@/components/validador/StaffUploadDocumentModal';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { ResetPasswordModal, ResetPasswordTarget } from '@/components/admin/ResetPasswordModal';
import { ArrowLeft, Eye, Loader2, AlertCircle, KeyRound, Download, BellRing, Upload } from 'lucide-react';

function etiqueta(options: { value: string; label: string }[], value: string | null): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  // timeZone: 'UTC' es necesario: el backend guarda fecha de nacimiento/expedición como
  // medianoche UTC (fecha de calendario, sin hora real) — sin esto, en timezones detrás de
  // UTC (como Colombia, UTC-5) se muestra un día antes del real.
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function lugar(
  pais: string | null,
  departamento: { nombre: string } | null,
  ciudad: { nombre: string } | null
): string {
  if (ciudad && departamento) return `${ciudad.nombre}, ${departamento.nombre}`;
  return pais ?? '—';
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-neutral-800 font-medium mt-0.5">{valor}</p>
    </div>
  );
}

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

/** Ya se tomó una decisión (o el archivo se eliminó): no hay más acciones de validación. */
function esEstadoFinal(estado: EstadoDocumento): boolean {
  return estado === 'APROBADO' || estado === 'RECHAZADO' || estado === 'ARCHIVO_ELIMINADO';
}

/** Ítems que son responsabilidad del propio docente (todos salvo examen médico ocupacional y
 * acta de posesión, que suben Talento Humano / Gestor Documental una vez el resto está aprobado). */
function esResponsabilidadDelDocente(item: ChecklistItemBackend): boolean {
  return !item.subidoPor || item.subidoPor === 'DOCENTE';
}

type FiltroChecklist = 'todos' | 'por_verificar' | 'aprobado' | 'no_subido' | 'rechazado';

function coincideFiltro(item: ChecklistItemBackend, filtro: FiltroChecklist): boolean {
  if (filtro === 'todos') return true;
  if (filtro === 'no_subido') return !item.documento;
  if (!item.documento) return false;
  if (filtro === 'aprobado') return item.documento.estado === 'APROBADO';
  if (filtro === 'por_verificar') return !esEstadoFinal(item.documento.estado);
  return item.documento.estado === 'RECHAZADO' || item.documento.estado === 'ARCHIVO_ELIMINADO';
}

function ValidadoPorInfo({ documento }: { documento: NonNullable<ChecklistItemBackend['documento']> }) {
  if (!documento.validadoPor) return null;
  const fecha = documento.validadoEn ? new Date(documento.validadoEn).toLocaleDateString('es-CO') : null;
  const prefijo = esEstadoFinal(documento.estado) ? 'Por' : 'Última revisión:';
  return (
    <div className="text-[10px] text-neutral-400">
      {prefijo} {documento.validadoPor.nombres} {documento.validadoPor.apellidos}
      {fecha && ` · ${fecha}`}
    </div>
  );
}

export default function ValidadorDocenteDetailPage() {
  const params = useParams<{ docenteId: string }>();
  const docenteId = params.docenteId;
  const { role, getAccessToken } = useAuth();
  const router = useRouter();

  const [docente, setDocente] = useState<DocenteResumen | null>(null);
  const [perfil, setPerfil] = useState<DocentePerfilCompleto | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItemBackend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOnId, setActingOnId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ChecklistItemBackend | null>(null);
  const [staffUploadTarget, setStaffUploadTarget] = useState<StaffUploadTarget | null>(null);
  const [viewer, setViewer] = useState<{ url: string | null; fileName?: string; error?: string } | undefined>();
  const [resetTarget, setResetTarget] = useState<ResetPasswordTarget | null>(null);
  const [togglingActivo, setTogglingActivo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [filtro, setFiltro] = useState<FiltroChecklist>('todos');

  // SAC perdió acceso a GET /api/docentes, /:id, /:id/checklist y /:id/descargar — esta
  // página entera le daría 403. El proxy no distingue esta sub-ruta de /dashboard/validador
  // (misma "sección"), así que la guarda tiene que vivir acá, no solo en la ausencia de links.
  useEffect(() => {
    if (role === 'SAC') {
      router.replace('/dashboard/validador');
    }
  }, [role, router]);

  const load = useCallback(async () => {
    if (role === 'SAC') return;
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [{ checklist: items }, docentes, perfilData] = await Promise.all([
        fetchChecklist(token, docenteId),
        fetchDocentes(token),
        fetchDocentePerfil(token, docenteId),
      ]);
      setChecklist(items);
      setDocente(docentes.find((d) => d.id === docenteId) ?? null);
      setPerfil(perfilData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el checklist de este docente.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, docenteId, role]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActivo = async () => {
    if (!docente) return;
    const token = await getAccessToken();
    if (!token) return;
    setTogglingActivo(true);
    try {
      await actualizarActivoUsuario(token, docente.usuario.id, !docente.usuario.activo);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo actualizar la cuenta.');
    } finally {
      setTogglingActivo(false);
    }
  };

  const handleDownload = async () => {
    if (!docente) return;
    const token = await getAccessToken();
    if (!token) return;
    setIsDownloading(true);
    try {
      const { blob, fileName } = await descargarDocumentosAprobados(token, docente.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'No se pudo descargar el archivo .zip.');
    } finally {
      setIsDownloading(false);
    }
  };

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

  // Dos validadores pueden tener esta página abierta a la vez para el mismo docente:
  // si el backend responde 409, alguien más ya decidió este documento. Refrescamos
  // siempre para que el botón desaparezca y no se pueda reintentar sobre datos viejos.
  const handleValidationError = (err: unknown, fallbackMessage: string): boolean => {
    const isConflict = err instanceof ApiError && err.status === 409;
    alert(isConflict || err instanceof ApiError ? (err as ApiError).message : fallbackMessage);
    load();
    return isConflict;
  };

  const handleApprove = async (item: ChecklistItemBackend) => {
    if (!item.documento) return;
    const token = await getAccessToken();
    if (!token) return;
    setActingOnId(item.documento.id);
    try {
      await validarDocumento(token, item.documento.id, { estado: 'APROBADO' });
      await load();
    } catch (err) {
      handleValidationError(err, 'No se pudo aprobar el documento.');
    } finally {
      setActingOnId(null);
    }
  };

  const handleConfirmReject = async (comentario: string) => {
    const item = rejectTarget;
    if (!item?.documento) return;
    const token = await getAccessToken();
    if (!token) return;
    setActingOnId(item.documento.id);
    try {
      await validarDocumento(token, item.documento.id, { estado: 'RECHAZADO', comentario });
      await load();
      setRejectTarget(null);
    } catch (err) {
      if (handleValidationError(err, 'No se pudo rechazar el documento.')) {
        setRejectTarget(null);
      }
    } finally {
      setActingOnId(null);
    }
  };

  // Gatea el botón de subida de examen médico/acta de posesión: esos 2 ítems solo se habilitan
  // cuando el resto del checklist del docente (todo lo que es su responsabilidad) ya está aprobado.
  const otros23Aprobados =
    checklist.filter(esResponsabilidadDelDocente).length > 0 &&
    checklist.filter(esResponsabilidadDelDocente).every((i) => i.documento?.estado === 'APROBADO');

  const porVerificarCount = checklist.filter((i) => i.documento && !esEstadoFinal(i.documento.estado)).length;
  const aprobadoCount = checklist.filter((i) => i.documento?.estado === 'APROBADO').length;
  const noSubidoCount = checklist.filter((i) => !i.documento).length;
  const rechazadoCount = checklist.filter(
    (i) => i.documento?.estado === 'RECHAZADO' || i.documento?.estado === 'ARCHIVO_ELIMINADO'
  ).length;

  const filtros: { key: FiltroChecklist; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: checklist.length },
    { key: 'por_verificar', label: 'Por verificar', count: porVerificarCount },
    { key: 'aprobado', label: 'Aprobados', count: aprobadoCount },
    { key: 'no_subido', label: 'No subido', count: noSubidoCount },
    { key: 'rechazado', label: 'Rechazados', count: rechazadoCount },
  ];

  const checklistFiltrado = checklist
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => coincideFiltro(item, filtro));

  const rejectableDoc: RejectableDocument | null =
    rejectTarget?.documento && docente
      ? {
          docente: {
            nombres: docente.usuario.nombres,
            apellidos: docente.usuario.apellidos,
            cedula: docente.usuario.cedula,
          },
          tipoDocumento: {
            orden: checklist.findIndex((i) => i.tipoDocumentoId === rejectTarget.tipoDocumentoId) + 1,
            nombre: rejectTarget.nombre,
          },
          archivoNombre: rejectTarget.documento.archivoNombre ?? '',
        }
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/validador"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-brand-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver a la bandeja
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
            {isLoading ? 'Cargando docente...' : docente ? `${docente.usuario.nombres} ${docente.usuario.apellidos}` : 'Docente no encontrado'}
            {docente && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-neutral-100 text-neutral-600 border-neutral-300 whitespace-nowrap">
                {docente.tipoPosesion === 'ADMINISTRATIVO' ? 'Administrativo' : 'Docente'}
              </span>
            )}
          </h1>
          {docente && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              C.C. {docente.usuario.cedula} · {docente.usuario.email}
            </p>
          )}
        </div>
        {docente && (
          <div className="flex items-center gap-2 self-start">
            <span
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                docente.usuario.activo
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}
            >
              {docente.usuario.activo ? 'Activo' : 'Inactivo'}
            </span>
            {docente.documentacionFinalizada && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border bg-violet-100 text-violet-800 border-violet-200 whitespace-nowrap">
                <BellRing className="w-3.5 h-3.5" />
                Lista para revisión
              </span>
            )}
            {docente.usuario.debeCambiarPassword && (
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold border bg-amber-100 text-amber-800 border-amber-200 whitespace-nowrap">
                Pendiente cambio de clave
              </span>
            )}
            {role === 'SUPER_USUARIO' && (
              <button
                type="button"
                onClick={() =>
                  setResetTarget({
                    usuarioId: docente.usuario.id,
                    nombre: `${docente.usuario.nombres} ${docente.usuario.apellidos}`,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Restablecer contraseña
              </button>
            )}
            {role === 'SUPER_USUARIO' && (
              <button
                type="button"
                disabled={togglingActivo}
                onClick={handleToggleActivo}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-60 ${
                  docente.usuario.activo
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {docente.usuario.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
              </button>
            )}
            <span className="text-xs bg-brand-50 text-brand-800 px-3 py-1.5 rounded-full font-semibold border border-brand-200">
              {docente.documentosAprobados}/{TOTAL_CHECKLIST_ITEMS} aprobados
            </span>
            {docente.documentosAprobados > 0 && (
              <button
                type="button"
                disabled={isDownloading}
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-60"
                title="Descargar documentos aprobados en un .zip"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                Descargar aprobados
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-bold text-neutral-800">Datos personales</h2>
        </div>
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : !perfil ? (
          <div className="py-10 text-center text-xs text-neutral-500">No se pudo cargar la información personal.</div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <Campo
              label="Tipo y número de documento"
              valor={`${etiqueta(TIPOS_DOCUMENTO_IDENTIDAD, perfil.usuario.tipoDocumento)} · ${perfil.usuario.cedula}`}
            />
            <Campo label="Sexo" valor={etiqueta(SEXO_OPTIONS, perfil.sexo)} />
            <Campo label="Fecha de nacimiento" valor={formatFecha(perfil.fechaNacimiento)} />
            <Campo
              label="Lugar de nacimiento"
              valor={lugar(perfil.paisNacimiento, perfil.departamentoNacimiento, perfil.ciudadNacimiento)}
            />
            <Campo label="Cantidad de hijos" valor={perfil.cantidadHijos != null ? String(perfil.cantidadHijos) : '—'} />
            <Campo label="Fecha de expedición de cédula" valor={formatFecha(perfil.fechaExpedicionCedula)} />
            <Campo
              label="Lugar de expedición de cédula"
              valor={lugar(null, perfil.departamentoExpedicion, perfil.ciudadExpedicion)}
            />
            <Campo label="Estado civil" valor={etiqueta(ESTADO_CIVIL_OPTIONS, perfil.estadoCivil)} />
            <Campo label="Tipo de sangre" valor={etiqueta(TIPO_SANGRE_OPTIONS, perfil.tipoSangre)} />
            <Campo label="Dirección" valor={perfil.direccion ?? '—'} />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 space-y-3">
          <h2 className="text-sm font-bold text-neutral-800">
            Checklist de Posesión {docente?.tipoPosesion === 'ADMINISTRATIVO' ? 'Administrativa' : 'Docente'}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {filtros.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltro(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
                  filtro === f.key
                    ? 'bg-brand-700 border-brand-700 text-white'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : checklistFiltrado.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-500">No hay documentos en este estado.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {checklistFiltrado.map(({ item, index }) => {
              const documento = item.documento;
              const puedeValidar = puedeValidarDocumento(role, item.codigo);
              const documentoFinal = !!documento && esEstadoFinal(documento.estado);
              // Super Usuario puede corregir una validación YA decidida (ej. desaprobar un
              // documento que se había aprobado por error) — el resto de roles solo actúa
              // sobre lo pendiente. ARCHIVO_ELIMINADO queda afuera siempre: no hay archivo
              // que juzgar, exige resubida sí o sí.
              const esCorreccion =
                documentoFinal && documento?.estado !== 'ARCHIVO_ELIMINADO' && role === 'SUPER_USUARIO';
              // Examen médico ocupacional / acta de posesión: no los sube el docente, los sube
              // el rol de staff indicado en `subidoPor`, y solo una vez aprobado el resto.
              const puedeSubir =
                !!item.subidoPor && item.subidoPor !== 'DOCENTE' && (role === item.subidoPor || role === 'SUPER_USUARIO');
              const necesitaSubida = !documento || documento.estado === 'RECHAZADO' || documento.estado === 'ARCHIVO_ELIMINADO';
              return (
                <div key={item.tipoDocumentoId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-lg border font-semibold text-xs flex items-center justify-center flex-shrink-0 bg-neutral-100 border-neutral-300 text-neutral-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900">{item.nombre}</h3>
                        {documento ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${ESTADO_BADGE_CLASS[documento.estado]}`}>
                            {ESTADO_LABEL[documento.estado]}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-neutral-100 text-neutral-500 border-neutral-300 whitespace-nowrap">
                            No subido
                          </span>
                        )}
                      </div>
                      {documento && (
                        <div className="text-[11px] text-neutral-600 flex flex-wrap items-center gap-x-2">
                          <span className="text-brand-600 font-medium truncate max-w-xs">{documento.archivoNombre}</span>
                          <span className="text-neutral-400">· {new Date(documento.subidoEn).toLocaleDateString('es-CO')}</span>
                        </div>
                      )}
                      {(documento?.estado === 'RECHAZADO' || documento?.estado === 'ARCHIVO_ELIMINADO') && documento?.comentarioValidador && (
                        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-1 max-w-md">
                          “{documento.comentarioValidador}”
                        </p>
                      )}
                      {documento && <ValidadoPorInfo documento={documento} />}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pl-10 sm:pl-0">
                    {documento && documento.estado !== 'ARCHIVO_ELIMINADO' && (
                      <button
                        type="button"
                        onClick={() => handleView(documento.id, documento.archivoNombre)}
                        className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-brand-700 hover:border-brand-300 hover:bg-neutral-50 transition-colors"
                        title="Ver documento radicado"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {documento && puedeValidar && (!documentoFinal || esCorreccion) && (
                      <>
                        {esCorreccion && (
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wide whitespace-nowrap">
                            Corregir:
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={actingOnId === documento.id || documento.estado === 'APROBADO'}
                          onClick={() => handleApprove(item)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-[11px] font-bold text-center transition-colors shadow-xs whitespace-nowrap"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={actingOnId === documento.id || documento.estado === 'RECHAZADO'}
                          onClick={() => setRejectTarget(item)}
                          className="px-3.5 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold text-center transition-colors whitespace-nowrap"
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    {documento && puedeValidar && documentoFinal && !esCorreccion && (
                      <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
                        {documento.estado === 'ARCHIVO_ELIMINADO' ? 'Pendiente de reenvío' : 'Validación finalizada'}
                      </span>
                    )}
                    {puedeSubir && necesitaSubida && (
                      <button
                        type="button"
                        disabled={!otros23Aprobados}
                        onClick={() =>
                          setStaffUploadTarget({ docenteId, tipoDocumentoId: item.tipoDocumentoId, nombre: item.nombre })
                        }
                        title={
                          otros23Aprobados
                            ? undefined
                            : 'Se habilita cuando el resto del checklist del docente esté aprobado.'
                        }
                        className="px-3.5 py-2 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-lg text-[11px] font-bold text-center transition-colors shadow-xs whitespace-nowrap inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Subir documento
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RejectDocumentModal
        doc={rejectableDoc}
        isOpen={rejectTarget !== null}
        isSubmitting={!!rejectTarget?.documento && actingOnId === rejectTarget.documento.id}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
      />

      <DocumentViewerModal
        url={viewer?.url}
        fileName={viewer?.fileName}
        error={viewer?.error}
        onClose={() => setViewer(undefined)}
      />

      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} />

      <StaffUploadDocumentModal
        target={staffUploadTarget}
        onClose={() => setStaffUploadTarget(null)}
        onUploadSuccess={() => {
          setStaffUploadTarget(null);
          load();
        }}
      />
    </div>
  );
}
