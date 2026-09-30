'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, restablecerPasswordUsuario } from '@/lib/api';
import { AlertCircle, Check, Copy, KeyRound, Loader2, X } from 'lucide-react';

export interface ResetPasswordTarget {
  usuarioId: string;
  nombre: string;
}

interface ResetPasswordModalProps {
  target: ResetPasswordTarget | null;
  onClose: () => void;
}

/**
 * Acción del Super Usuario: restablece la clave de cualquier usuario (staff o docente) a
 * una temporal generada por el backend, que debe comunicarle fuera de la plataforma. El
 * usuario afectado queda obligado a cambiarla en su próximo login (ChangePasswordGateModal).
 */
export function ResetPasswordModal({ target, onClose }: ResetPasswordModalProps) {
  const { getAccessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useLockBodyScroll(target !== null);
  if (!target) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setPasswordTemporal(null);
    setCopied(false);
    onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      const { passwordTemporal: nueva } = await restablecerPasswordUsuario(token, target.usuarioId);
      setPasswordTemporal(nueva);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!passwordTemporal) return;
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (ej. sin HTTPS): el usuario igual puede seleccionar el texto a mano.
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
                Restablecer contraseña
              </h3>
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

        {passwordTemporal ? (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600">
              Comunícale esta clave temporal a <strong>{target.nombre}</strong> fuera de la plataforma. Deberá
              cambiarla apenas inicie sesión.
            </p>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-3">
              <code className="flex-1 text-sm font-mono font-bold text-neutral-900 tracking-wide break-all">
                {passwordTemporal}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 text-neutral-500 hover:text-brand-700 hover:bg-white rounded-lg transition-colors flex-shrink-0"
                title="Copiar"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full h-11 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all"
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600">
              Se generará una clave temporal para <strong>{target.nombre}</strong> y quedará obligado a cambiarla
              en su próximo inicio de sesión. Su clave actual dejará de funcionar de inmediato.
            </p>

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
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restableciendo...</span>
                  </>
                ) : (
                  <span>Restablecer contraseña</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
