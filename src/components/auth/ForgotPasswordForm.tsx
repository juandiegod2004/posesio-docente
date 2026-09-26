'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  resetPasswordSchema,
  ResetPasswordFormData,
  forgotPasswordEmailSchema,
  ForgotPasswordEmailFormData,
} from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { AuthShell } from '@/components/auth/AuthShell';
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPasswordForm() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset, isSubmitting: isSubmittingReset },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema) as any,
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail, isSubmitting: isSubmittingEmail },
  } = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(forgotPasswordEmailSchema) as any,
    defaultValues: {
      email: '',
    },
  });

  const onResetSubmit = async (data: ResetPasswordFormData) => {
    setStatusMessage(null);
    const res = await resetPassword(data.password);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: '¡Contraseña actualizada exitosamente! Redirigiendo al inicio de sesión...',
      });
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Error al actualizar la contraseña.',
      });
    }
  };

  const onEmailSubmit = async (data: ForgotPasswordEmailFormData) => {
    setStatusMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatusMessage({
      type: 'success',
      text: `Hemos enviado las instrucciones a ${data.email}. Revisa tu bandeja de entrada para continuar.`,
    });
    setStep('reset');
  };

  return (
    <AuthShell>
      <div className="space-y-7">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              {step === 'reset' ? 'Crear nueva contraseña' : 'Recuperar contraseña'}
            </h1>
            <button
              type="button"
              onClick={() => {
                setStatusMessage(null);
                setStep(step === 'reset' ? 'request' : 'reset');
              }}
              className="text-[11px] text-brand-600 hover:text-brand-800 underline font-medium whitespace-nowrap"
            >
              {step === 'reset' ? '¿Pedir enlace por correo?' : 'Ya tengo un código'}
            </button>
          </div>
          <p className="text-sm text-neutral-500 font-normal">
            {step === 'reset'
              ? 'Define una nueva contraseña segura para tu cuenta institucional.'
              : 'Ingresa tu correo institucional para enviarte un enlace de recuperación seguro.'}
          </p>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {step === 'reset' ? (
          <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-6">
            <InputFloatingLabel
              label="Nueva contraseña"
              placeholder="••••••••••••"
              isPassword
              autoComplete="new-password"
              error={errorsReset.password?.message}
              {...registerReset('password')}
            />

            <InputFloatingLabel
              label="Confirmar contraseña"
              placeholder="••••••••••••"
              isPassword
              autoComplete="new-password"
              error={errorsReset.confirmPassword?.message}
              {...registerReset('confirmPassword')}
            />

            <button
              type="submit"
              disabled={isSubmittingReset}
              className="w-full h-12 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-70 text-sm"
            >
              {isSubmittingReset ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando contraseña...</span>
                </>
              ) : (
                <span>Guardar nueva contraseña</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-6">
            <InputFloatingLabel
              label="Correo institucional"
              placeholder="nombre.apellido@sedmagdalena.gov.co"
              type="email"
              autoComplete="email"
              error={errorsEmail.email?.message}
              {...registerEmail('email')}
            />

            <button
              type="submit"
              disabled={isSubmittingEmail}
              className="w-full h-12 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-70 text-sm"
            >
              {isSubmittingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando enlace...</span>
                </>
              ) : (
                <span>Enviar enlace de recuperación</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-brand-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al inicio de sesión</span>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
