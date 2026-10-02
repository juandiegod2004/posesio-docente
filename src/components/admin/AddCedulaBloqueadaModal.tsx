'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, agregarCedulaBloqueada } from '@/lib/api';
import { filtrarSoloDigitos } from '@/lib/validations/auth';
import { AlertCircle, Ban, Loader2, X } from 'lucide-react';

interface AddCedulaBloqueadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

/**
 * Acción del Super Usuario: agrega una cédula a la lista negra de auto-registro (ej. título
 * académico falso reportado antes de que la persona llegue a registrarse). No afecta cuentas
 * ya existentes con esa cédula — solo bloquea un registro futuro.
 */
export function AddCedulaBloqueadaModal({ isOpen, onClose, onAdded }: AddCedulaBloqueadaModalProps) {
  const { getAccessToken } = useAuth();
  const [cedula, setCedula] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setCedula('');
    setMotivo('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim() || !motivo.trim()) {
      setError('Completa la cédula y el motivo.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      await agregarCedulaBloqueada(token, { cedula: cedula.trim(), motivo: motivo.trim() });
      setCedula('');
      setMotivo('');
      onAdded();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 409
            ? 'Esa cédula ya está en la lista negra.'
            : err.message
          : 'No se pudo agregar la cédula. Intenta de nuevo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl flex-shrink-0">
              <Ban className="w-5 h-5" />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                Agregar a lista negra
              </h3>
              <p className="text-xs text-neutral-500">Bloquea el auto-registro de esta cédula</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Número de cédula</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1079661876"
              value={cedula}
              onChange={(e) => setCedula(filtrarSoloDigitos(e.target.value, 10))}
              className="w-full h-12 px-4 rounded-md border border-neutral-400 text-sm text-neutral-800 bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Motivo</label>
            <textarea
              placeholder="Ej. Título académico falso reportado por..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-md border border-neutral-400 text-sm text-neutral-800 bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-200 resize-none"
            />
            <p className="mt-1.5 text-[11px] text-neutral-500">
              Solo lo ven roles internos — el candidato recibe un mensaje genérico al intentar registrarse.
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
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agregando...</span>
                </>
              ) : (
                <span>Agregar a lista negra</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
