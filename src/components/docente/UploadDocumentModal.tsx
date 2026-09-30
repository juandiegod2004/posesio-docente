'use client';

import React, { useState, useRef } from 'react';
import { ChecklistDocumentItem } from '@/types/docente-checklist';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { TOTAL_CHECKLIST_ITEMS } from '@/lib/constants/docente-documents';
import { ApiError, subirDocumento } from '@/lib/api';
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

interface UploadDocumentModalProps {
  item: ChecklistDocumentItem | null;
  docenteId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (item: ChecklistDocumentItem, fileInfo: { name: string; size: number }) => void;
}

export function UploadDocumentModal({
  item,
  docenteId,
  isOpen,
  onClose,
  onUploadSuccess,
}: UploadDocumentModalProps) {
  const { getAccessToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLockBodyScroll(isOpen && !!item);
  if (!isOpen || !item) return null;

  const isResubmission =
    item.status === 'rechazado' ||
    item.status === 'en_revision' ||
    item.status === 'aprobado';

  const handleFileProcess = (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Formato no válido. Solo se admiten archivos PDF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 2 MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // Sin esto, el <input> nativo conserva el archivo seleccionado y no dispara
    // 'change' si el usuario vuelve a elegir el mismo archivo justo después.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona o arrastra un archivo antes de continuar.');
      return;
    }
    if (!docenteId || !item.tipoDocumentoId) {
      setError('No se pudo identificar el documento. Recarga la página e intenta de nuevo.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await subirDocumento(await getAccessToken() || '', {
        docenteId,
        tipoDocumentoId: item.tipoDocumentoId,
        file: selectedFile,
        fileName: selectedFile.name,
      });

      onUploadSuccess(item, { name: selectedFile.name, size: selectedFile.size });
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el documento. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
              Ítem #{item.id} de {TOTAL_CHECKLIST_ITEMS}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              {isResubmission ? 'Resubir soporte documental' : 'Subir documento de posesión'}
            </h3>
            <p className="text-xs text-neutral-600 font-medium">{item.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Rejected: Show Prior Validator Comment prominently */}
        {item.status === 'rechazado' && item.validatorComment && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{item.archivoEliminado ? 'Aviso del sistema:' : 'Motivo de rechazo por el validador:'}</span>
            </div>
            <p className="text-red-800 leading-relaxed pl-5 font-normal">
              “{item.validatorComment}”
            </p>
            <p className="text-[11px] text-red-700 pl-5 pt-0.5 font-semibold">
              ↳ Asegúrate de que el nuevo archivo corrija esta observación antes de enviar.
            </p>
          </div>
        )}

        {/* Instructions and Note */}
        <div className="bg-neutral-50 rounded-xl p-3.5 space-y-2 text-xs text-neutral-700 border border-neutral-200/80">
          <div>
            <span className="font-semibold text-neutral-900">Instrucciones técnicas: </span>
            <span className="text-neutral-600">{item.instructions}</span>
          </div>
          {item.specialNote && (
            <div className="text-[11px] text-brand-900 bg-brand-50/80 p-2 rounded-md border border-brand-200">
              {item.specialNote}
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Drag and Drop Zone */}
        {!selectedFile ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-600 bg-brand-50/70 scale-[1.01]'
                : error
                ? 'border-red-400 bg-red-50/40'
                : 'border-neutral-300 hover:border-brand-500 hover:bg-neutral-50 bg-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-800">
                  <span className="text-brand-600 underline font-bold">Selecciona un archivo</span> o arrástralo aquí
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Solo se admiten archivos PDF (hasta 2 MB)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-brand-200 bg-brand-50/50 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {(selectedFile.size / 1024).toFixed(0)} KB • Listo para enviar a revisión
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md transition-colors"
              title="Cambiar archivo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-end text-xs">
          <span className="text-[11px] text-neutral-400">UN solo archivo por ítem</span>
        </div>

        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </p>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando a revisión...</span>
              </>
            ) : (
              <span>Confirmar y enviar documento</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
