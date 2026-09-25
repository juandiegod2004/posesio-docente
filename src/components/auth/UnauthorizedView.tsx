'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ShieldX, ArrowLeft, RefreshCw, LogOut } from 'lucide-react';
import { UserRole } from '@/types/auth';

export function UnauthorizedView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, switchRole, logout } = useAuth();

  const requiredRole = searchParams.get('required') || 'administrador';
  const currentRole = user?.role || searchParams.get('current') || 'sin autenticar';

  const handleRoleElevate = (role: UserRole) => {
    switchRole(role);
    router.push(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldX className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">
            Acceso No Autorizado (403)
          </h1>
          <p className="text-sm text-neutral-600">
            No tienes los permisos requeridos para ingresar a esta ruta protegida.
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Tu rol actual:</span>
            <span className="font-semibold capitalize px-2 py-0.5 rounded bg-neutral-200 text-neutral-800">
              {currentRole}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Rol requerido:</span>
            <span className="font-semibold capitalize px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
              {requiredRole}
            </span>
          </div>
        </div>

        {/* Development testing quick switcher */}
        <div className="pt-2 border-t border-neutral-100 space-y-2 text-left">
          <p className="text-xs font-semibold text-neutral-700">
            ¿Probando el sistema? Cambia de rol para acceder:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['administrador', 'coordinador', 'docente', 'estudiante'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleElevate(r)}
                className={`text-xs py-1.5 px-2.5 rounded-md border text-center font-medium transition-all ${
                  r === requiredRole
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                Cambiar a {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a mi panel permitido</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
