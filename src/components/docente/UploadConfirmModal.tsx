'use client';

import React from 'react';
import { ChecklistDocumentItem } from '@/types/docente-checklist';
import { CheckCircle2, Clock, FileCheck, ArrowRight } from 'lucide-react';

interface UploadConfirmModalProps {
  item: ChecklistDocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadConfirmModal({ item, isOpen, onClose }: UploadConfirmModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-5 border border-neutral-100">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-amber-50">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Estado: En Revisión</span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900">
            ¡Documento Radicado Exitosamente!
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            El archivo para el <strong>Ítem #{item.id}: {item.title}</strong> ha sido cargado y quedó en estado{' '}
            <strong className="text-amber-800 font-semibold">“En revisión”</strong>.
          </p>
        </div>

        <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200 text-xs text-left space-y-1.5">
          <div className="flex justify-between text-neutral-500">
            <span>Archivo:</span>
            <span className="font-semibold text-neutral-800 truncate max-w-[200px]">
              {item.fileName || 'archivo_cargado.pdf'}
            </span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Auditor asignado:</span>
            <span className="text-neutral-700">Talento Humano Magdalena</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500">
          Recibirás la notificación y actualización de estado en este mismo checklist una vez el equipo verifique el cumplimiento de los requisitos.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
        >
          <span>Continuar con el checklist</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
