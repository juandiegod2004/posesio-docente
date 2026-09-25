'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, FileCheck, Calendar, MapPin, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';

export default function EstudianteDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-md">
              <User className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Mi Portal de Estudiante • No Pierdas el Viaje
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Información del beneficio, estado de tu viaje educativo y soporte de autorización firmado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-800">
                Estado de tu Beneficio de Viaje Educativo
              </h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                ✓ Autorizado y Activo
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Felicitaciones, has cumplido con todos los requisitos del programa de la Secretaría de Educación, incluyendo la presentación obligatoria del documento de autorización firmado por tu acudiente.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-800">Próxima Salida</div>
                  <div className="text-xs text-neutral-500 mt-0.5">18 de Octubre, 2026 • 07:00 AM</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-neutral-800">Destino Educativo</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Parque Nacional Natural Chingaza</div>
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-800">
              Recomendaciones para el Viaje
            </h2>
            <ul className="space-y-2.5 text-xs text-neutral-600 list-disc list-inside">
              <li>Llevar documento de identidad original (Tarjeta de Identidad o Cédula).</li>
              <li>El documento de autorización firmado ya está radicado digitalmente en el sistema.</li>
              <li>Presentarse puntualmente con el uniforme institucional en el punto de encuentro.</li>
              <li>Seguir las instrucciones del docente líder y coordinadores asignados.</li>
            </ul>
          </div>
        </div>

        {/* Sidebar: Document Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-neutral-800">
              Tu Documento Firmado
            </h2>
          </div>

          <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="text-xs font-semibold text-neutral-900 truncate">
              {user?.document?.name || 'autorizacion_acudiente_firmada.pdf'}
            </div>
            <div className="text-[11px] text-neutral-500">
              {user?.document?.size
                ? `${(user.document.size / 1024).toFixed(0)} KB`
                : '1.2 MB'}{' '}
              • Formato PDF
            </div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium bg-emerald-100/70 px-2 py-0.5 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verificado por Secretaría</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Descargando copia del documento de autorización firmado.')}
            className="w-full py-2 px-3 border border-neutral-300 hover:border-indigo-500 rounded-lg text-xs font-semibold text-neutral-700 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar constancia en PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
