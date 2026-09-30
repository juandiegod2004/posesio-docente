'use client';

import React from 'react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Building,
  HelpCircle,
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-neutral-100 relative my-8">
        {/* Top Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-900 mb-1">
              <span>Secretaría de Educación del Magdalena</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              ¡Bienvenido al Proceso de Validación Documental para Nombramiento y Posesión!
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Como docente seleccionado, aquí podrás gestionar y subir digitalmente los <strong>{TOTAL_CHECKLIST_ITEMS} documentos oficiales</strong> requeridos para tu vinculación formal.
            </p>
          </div>
        </div>

        {/* 3 Step Visual Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Carga Digital</h3>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Adjunta cada documento en formato PDF o imagen legible haciendo clic en <strong>“Subir documento”</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Auditoría y Estados</h3>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              El equipo de Talento Humano revisará cada soporte. Si hay observaciones, verás el motivo y podrás <strong>resubirlo</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Posesión Formal</h3>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              Al alcanzar el 100% de aprobación, te comunicarás con el <strong>Rector de la institución</strong> para firmar el acta.
            </p>
          </div>
        </div>

        {/* Status Meaning Legend */}
        <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
          <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Convención de Estados:
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-neutral-200">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>
              <span className="font-semibold text-neutral-700">Pendiente:</span>
              <span className="text-neutral-500">Por subir</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-amber-900">En revisión:</span>
              <span className="text-amber-700">Auditando</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-emerald-900">Aprobado:</span>
              <span className="text-emerald-700">Válido</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-white border border-red-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="font-semibold text-red-900">Rechazado:</span>
              <span className="text-red-700">Corregir</span>
            </div>
          </div>
        </div>

        {/* Physical Folder Advisory */}
        <div className="bg-brand-50 border border-brand-200/90 rounded-xl p-3.5 flex items-start gap-3 text-xs text-brand-900">
          <FolderOpen className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Recordatorio de archivo físico:</span> Todos los documentos deben diligenciarse preferiblemente en medio digital, pero para el acto de posesión presencial deben presentarse <strong>organizados y foliados en una carpeta blanca de cuatro aletas</strong>.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            <span>Entendido, comenzar a revisar mi checklist</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
