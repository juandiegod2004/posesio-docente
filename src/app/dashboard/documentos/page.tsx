'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useDocenteChecklist } from '@/hooks/useDocenteChecklist';
import { ApiError, fetchDocumentoUrl } from '@/lib/api';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ArrowLeft,
  FolderOpen,
  Eye,
  Loader2,
} from 'lucide-react';

export default function DocumentosRadicadosPage() {
  const { user, getAccessToken } = useAuth();
  const { items, isLoading, error } = useDocenteChecklist();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewer, setViewer] = useState<{ url: string | null; fileName?: string; error?: string } | undefined>();

  // Filter only items that have an uploaded file
  const uploadedDocs = items.filter((item) => !!item.documentoId);

  const filteredDocs = uploadedDocs.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString() === searchTerm.trim() ||
      (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleView = async (documentoId: string | undefined, fileName?: string) => {
    if (!documentoId) return;
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/docente"
              className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-lg transition-colors mr-1"
              title="Volver al checklist"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="p-2 bg-brand-100 text-brand-800 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Mis Documentos Radicados para Posesión
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Expediente digital del docente: {user ? `${user.firstName} ${user.lastName}` : ''}
                {user?.documentNumber && ` • C.C. ${user.documentNumber}`}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar entre radicados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-brand-600 bg-white"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Total de Soportes Subidos
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {isLoading ? '—' : `${uploadedDocs.length} de ${items.length} archivos radicados`}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Los archivos listados a continuación ya cuentan con constancia de carga en el sistema.
          </div>
        </div>

        <Link
          href="/dashboard/docente"
          className="px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Checklist Completo</span>
        </Link>
      </div>

      {/* Uploaded Documents Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Mobile: card list */}
        <div className="md:hidden divide-y divide-neutral-100">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-xs px-6">
              No se encontraron documentos radicados con el término de búsqueda.
            </div>
          ) : (
            filteredDocs.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-500">#{item.id}</div>
                    <div className="font-semibold text-neutral-900 text-sm truncate">{item.title}</div>
                  </div>
                  {item.status === 'aprobado' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Aprobado
                    </span>
                  )}
                  {item.status === 'en_revision' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex-shrink-0">
                      <Clock className="w-3 h-3 text-amber-600" />
                      En revisión
                    </span>
                  )}
                  {item.status === 'rechazado' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 flex-shrink-0">
                      <AlertCircle className="w-3 h-3 text-red-600" />
                      {item.archivoEliminado ? 'Archivo eliminado' : 'Rechazado'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-brand-700 font-medium text-xs">
                  <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span className="truncate">{item.fileName || 'Documento radicado'}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>{item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : ''}</span>
                  <span>
                    {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('es-CO') : ''}
                  </span>
                </div>

                {item.archivoEliminado ? (
                  <p className="w-full mt-1 py-2 text-center text-[11px] text-red-600 font-semibold">
                    Archivo eliminado del sistema, debes resubirlo
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleView(item.documentoId, item.fileName)}
                    className="w-full mt-1 py-2 border border-neutral-200 hover:border-brand-300 text-neutral-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver detalle</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop / tablet: table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3.5 px-6 font-semibold w-16">Ítem</th>
                <th className="py-3.5 px-6 font-semibold">Documento de Posesión</th>
                <th className="py-3.5 px-6 font-semibold">Archivo Radicado</th>
                <th className="py-3.5 px-6 font-semibold">Tamaño</th>
                <th className="py-3.5 px-6 font-semibold">Fecha de Carga</th>
                <th className="py-3.5 px-6 font-semibold">Estado Actual</th>
                <th className="py-3.5 px-6 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-400 inline" />
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                    No se encontraron documentos radicados con el término de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-neutral-700">
                      #{item.id}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-neutral-900 max-w-xs">
                      <div className="truncate">{item.title}</div>
                      {item.shortDescription && (
                        <div className="text-[11px] text-neutral-400 font-normal truncate">
                          {item.shortDescription}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-brand-700 font-medium">
                      <div className="flex items-center gap-1.5 truncate max-w-xs">
                        <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        <span className="truncate">{item.fileName || 'Documento radicado'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-neutral-600">
                      {item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : '—'}
                    </td>
                    <td className="py-3.5 px-6 text-neutral-500">
                      {item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="py-3.5 px-6">
                      {item.status === 'aprobado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aprobado
                        </span>
                      )}
                      {item.status === 'en_revision' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          En revisión
                        </span>
                      )}
                      {item.status === 'rechazado' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                          <AlertCircle className="w-3 h-3 text-red-600" />
                          {item.archivoEliminado ? 'Archivo eliminado' : 'Rechazado'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      {!item.archivoEliminado && (
                        <button
                          type="button"
                          onClick={() => handleView(item.documentoId, item.fileName)}
                          className="p-1.5 text-neutral-600 hover:text-brand-700 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Ver archivo radicado"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentViewerModal
        url={viewer?.url}
        fileName={viewer?.fileName}
        error={viewer?.error}
        onClose={() => setViewer(undefined)}
      />
    </div>
  );
}
