'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChecklistDocumentItem, DocumentStatus } from '@/types/docente-checklist';
import { INITIAL_DOCENTE_CHECKLIST } from '@/lib/constants/docente-documents';
import { UploadDocumentModal } from '@/components/docente/UploadDocumentModal';
import { UploadConfirmModal } from '@/components/docente/UploadConfirmModal';
import { WelcomeModal } from '@/components/docente/WelcomeModal';
import { StatusRing } from '@/components/ui/StatusRing';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Upload,
  RefreshCw,
  Eye,
  Search,
  X,
  FileCheck2,
} from 'lucide-react';

const STORAGE_KEY = 'docente_checklist_state_magdalena';
const ONBOARDING_KEY = 'docente_onboarding_viewed_magdalena';

const STATUS_RING_COLORS: Record<DocumentStatus, string> = {
  aprobado: '#059669',
  en_revision: '#dba934',
  rechazado: '#dc2626',
  pendiente: '#cbd5e1',
};

export function DocenteChecklist() {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistDocumentItem[]>(INITIAL_DOCENTE_CHECKLIST);
  const [selectedFilter, setSelectedFilter] = useState<'todos' | DocumentStatus>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // Modals state
  const [uploadModalItem, setUploadModalItem] = useState<ChecklistDocumentItem | null>(null);
  const [confirmModalItem, setConfirmModalItem] = useState<ChecklistDocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ChecklistDocumentItem | null>(null);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEY);
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      }
      const hasViewedOnboarding = localStorage.getItem(ONBOARDING_KEY);
      if (!hasViewedOnboarding) {
        setWelcomeOpen(true);
        localStorage.setItem(ONBOARDING_KEY, 'true');
      }
    } catch (e) {
      console.error('Error loading checklist state:', e);
    }
  }, []);

  const saveItems = (updated: ChecklistDocumentItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving checklist state:', e);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Progress metrics
  const totalCount = items.length;
  const approvedCount = items.filter((i) => i.status === 'aprobado').length;
  const inReviewCount = items.filter((i) => i.status === 'en_revision').length;
  const rejectedCount = items.filter((i) => i.status === 'rechazado').length;
  const pendingCount = items.filter((i) => i.status === 'pendiente').length;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);

  const attentionItems = useMemo(
    () =>
      [...items]
        .filter((i) => i.status === 'rechazado' || i.status === 'en_revision')
        .sort((a, b) => (a.status === 'rechazado' ? -1 : 1))
        .slice(0, 5),
    [items]
  );

  const handleUploadSuccess = (
    item: ChecklistDocumentItem,
    fileInfo: { name: string; size: number; fileType?: string; dataUrl?: string }
  ) => {
    const updated = items.map((doc) => {
      if (doc.id === item.id) {
        return {
          ...doc,
          status: 'en_revision' as DocumentStatus,
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          fileType: fileInfo.fileType,
          dataUrl: fileInfo.dataUrl,
          uploadedAt: new Date().toISOString(),
          validatorComment: undefined,
        };
      }
      return doc;
    });

    saveItems(updated);
    const updatedDoc = updated.find((d) => d.id === item.id);
    if (updatedDoc) {
      setConfirmModalItem(updatedDoc);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesFilter = selectedFilter === 'todos' || item.status === selectedFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString() === searchTerm.trim() ||
      (item.shortDescription && item.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Estado documental / Observaciones */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado documental (ring chart) */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Estado Documental</span>
          </div>

          <StatusRing
            size={150}
            strokeWidth={16}
            segments={[
              { value: approvedCount, color: STATUS_RING_COLORS.aprobado, label: 'Aprobados' },
              { value: inReviewCount, color: STATUS_RING_COLORS.en_revision, label: 'En revisión' },
              { value: rejectedCount, color: STATUS_RING_COLORS.rechazado, label: 'Rechazados' },
              { value: pendingCount, color: STATUS_RING_COLORS.pendiente, label: 'Pendientes' },
            ]}
          >
            <span className="text-2xl font-bold text-neutral-900">{progressPercent}%</span>
            <span className="text-[10px] text-neutral-400 font-semibold">completado</span>
          </StatusRing>

          <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11px]">
            {(
              [
                ['aprobado', 'Aprobados', approvedCount],
                ['en_revision', 'En revisión', inReviewCount],
                ['rechazado', 'Rechazados', rejectedCount],
                ['pendiente', 'Pendientes', pendingCount],
              ] as [DocumentStatus, string, number][]
            ).map(([status, label, count]) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedFilter(status)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors ${
                  selectedFilter === status ? 'border-neutral-300 bg-neutral-50' : 'border-transparent hover:bg-neutral-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_RING_COLORS[status] }} />
                <span className="text-neutral-600 font-medium truncate">{label}</span>
                <span className="ml-auto font-bold text-neutral-800">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Observaciones / pendientes de atención */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Requieren tu atención</span>
            <span className="text-[11px] font-bold text-neutral-400">{attentionItems.length}</span>
          </div>

          {attentionItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <p className="text-xs text-neutral-500">Sin observaciones pendientes por ahora.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-72">
              {attentionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setUploadModalItem(item)}
                  className="w-full text-left p-2.5 rounded-xl border border-neutral-200 hover:border-brand-300 hover:bg-neutral-50 transition-colors flex items-center gap-2.5"
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.status === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.status === 'rechazado' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-800 truncate">#{item.id} {item.title}</div>
                    <div className="text-[10px] text-neutral-500 truncate">
                      {item.status === 'rechazado' ? 'Rechazado · corregir y resubir' : 'En revisión por el validador'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Nota general obligatoria */}
      <section className="bg-gradient-to-r from-brand-50 via-brand-50/60 to-gold-50 border border-brand-200/70 rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="space-y-3 w-full">
            <span className="text-xs font-bold text-brand-950 uppercase tracking-wider">
              Nota general obligatoria del proceso de posesión
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-800">
              <div className="bg-white/80 p-3.5 rounded-xl border border-brand-100 space-y-1">
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Diligenciamiento Digital</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Los documentos deben diligenciarse en su totalidad, preferiblemente en medio digital, sin tachones ni enmendaduras.
                </p>
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-brand-100 space-y-1">
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Carpeta Blanca de 4 Aletas</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Deben presentarse organizados y foliados en una <strong>carpeta blanca de cuatro aletas</strong> para el acto presencial.
                </p>
              </div>
              <div className="bg-white/80 p-3.5 rounded-xl border border-brand-100 space-y-1">
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-brand-100 text-brand-800 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Contacto con Rectoría</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Al aprobar los 23 documentos, comunícate directamente con el <strong>rector de la institución asignada</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Checklist completo */}
      <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-700" />
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Checklist Oficial de Posesión ({filteredItems.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-[11px]">
              {(['todos', 'pendiente', 'en_revision', 'aprobado', 'rechazado'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFilter(f)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                    selectedFilter === f
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Buscar por nombre o # ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-200 bg-white"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-neutral-400 hover:text-neutral-600 absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-neutral-200">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-neutral-300 mx-auto" />
              <p className="text-sm font-semibold text-neutral-700">
                No se encontraron documentos con los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter('todos');
                  setSearchTerm('');
                }}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                Limpiar filtros de búsqueda
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = !!expandedIds[item.id];
              const isRejected = item.status === 'rechazado';
              const isApproved = item.status === 'aprobado';
              const isInReview = item.status === 'en_revision';
              const isPending = item.status === 'pendiente';

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    isRejected ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <span className="w-8 h-8 rounded-lg border font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 bg-neutral-100 border-neutral-300 text-neutral-700">
                        {item.id}
                      </span>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 leading-snug">{item.title}</h3>

                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300 inline-flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                              Pendiente
                            </span>
                          )}
                          {isInReview && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En revisión
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aprobado
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              Rechazado
                            </span>
                          )}
                        </div>

                        {item.shortDescription && (
                          <p className="text-xs text-neutral-500">{item.shortDescription}</p>
                        )}

                        {item.fileName && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600 pt-0.5">
                            <span className="text-brand-700 font-medium truncate max-w-xs flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                              {item.fileName}
                            </span>
                            {item.fileSize && <span>• {(item.fileSize / 1024).toFixed(0)} KB</span>}
                            {item.uploadedAt && (
                              <span className="text-neutral-400">
                                • {new Date(item.uploadedAt).toLocaleDateString('es-CO')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center pl-11 lg:pl-0 flex-shrink-0">
                      {item.fileName && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(item)}
                          className="px-3 py-1.5 border border-neutral-300 hover:border-brand-400 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          title="Ver archivo radicado"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="hidden sm:inline">Ver soporte</span>
                        </button>
                      )}

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => setUploadModalItem(item)}
                          className="px-4 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir documento</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setUploadModalItem(item)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                            isRejected
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                              : 'border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-50'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Corregir y Resubir' : 'Resubir archivo'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Ocultar instrucciones' : 'Ver instrucciones'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isRejected && item.validatorComment && (
                    <div className="mt-3.5 ml-0 sm:ml-11 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-3.5 text-xs text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-950">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>Observación de corrección del validador:</span>
                      </div>
                      <p className="text-red-800 font-normal pl-5 leading-relaxed">“{item.validatorComment}”</p>
                      <div className="pl-5 pt-1 text-[11px] text-red-700 font-semibold flex items-center gap-1">
                        <span>Acción requerida:</span>
                        <span className="font-normal">
                          Reemplaza el archivo con el botón <strong>“Corregir y Resubir”</strong>.
                        </span>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-3.5 ml-0 sm:ml-11 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs space-y-2 animate-fadeIn">
                      <div>
                        <span className="font-bold text-neutral-800">Especificaciones técnicas: </span>
                        <span className="text-neutral-600 leading-relaxed">{item.instructions}</span>
                      </div>
                      {item.specialNote && (
                        <div className="p-2.5 rounded-lg bg-brand-50 border border-brand-200 text-brand-900 font-medium">
                          {item.specialNote}
                        </div>
                      )}
                      <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                        <span>Formato requerido: PDF o imagen escaneada legible (hasta 15 MB)</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modals */}
      <UploadDocumentModal
        item={uploadModalItem}
        isOpen={!!uploadModalItem}
        onClose={() => setUploadModalItem(null)}
        onUploadSuccess={handleUploadSuccess}
      />

      <UploadConfirmModal
        item={confirmModalItem}
        isOpen={!!confirmModalItem}
        onClose={() => setConfirmModalItem(null)}
      />

      <WelcomeModal isOpen={welcomeOpen} onClose={() => setWelcomeOpen(false)} />

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-700" />
                <h3 className="text-sm font-bold text-neutral-900 truncate">{previewDoc.fileName}</h3>
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
              {previewDoc.dataUrl && (previewDoc.fileType?.includes('image') || previewDoc.fileName?.match(/\.(png|jpg|jpeg)$/i)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.fileName}
                  className="max-h-72 mx-auto rounded-lg shadow-sm border border-neutral-300 object-contain"
                />
              ) : (
                <div className="py-4">
                  <FileCheck2 className="w-16 h-16 text-brand-600 mx-auto" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800">{previewDoc.title}</p>
                <p className="text-[11px] text-neutral-500">Archivo radicado: {previewDoc.fileName}</p>
                <p className="text-[11px] text-neutral-500">
                  Estado actual:{' '}
                  <span className="font-bold capitalize text-brand-700">{previewDoc.status.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {previewDoc.dataUrl ? (
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName}
                  className="text-xs font-semibold text-brand-700 hover:text-brand-900 underline"
                >
                  Descargar archivo radicado
                </a>
              ) : (
                <span className="text-[11px] text-neutral-400">Documento oficial registrado en sistema</span>
              )}
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold transition-colors"
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
