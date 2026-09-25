'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ChecklistDocumentItem } from '@/types/docente-checklist';
import { INITIAL_DOCENTE_CHECKLIST } from '@/lib/constants/docente-documents';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ArrowLeft,
  FolderOpen,
  Eye,
  X,
  FileCheck2,
} from 'lucide-react';

const STORAGE_KEY = 'docente_checklist_state_magdalena';

export default function DocumentosRadicadosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistDocumentItem[]>(INITIAL_DOCENTE_CHECKLIST);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<ChecklistDocumentItem | null>(null);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEY);
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
    } catch (e) {
      console.error('Error loading documents state:', e);
    }
  }, []);

  // Filter only items that have an uploaded file
  const uploadedDocs = items.filter((item) => !!item.fileName);

  const filteredDocs = uploadedDocs.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString() === searchTerm.trim() ||
      (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <span className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                Mis Documentos Radicados para Posesión
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Expediente digital del docente: {user ? `${user.firstName} ${user.lastName}` : 'Lic. Fernando Silva Pacheco'} • C.C. 1.082.945.312
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
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-blue-600 bg-white"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Total de Soportes Subidos
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
            {uploadedDocs.length} de {items.length} archivos radicados
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Los archivos listados a continuación ya cuentan con constancia de carga en el sistema.
          </div>
        </div>

        <Link
          href="/dashboard/docente"
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Checklist Completo</span>
        </Link>
      </div>

      {/* Uploaded Documents Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 text-xs">
                    No se encontraron documentos radicados con el término de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-neutral-700">
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
                    <td className="py-3.5 px-6 font-mono text-blue-700 font-medium">
                      <div className="flex items-center gap-1.5 truncate max-w-xs">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-neutral-600 font-mono">
                      {item.fileSize ? `${(item.fileSize / 1024).toFixed(0)} KB` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 text-neutral-500">
                      {item.uploadedAt
                        ? new Date(item.uploadedAt).toLocaleDateString('es-CO')
                        : 'Reciente'}
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
                          Rechazado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(item)}
                        className="p-1.5 text-neutral-600 hover:text-blue-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Ver detalle del archivo"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-neutral-900 truncate">
                  {previewDoc.fileName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-100 rounded-xl p-6 text-center space-y-3">
              <FileCheck2 className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800">
                  {previewDoc.title}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Ítem #{previewDoc.id} • {previewDoc.fileName}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Estado actual:{' '}
                  <span className="font-bold capitalize text-blue-700">
                    {previewDoc.status.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-neutral-400">
                Secretaría de Educación del Magdalena
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
