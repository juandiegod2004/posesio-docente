'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { cambiarPasswordSchema, CambiarPasswordFormData } from '@/lib/validations/auth';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';

/**
 * Modal bloqueante: se muestra a CUALQUIER rol autenticado cuyo `debeCambiarPassword` sea
 * true (el Super Usuario le restableció la clave con una temporal). Sin cambiarla no puede
 * usar el resto de la plataforma, así que no tiene botón de cierre ni se puede saltar.
 */
export function ChangePasswordGateModal() {
  const router = useRouter();
  const { cambiarPassword } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);

  useLockBodyScroll(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CambiarPasswordFormData>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: CambiarPasswordFormData) => {
    setServerError(null);
    const result = await cambiarPassword(data.password);
    if (result.success) {
      // Cambiar la contraseña invalida la sesión actual: el usuario debe volver a loguearse.
      router.push('/login?passwordChanged=1');
    } else {
      setServerError(result.error || 'No se pudo cambiar la contraseña. Intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
          <span className="p-2 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
            <KeyRound className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              Debes cambiar tu contraseña
            </h3>
            <p className="text-xs text-neutral-600">
              Tu contraseña fue restablecida. Define una nueva para continuar usando tu cuenta.
            </p>
          </div>
        </div>

        {/* suppressHydrationWarning: gestores de contraseñas marcan el <form> antes de hidratar. */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" suppressHydrationWarning>
          <InputFloatingLabel
            label="Nueva contraseña"
            placeholder="••••••••••••"
            isPassword
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <InputFloatingLabel
            label="Confirmar contraseña"
            placeholder="••••••••••••"
            isPassword
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Cambiar contraseña</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
