'use client';

import React from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

interface DocumentViewerModalProps {
  /** URL firmada del PDF a mostrar. null mientras se está cargando, undefined = modal cerrado. */
  url: string | null | undefined;
  fileName?: string;
  error?: string | null;
  onClose: () => void;
}

/** Visor de PDF embebido en la misma página: evita depender de pestañas nuevas para "Ver soporte". */
export function DocumentViewerModal({ url, fileName, error, onClose }: DocumentViewerModalProps) {
  useLockBodyScroll(url !== undefined);
  if (url === undefined) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-200 flex-shrink-0">
          <h3 className="text-sm font-bold text-neutral-800 truncate">{fileName || 'Documento'}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 bg-neutral-100">
          {error ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          ) : url === null ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : (
            <iframe src={url} title={fileName || 'Documento'} className="w-full h-full border-0" />
          )}
        </div>
      </div>
    </div>
  );
}
