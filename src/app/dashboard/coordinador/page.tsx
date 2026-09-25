'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileCheck, CheckCircle2, XCircle, Eye, Download, Search, Filter } from 'lucide-react';

interface VerificationDoc {
  id: string;
  studentName: string;
  institution: string;
  fileName: string;
  date: string;
  status: 'aprobado' | 'pendiente' | 'rechazado';
}

const INITIAL_DOCS: VerificationDoc[] = [
  {
    id: 'doc-1',
    studentName: 'John Doe',
    institution: 'Colegio Mayor de San Bartolomé',
    fileName: 'autorizacion_acudiente_firmada.pdf',
    date: '2026-03-12',
    status: 'aprobado',
  },
  {
    id: 'doc-2',
    studentName: 'María Camila Rodríguez',
    institution: 'Instituto Pedagógico Nacional',
    fileName: 'documento_autorizacion_firmado_padres.pdf',
    date: '2026-03-14',
    status: 'pendiente',
  },
  {
    id: 'doc-3',
    studentName: 'Santiago Vargas Ospina',
    institution: 'Colegio Técnico Central',
    fileName: 'soporte_viaje_secretaria_firmado.png',
    date: '2026-03-15',
    status: 'pendiente',
  },
  {
    id: 'doc-4',
    studentName: 'Valentina Martínez Peña',
    institution: 'Colegio Santander',
    fileName: 'autorizacion_sin_firma_error.pdf',
    date: '2026-03-16',
    status: 'rechazado',
  },
];

export default function CoordinadorDashboardPage() {
  const { role } = useAuth();
  const [docs, setDocs] = useState<VerificationDoc[]>(INITIAL_DOCS);
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');

  const handleApprove = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'aprobado' } : d))
    );
  };

  const handleReject = (id: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'rechazado' } : d))
    );
  };

  const filteredDocs =
    filter === 'todos' ? docs : docs.filter((d) => d.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Módulo de Coordinación y Verificación de Documentos
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Revisión y aprobación de los documentos de autorización firmados por acudientes y rectores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Filtrar por:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-600"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Solo Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">
            Bandeja de Autorizaciones del Programa No Pierdas el Viaje
          </h2>
          <span className="text-xs text-neutral-500">
            Total en lista: {filteredDocs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold">Estudiante</th>
                <th className="py-3 px-6 font-semibold">Institución Educativa</th>
                <th className="py-3 px-6 font-semibold">Archivo Firmado</th>
                <th className="py-3 px-6 font-semibold">Fecha de Carga</th>
                <th className="py-3 px-6 font-semibold">Estado</th>
                <th className="py-3 px-6 font-semibold text-right">Acciones de Verificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-neutral-900">
                    {doc.studentName}
                  </td>
                  <td className="py-3.5 px-6 text-neutral-600">
                    {doc.institution}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-indigo-600">
                    {doc.fileName}
                  </td>
                  <td className="py-3.5 px-6 text-neutral-500">
                    {doc.date}
                  </td>
                  <td className="py-3.5 px-6">
                    {doc.status === 'aprobado' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Aprobado
                      </span>
                    )}
                    {doc.status === 'pendiente' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Por verificar
                      </span>
                    )}
                    {doc.status === 'rechazado' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Rechazado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => alert(`Visualizando documento: ${doc.fileName}`)}
                      className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-neutral-100 rounded"
                      title="Ver documento firmado"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    {doc.status !== 'aprobado' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(doc.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        Aprobar
                      </button>
                    )}
                    {doc.status !== 'rechazado' && (
                      <button
                        type="button"
                        onClick={() => handleReject(doc.id)}
                        className="px-2.5 py-1 bg-neutral-200 hover:bg-red-100 text-neutral-700 hover:text-red-700 rounded text-[11px] font-semibold transition-colors"
                      >
                        Rechazar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
