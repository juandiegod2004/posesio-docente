'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, subirDocumento } from '@/lib/api';
import { AlertCircle, Clock, FileWarning, Loader2, Upload, FileText, Trash2 } from 'lucide-react';

/**
 * Los 3 estados son mutuamente excluyentes mientras `registroCompletado` sea false:
 * - 'pendiente_subir': nunca la subió (registro incompleto).
 * - 'en_revision': ya la subió, pero un validador todavía no la aprueba ni la rechaza.
 * - 'rechazado': un validador la rechazó, debe corregir y resubir.
 */
type AuthorizationGateEstado = 'pendiente_subir' | 'en_revision' | 'rechazado';

interface AuthorizationGateModalProps {
  docenteId: string;
  tipoDocumentoId: string;
  estado: AuthorizationGateEstado;
  /** Motivo del rechazo del validador. Solo aplica (y puede venir null) cuando estado === 'rechazado'. */
  comentarioRechazo: string | null;
}

/**
 * Modal bloqueante: cubre todo el dashboard del docente mientras la autorización de
 * notificación electrónica (requisito de registro) no esté subida Y aprobada por un
 * validador. Sin este documento aprobado el docente no puede usar el resto del checklist,
 * así que no tiene botón de cierre ni se puede saltar en ninguno de los 3 estados.
 */
export function AuthorizationGateModal({
  docenteId,
  tipoDocumentoId,
  estado,
  comentarioRechazo,
}: AuthorizationGateModalProps) {
  const { getAccessToken, refreshUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRechazo = estado === 'rechazado';

  useLockBodyScroll(true);

  // Estado puramente informativo: ya se subió, un validador debe aprobarla o rechazarla.
  // No hay ninguna acción que el docente pueda tomar, así que no se renderiza la zona de
  // carga de archivo ni ningún botón de envío.
  if (estado === 'en_revision') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
          <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
              <Clock className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                Tu autorización está en revisión
              </h3>
              <p className="text-xs text-neutral-600">
                Ya subiste tu autorización de notificación electrónica. Un validador debe aprobarla antes de que
                puedas continuar con el resto de tu checklist.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Loader2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 animate-spin" />
            <p className="text-xs text-amber-900 leading-relaxed">
              No necesitas hacer nada más por ahora. Te notificaremos apenas un validador revise tu documento — si
              lo rechaza, podrás corregirlo y volver a subirlo aquí mismo.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      setError(
        isRechazo
          ? 'Por favor selecciona o arrastra el documento corregido antes de continuar.'
          : 'Por favor selecciona o arrastra tu autorización firmada antes de continuar.'
      );
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      await subirDocumento(token, {
        docenteId,
        tipoDocumentoId,
        file: selectedFile,
        fileName: selectedFile.name,
      });
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el documento. Intenta de nuevo.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
          <span className={`p-2 rounded-xl flex-shrink-0 ${isRechazo ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            <FileWarning className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              {isRechazo
                ? 'Tu autorización de notificación electrónica fue rechazada'
                : 'Completa tu registro para continuar'}
            </h3>
            <p className="text-xs text-neutral-600">
              {isRechazo
                ? 'Debes resubir este documento corregido para continuar usando tu cuenta.'
                : 'Debes subir tu autorización de notificación electrónica firmada vía Ciudadano Digital para habilitar el resto de tu checklist.'}
            </p>
          </div>
        </div>

        {comentarioRechazo && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-3.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Motivo de rechazo por el validador:</span>
            </div>
            <p className="text-red-800 leading-relaxed pl-5 font-normal">“{comentarioRechazo}”</p>
          </div>
        )}

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
                  <span className="text-brand-600 underline font-bold">
                    {isRechazo ? 'Selecciona el archivo corregido' : 'Selecciona tu autorización firmada'}
                  </span>{' '}
                  o arrástralo aquí
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
                <p className="text-xs font-bold text-neutral-900 truncate">{selectedFile.name}</p>
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

        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </p>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-neutral-100">
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
              <span>{isRechazo ? 'Enviar documento corregido' : 'Enviar documento'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
