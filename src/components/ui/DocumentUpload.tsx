'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileCheck, FileText, Trash2, Eye, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { UploadedDocument } from '@/types/auth';

interface DocumentUploadProps {
  value: UploadedDocument | null;
  onChange: (doc: UploadedDocument | null) => void;
  error?: string;
}

export function DocumentUpload({ value, onChange, error }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Solo se aceptan archivos PDF o imágenes (PNG, JPG).');
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo permitido de 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const uploadedDoc: UploadedDocument = {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      onChange(uploadedDoc);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to load a demo sample document
  const handleLoadSampleDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sampleDoc: UploadedDocument = {
      name: 'autorizacion_firmada_estudiante_2026.pdf',
      size: 842000,
      type: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
      uploadedAt: new Date().toISOString(),
    };
    onChange(sampleDoc);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
          <span>Documento de autorización firmado</span>
          <span className="text-red-500 font-bold">*</span>
          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide">
            Obligatorio
          </span>
        </label>
        {!value && (
          <button
            type="button"
            onClick={handleLoadSampleDocument}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium inline-flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Cargar documento de prueba
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={handleFileChange}
        className="hidden"
        id="signed-document-upload"
      />

      {!value ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
              : error
              ? 'border-red-400 bg-red-50/40 hover:bg-red-50/60'
              : 'border-neutral-300 hover:border-indigo-400 hover:bg-neutral-50/80 bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                error ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-800">
                <span className="text-indigo-600 font-semibold underline">Haz clic para adjuntar</span> o arrastra el archivo aquí
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                PDF, JPG o PNG firmado (máx. 10MB)
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Bloqueante: Si no adjuntas el documento firmado, el registro no se habilitará.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-emerald-300 bg-emerald-50/60 rounded-lg p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-neutral-900 truncate">
                  {value.name}
                </p>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Adjuntado
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                {formatFileSize(value.size)} • Listo para verificación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {value.dataUrl && (
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="p-1.5 text-neutral-600 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                title="Vista previa"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-white rounded-md transition-colors"
              title="Eliminar documento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 font-medium px-1 flex items-center gap-1 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Modal preview */}
      {previewOpen && value && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-neutral-800 truncate">
                  {value.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-center">
              {value.type.includes('image') && value.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value.dataUrl}
                  alt="Vista previa de documento"
                  className="max-h-72 mx-auto rounded border shadow-xs object-contain"
                />
              ) : (
                <div className="bg-neutral-100 rounded-lg p-8 flex flex-col items-center justify-center gap-3">
                  <FileText className="w-16 h-16 text-indigo-500 animate-pulse" />
                  <p className="text-xs text-neutral-600 font-medium">
                    Documento PDF firmado: <strong className="text-neutral-800">{value.name}</strong>
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Tamaño: {formatFileSize(value.size)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
