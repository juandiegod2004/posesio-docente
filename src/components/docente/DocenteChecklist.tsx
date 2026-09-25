'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { ChecklistDocumentItem, DocumentStatus } from '@/types/docente-checklist';
import { INITIAL_DOCENTE_CHECKLIST } from '@/lib/constants/docente-documents';
import { UploadDocumentModal } from '@/components/docente/UploadDocumentModal';
import { UploadConfirmModal } from '@/components/docente/UploadConfirmModal';
import { WelcomeModal } from '@/components/docente/WelcomeModal';
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
  Filter,
  Info,
  ShieldCheck,
  Building,
  School,
  UserCheck,
  Phone,
  FileCheck2,
  X,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'docente_checklist_state_magdalena';
const ONBOARDING_KEY = 'docente_onboarding_viewed_magdalena';

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

  // Initialize from storage or show onboarding
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

  // Toggle item expansion for details/instructions
  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Progress metrics calculation
  const totalCount = items.length;
  const approvedCount = items.filter((i) => i.status === 'aprobado').length;
  const inReviewCount = items.filter((i) => i.status === 'en_revision').length;
  const rejectedCount = items.filter((i) => i.status === 'rechazado').length;
  const pendingCount = items.filter((i) => i.status === 'pendiente').length;
  const progressPercent = Math.round((approvedCount / totalCount) * 100);

  // Handle document upload / resubmit
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
          // When resubmitted, the old comment remains accessible in history or clears active rejection
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

  // Filtered documents
  const filteredItems = items.filter((item) => {
    const matchesFilter = selectedFilter === 'todos' || item.status === selectedFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString() === searchTerm.trim() ||
      (item.shortDescription && item.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* 1. Encabezado con datos del docente y barra de progreso */}
      <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Top Banner Gradient */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center p-2 flex-shrink-0 shadow-inner">
                <Image
                  src="/logo-secretaria-educacion.png"
                  alt="Secretaría de Educación del Magdalena"
                  width={56}
                  height={56}
                  className="object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secretaría de Educación Departamental del Magdalena</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {user ? `${user.firstName} ${user.lastName}` : 'Lic. Fernando Silva Pacheco'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100 font-medium">
                  <span className="font-mono">
                    C.C. 1.082.945.312 de Santa Marta
                  </span>
                  <span>•</span>
                  <span>Docente Aspirante al Nombramiento</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Validación Documental para Posesión
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={() => setWelcomeOpen(true)}
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <Info className="w-4 h-4 text-blue-200" />
                <span>¿Cómo funciona el proceso?</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar & Metric Counters */}
        <div className="p-6 sm:p-7 bg-white space-y-5">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                  Progreso Global de Validación Documental
                </h2>
                <span className="text-xs font-bold text-neutral-500 font-mono">
                  ({approvedCount} de {totalCount} aprobados)
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-900 tracking-tight font-mono">
                  {progressPercent}%
                </span>
                <span className="text-xs text-neutral-500 ml-1">completado</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3.5 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-600 rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Status Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSelectedFilter('aprobado')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFilter === 'aprobado'
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-200'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Aprobados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-900 mt-1 font-mono">
                {approvedCount}
              </div>
              <div className="text-[10px] text-emerald-700">Verificados por auditor</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('en_revision')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFilter === 'en_revision'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-200'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">En revisión</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-900 mt-1 font-mono">
                {inReviewCount}
              </div>
              <div className="text-[10px] text-amber-700">En proceso de cotejo</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('rechazado')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFilter === 'rechazado'
                  ? 'border-red-500 bg-red-50/80 shadow-xs ring-2 ring-red-200'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800">Rechazados</span>
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-xl font-extrabold text-red-900 mt-1 font-mono">
                {rejectedCount}
              </div>
              <div className="text-[10px] text-red-700 font-semibold">Requieren corrección</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFilter('pendiente')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedFilter === 'pendiente'
                  ? 'border-neutral-400 bg-neutral-100 shadow-xs ring-2 ring-neutral-200'
                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700">Pendientes</span>
                <Upload className="w-4 h-4 text-neutral-500" />
              </div>
              <div className="text-xl font-extrabold text-neutral-800 mt-1 font-mono">
                {pendingCount}
              </div>
              <div className="text-[10px] text-neutral-500">Sin archivo cargado</div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Banner o sección fija con la NOTA general del checklist */}
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-emerald-50 border border-blue-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                📌 NOTA GENERAL OBLIGATORIA DEL PROCESO DE VINCULACIÓN
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-800">
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">1</span>
                  <span>Diligenciamiento Digital</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Los documentos deben diligenciarse en su totalidad, preferiblemente en medio digital, sin tachones ni enmendaduras.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">2</span>
                  <span>Carpeta Blanca de 4 Aletas</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Deben presentarse organizados y debidamente <strong>foliados en una carpeta blanca de cuatro aletas</strong> para el acto presencial (informativo).
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 shadow-2xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">3</span>
                  <span>Contacto con Rectoría</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  Al finalizar la aprobación de los 23 documentos, deben comunicarse directamente con el <strong>rector de la institución asignada</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Barra de Control: Filtros y Búsqueda */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-500 font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter('todos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'todos'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('pendiente')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'pendiente'
                ? 'bg-neutral-700 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('en_revision')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'en_revision'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            En revisión ({inReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('aprobado')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'aprobado'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Aprobados ({approvedCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('rechazado')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              selectedFilter === 'rechazado'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Rechazados ({rejectedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nombre o número (#1 - #23)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-neutral-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-200 bg-white"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-neutral-400 hover:text-neutral-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* 4. Lista Principal de Documentos (Checklist 1 al 23) */}
      <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Checklist Oficial de Posesión Docente ({filteredItems.length} ítems listados)
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium">
            Secretaría de Educación del Magdalena
          </span>
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
                className="text-xs text-blue-600 font-semibold hover:underline"
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
                    isRejected
                      ? 'bg-red-50/30 hover:bg-red-50/50'
                      : isApproved
                      ? 'hover:bg-neutral-50/60'
                      : 'hover:bg-neutral-50/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Number, Title, Status */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Item Number Badge */}
                      <span className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-300 font-mono font-bold text-xs text-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {item.id}
                      </span>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                            {item.title}
                          </h3>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-300 inline-flex items-center gap-1 select-none">
                              <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                              Pendiente
                            </span>
                          )}

                          {isInReview && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1 select-none animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              En revisión
                            </span>
                          )}

                          {isApproved && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1 select-none">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aprobado
                            </span>
                          )}

                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 inline-flex items-center gap-1 select-none">
                              <AlertCircle className="w-3 h-3 text-red-600" />
                              Rechazado
                            </span>
                          )}
                        </div>

                        {item.shortDescription && (
                          <p className="text-xs text-neutral-500">
                            {item.shortDescription}
                          </p>
                        )}

                        {/* File details if uploaded */}
                        {item.fileName && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600 font-mono pt-0.5">
                            <span className="text-blue-700 font-medium truncate max-w-xs flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                              {item.fileName}
                            </span>
                            {item.fileSize && (
                              <span>• {(item.fileSize / 1024).toFixed(0)} KB</span>
                            )}
                            {item.uploadedAt && (
                              <span className="text-neutral-400">
                                • {new Date(item.uploadedAt).toLocaleDateString('es-CO')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons & Expand Toggle */}
                    <div className="flex items-center gap-2 self-start lg:self-center pl-11 lg:pl-0 flex-shrink-0">
                      {/* View File Button (if file uploaded) */}
                      {item.fileName && (
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(item)}
                          className="px-3 py-1.5 border border-neutral-300 hover:border-blue-400 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                          title="Ver archivo radicado"
                        >
                          <Eye className="w-3.5 h-3.5 text-neutral-500" />
                          <span className="hidden sm:inline">Ver soporte</span>
                        </button>
                      )}

                      {/* Upload / Resubmit Button */}
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => setUploadModalItem(item)}
                          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all inline-flex items-center gap-1.5"
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
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs animate-pulse'
                              : 'border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-50'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{isRejected ? 'Corregir y Resubir' : 'Resubir archivo'}</span>
                        </button>
                      )}

                      {/* Expand / Collapse Details Button */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Ocultar instrucciones' : 'Ver instrucciones'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* REQUISITO CLAVE: Si está Rechazado, mostrar el comentario del validador VISIBLE junto al ítem */}
                  {isRejected && item.validatorComment && (
                    <div className="mt-3.5 ml-0 sm:ml-11 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-3.5 text-xs text-red-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-red-950">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>Observación de corrección del validador:</span>
                      </div>
                      <p className="text-red-800 font-normal pl-5 leading-relaxed">
                        “{item.validatorComment}”
                      </p>
                      <div className="pl-5 pt-1 text-[11px] text-red-700 font-semibold flex items-center gap-1">
                        <span>Acción requerida:</span>
                        <span className="font-normal">
                          Por favor reemplaza el archivo haciendo clic en el botón <strong>“Corregir y Resubir”</strong>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Expanded Instructions / Special Notes */}
                  {isExpanded && (
                    <div className="mt-3.5 ml-0 sm:ml-11 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs space-y-2 animate-fadeIn">
                      <div>
                        <span className="font-bold text-neutral-800">Especificaciones técnicas: </span>
                        <span className="text-neutral-600 leading-relaxed">{item.instructions}</span>
                      </div>

                      {item.specialNote && (
                        <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 font-medium">
                          {item.specialNote}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                        <span>Formato requerido: PDF o imagen escaneada legible (hasta 15 MB)</span>
                        <span>Sección: {item.category?.replace('_', ' ').toUpperCase()}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Upload/Resubmit Modal */}
      <UploadDocumentModal
        item={uploadModalItem}
        isOpen={!!uploadModalItem}
        onClose={() => setUploadModalItem(null)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Upload Confirmation Modal */}
      <UploadConfirmModal
        item={confirmModalItem}
        isOpen={!!confirmModalItem}
        onClose={() => setConfirmModalItem(null)}
      />

      {/* Onboarding Welcome Modal */}
      <WelcomeModal
        isOpen={welcomeOpen}
        onClose={() => setWelcomeOpen(false)}
      />

      {/* View / Preview Document Modal */}
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
              {previewDoc.dataUrl && (previewDoc.fileType?.includes('image') || previewDoc.fileName?.match(/\.(png|jpg|jpeg)$/i)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.fileName}
                  className="max-h-72 mx-auto rounded-lg shadow-sm border border-neutral-300 object-contain"
                />
              ) : (
                <div className="py-4">
                  <FileCheck2 className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-800">
                  {previewDoc.title}
                </p>
                <p className="text-[11px] text-neutral-500 font-mono">
                  Archivo radicado: {previewDoc.fileName}
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
              {previewDoc.dataUrl ? (
                <a
                  href={previewDoc.dataUrl}
                  download={previewDoc.fileName}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-1"
                >
                  Descargar archivo radicado
                </a>
              ) : (
                <span className="text-[11px] text-neutral-400">
                  Documento oficial registrado en sistema
                </span>
              )}
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
