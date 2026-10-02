'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, subirDocumento } from '@/lib/api';
import { Upload, FileText, AlertCircle, X, Loader2, Trash2 } from 'lucide-react';

export interface StaffUploadTarget {
  docenteId: string;
  tipoDocumentoId: string;
  nombre: string;
}

interface StaffUploadDocumentModalProps {
  target: StaffUploadTarget | null;
  onClose: () => void;
  onUploadSuccess: () => void;
}

/**
 * Subida de un documento que NO sube el docente (examen médico ocupacional → Talento Humano,
 * acta de posesión → Gestor Documental). A diferencia de `UploadDocumentModal` (del propio
 * docente), no depende de `ChecklistDocumentItem` — solo necesita el id del tipo de documento
 * y el nombre a mostrar, ambos ya disponibles en el `ChecklistItemBackend` del validador.
 */
export function StaffUploadDocumentModal({ target, onClose, onUploadSuccess }: StaffUploadDocumentModalProps) {
  const { getAccessToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useLockBodyScroll(target !== null);
  if (!target) return null;

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    onClose();
  };

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
    setError(null);
    setIsUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      await subirDocumento(token, {
        docenteId: target.docenteId,
        tipoDocumentoId: target.tipoDocumentoId,
        file: selectedFile,
        fileName: selectedFile.name,
      });
      setSelectedFile(null);
      onUploadSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el documento. Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">Subir documento</h3>
            <p className="text-xs text-neutral-600 font-medium">{target.nombre}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                <p className="text-[11px] text-neutral-500 mt-0.5">Solo se admiten archivos PDF (hasta 2 MB)</p>
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
                <p className="text-xs font-bold text-neutral-900 truncate">{selectedFile.name}</p>
                <p className="text-[11px] text-neutral-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
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

        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={handleClose}
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
                <span>Subiendo...</span>
              </>
            ) : (
              <span>Confirmar y subir</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
