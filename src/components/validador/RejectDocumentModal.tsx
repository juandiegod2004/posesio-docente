'use client';

import React, { useState } from 'react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { AlertCircle, FileText, User, X, XCircle, Loader2 } from 'lucide-react';

/** Lo mínimo que este modal necesita mostrar; no depende de dónde vino el documento. */
export interface RejectableDocument {
  docente: { nombres: string; apellidos: string; cedula: string };
  tipoDocumento: { orden: number; nombre: string };
  archivoNombre: string;
}

interface RejectDocumentModalProps {
  doc: RejectableDocument | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (comentario: string) => void;
}

export function RejectDocumentModal({
  doc,
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: RejectDocumentModalProps) {
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState<string | null>(null);

  useLockBodyScroll(isOpen && !!doc);
  if (!isOpen || !doc) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setComentario('');
    setError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!comentario.trim()) {
      setError('Debes indicar el motivo del rechazo para que el docente pueda corregirlo.');
      return;
    }
    setError(null);
    onConfirm(comentario.trim());
    setComentario('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                Rechazar documento
              </h3>
              <p className="text-xs text-neutral-500">
                El docente verá tu comentario y podrá resubir el archivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info table */}
        <div className="rounded-xl border border-neutral-200 overflow-hidden">
          <div className="divide-y divide-neutral-100 text-xs">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-50">
              <User className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-500 font-semibold w-20 flex-shrink-0">Docente</span>
              <span className="text-neutral-900 font-semibold truncate">
                {doc.docente.nombres} {doc.docente.apellidos}{' '}
                <span className="text-neutral-400 font-normal">· C.C. {doc.docente.cedula}</span>
              </span>
            </div>
            <div className="flex items-start gap-2.5 px-4 py-3">
              <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-500 font-semibold w-20 flex-shrink-0">Documento</span>
              <span className="text-neutral-800">
                <span className="text-brand-700 font-bold">#{doc.tipoDocumento.orden}</span>{' '}
                {doc.tipoDocumento.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-50">
              <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-500 font-semibold w-20 flex-shrink-0">Archivo</span>
              <span className="text-brand-700 font-medium truncate">{doc.archivoNombre}</span>
            </div>
          </div>
        </div>

        {/* Comment field */}
        <div className="space-y-1.5">
          <label htmlFor="comentario-rechazo" className="text-xs font-bold text-neutral-800">
            Motivo del rechazo <span className="text-red-600">*</span>
          </label>
          <textarea
            id="comentario-rechazo"
            value={comentario}
            onChange={(e) => {
              setComentario(e.target.value);
              if (error) setError(null);
            }}
            rows={4}
            maxLength={500}
            autoFocus
            placeholder="Ej: El certificado no incluye la fecha de expedición vigente. Por favor sube un soporte actualizado."
            className={`w-full rounded-xl border p-3 text-xs text-neutral-800 resize-none focus:outline-none transition-colors ${
              error
                ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                : 'border-neutral-300 focus:border-brand-600'
            }`}
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-neutral-400">{comentario.length}/500</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rechazando...</span>
              </>
            ) : (
              <span>Confirmar rechazo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
