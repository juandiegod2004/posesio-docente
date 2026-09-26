'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, Users, Database, Activity, UserPlus, Key } from 'lucide-react';
import { DEMO_ACCOUNTS, ROLES } from '@/lib/constants/roles';

export default function AdminDashboardPage() {
  const { role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-100 text-brand-800 rounded-md">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Administración General del Proceso de Posesión
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Gestión de funcionarios, asignación de roles y trazabilidad del sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Función de registro manual de funcionario habilitada en modo demostración.')}
          className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar nuevo funcionario</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Docentes en proceso</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">1,248</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">↑ +14% este mes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Documentos validados</span>
            <Database className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">28,199</div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">de 23 ítems x docente</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Roles activos</span>
            <Key className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mt-2">{Object.keys(ROLES).length} roles</div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">Control de acceso por rutas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Estado de la plataforma</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">Operativa</div>
          <div className="text-[11px] text-neutral-500 font-medium mt-1">Sin incidentes reportados</div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">
            Usuarios Institucionales y Cuentas Preconfiguradas
          </h2>
          <span className="text-xs bg-brand-50 text-brand-800 px-2.5 py-1 rounded-full font-semibold border border-brand-200 capitalize">
            Rol actual: {role?.replace('_', ' ')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
              <tr>
                <th className="py-3 px-6 font-semibold">Nombre y Apellido</th>
                <th className="py-3 px-6 font-semibold">Correo Institucional</th>
                <th className="py-3 px-6 font-semibold">Teléfono</th>
                <th className="py-3 px-6 font-semibold">Rol Asignado</th>
                <th className="py-3 px-6 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {DEMO_ACCOUNTS.map((acc) => (
                <tr key={acc.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-neutral-900">
                    {acc.firstName} {acc.lastName}
                  </td>
                  <td className="py-3.5 px-6 text-neutral-600">
                    {acc.email}
                  </td>
                  <td className="py-3.5 px-6 text-neutral-600">
                    {acc.phoneNumber}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border">
                      {ROLES[acc.role].label}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => alert(`Editando permisos de ${acc.email}`)}
                      className="text-brand-600 hover:text-brand-900 font-semibold"
                    >
                      Editar
                    </button>
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
