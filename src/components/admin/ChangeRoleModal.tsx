'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, cambiarRolUsuario } from '@/lib/api';
import { ROLES } from '@/lib/constants/roles';
import { ASSIGNABLE_ROLES } from '@/components/admin/CreateStaffModal';
import { AlertCircle, Key, Loader2, X } from 'lucide-react';

export interface ChangeRoleTarget {
  usuarioId: string;
  nombre: string;
  rolActual: (typeof ASSIGNABLE_ROLES)[number];
}

interface ChangeRoleModalProps {
  target: ChangeRoleTarget | null;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Acción del Super Usuario: cambia el rol de una cuenta de personal interno ya creada
 * (PATCH /api/usuarios/:id/rol — 400 si es su propia cuenta o si el id es un Docente, ninguno
 * de los dos casos puede llegar hasta acá porque esta tabla solo lista staff y ya oculta la
 * fila del propio usuario autenticado).
 */
export function ChangeRoleModal({ target, onClose, onChanged }: ChangeRoleModalProps) {
  const { getAccessToken } = useAuth();
  const [rol, setRol] = useState<(typeof ASSIGNABLE_ROLES)[number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockBodyScroll(target !== null);
  if (!target) return null;

  const rolSeleccionado = rol ?? target.rolActual;

  const handleClose = () => {
    if (isSubmitting) return;
    setRol(null);
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (rolSeleccionado === target.rolActual) {
      setError('Selecciona un rol distinto al actual.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      await cambiarRolUsuario(token, target.usuarioId, rolSeleccionado);
      setRol(null);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar el rol. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-brand-100 text-brand-700 rounded-xl flex-shrink-0">
              <Key className="w-5 h-5" />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">Cambiar rol</h3>
              <p className="text-xs text-neutral-500">{target.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="w-full">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Nuevo rol</label>
            <select
              value={rolSeleccionado}
              onChange={(e) => setRol(e.target.value as (typeof ASSIGNABLE_ROLES)[number])}
              className="w-full h-12 px-4 rounded-md border border-neutral-400 text-sm text-neutral-800 bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-200"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLES[r].label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-neutral-500">
              Rol actual: <strong>{ROLES[target.rolActual].label}</strong>
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || rolSeleccionado === target.rolActual}
              className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cambiando...</span>
                </>
              ) : (
                <span>Confirmar cambio</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
