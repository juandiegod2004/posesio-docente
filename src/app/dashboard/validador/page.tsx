'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileCheck, CheckCircle2, Eye, Search } from 'lucide-react';

interface PendingSubmission {
  id: string;
  docenteName: string;
  documentNumber: string;
  itemNumber: number;
  itemTitle: string;
  fileName: string;
  date: string;
  status: 'aprobado' | 'pendiente' | 'rechazado';
}

const INITIAL_SUBMISSIONS: PendingSubmission[] = [
  {
    id: 'sub-1',
    docenteName: 'Fernando Silva Pacheco',
    documentNumber: '1.082.945.312',
    itemNumber: 4,
    itemTitle: 'Formulario de afiliación a CAJAMAG',
    fileName: 'formulario_cajamag_v2025.pdf',
    date: '2026-03-12',
    status: 'rechazado',
  },
  {
    id: 'sub-2',
    docenteName: 'María Camila Rodríguez',
    documentNumber: '1.075.221.884',
    itemNumber: 12,
    itemTitle: 'Experiencia laboral certificada',
    fileName: 'certificados_experiencia_laboral.pdf',
    date: '2026-03-14',
    status: 'pendiente',
  },
  {
    id: 'sub-3',
    docenteName: 'Santiago Vargas Ospina',
    documentNumber: '1.090.556.219',
    itemNumber: 17,
    itemTitle: 'Fotocopia de la cédula al 150%',
    fileName: 'cedula_150_ampliada.pdf',
    date: '2026-03-15',
    status: 'pendiente',
  },
  {
    id: 'sub-4',
    docenteName: 'Valentina Martínez Peña',
    documentNumber: '1.065.778.903',
    itemNumber: 22,
    itemTitle: 'Examen médico ocupacional de ingreso',
    fileName: 'examen_medico_ocupacional.pdf',
    date: '2026-03-16',
    status: 'aprobado',
  },
];

export default function ValidadorDashboardPage() {
  const { role } = useAuth();
  const [subs, setSubs] = useState<PendingSubmission[]>(INITIAL_SUBMISSIONS);
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');
  const [search, setSearch] = useState('');

  const handleApprove = (id: string) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'aprobado' } : s)));
  };

  const handleReject = (id: string) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'rechazado' } : s)));
  };

  const filteredSubs = subs
    .filter((s) => filter === 'todos' || s.status === filter)
    .filter(
      (s) =>
        s.docenteName.toLowerCase().includes(search.toLowerCase()) ||
        s.itemTitle.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
              <FileCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Bandeja de Validación Documental
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Revisa, aprueba o rechaza con comentario los soportes radicados por los docentes para su posesión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar docente o documento..."
              className="pl-7 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs bg-white focus:outline-none focus:border-brand-600"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-neutral-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:border-brand-600"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Solo pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">
            Documentos del Checklist de Posesión Docente (23 ítems)
          </h2>
          <span className="text-xs text-neutral-500">
            Total en lista: {filteredSubs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold">Docente</th>
                <th className="py-3 px-6 font-semibold">Cédula</th>
                <th className="py-3 px-6 font-semibold">Ítem del checklist</th>
                <th className="py-3 px-6 font-semibold">Archivo radicado</th>
                <th className="py-3 px-6 font-semibold">Fecha</th>
                <th className="py-3 px-6 font-semibold">Estado</th>
                <th className="py-3 px-6 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredSubs.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-neutral-900">{s.docenteName}</td>
                  <td className="py-3.5 px-6 text-neutral-600">{s.documentNumber}</td>
                  <td className="py-3.5 px-6 text-neutral-700">
                    <span className="text-brand-700 font-bold">#{s.itemNumber}</span>{' '}
                    {s.itemTitle}
                  </td>
                  <td className="py-3.5 px-6 text-brand-600 truncate max-w-[180px]">
                    {s.fileName}
                  </td>
                  <td className="py-3.5 px-6 text-neutral-500">{s.date}</td>
                  <td className="py-3.5 px-6">
                    {s.status === 'aprobado' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Aprobado
                      </span>
                    )}
                    {s.status === 'pendiente' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Por verificar
                      </span>
                    )}
                    {s.status === 'rechazado' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Rechazado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => alert(`Visualizando documento: ${s.fileName}`)}
                      className="p-1.5 text-neutral-500 hover:text-brand-700 hover:bg-neutral-100 rounded"
                      title="Ver documento radicado"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    {s.status !== 'aprobado' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(s.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                      >
                        Aprobar
                      </button>
                    )}
                    {s.status !== 'rechazado' && (
                      <button
                        type="button"
                        onClick={() => {
                          const comment = window.prompt('Comentario de rechazo para el docente:');
                          if (comment !== null) handleReject(s.id);
                        }}
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

      <div className="bg-brand-50 border border-brand-200/80 rounded-xl p-4 text-xs text-brand-900 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
        <span>
          Tu rol actual es <strong className="capitalize">{role?.replace('_', ' ')}</strong>. Toda aprobación o
          rechazo queda registrado con usuario y fecha para trazabilidad ante la Secretaría.
        </span>
      </div>
    </div>
  );
}
