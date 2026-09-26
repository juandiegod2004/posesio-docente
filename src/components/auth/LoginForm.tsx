'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { AuthShell } from '@/components/auth/AuthShell';
import { DemoAccountsHelper } from '@/components/auth/DemoAccountsHelper';
import { Loader2, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const result = await login(data);
    if (result.success) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setServerError(result.error || 'Credenciales inválidas');
    }
  };

  const handleSelectDemo = (email: string, passwordHint: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', passwordHint, { shouldValidate: true });
  };

  return (
    <AuthShell>
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-[34px] font-bold text-neutral-900 tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Ingresa con tu correo institucional para continuar tu proceso de posesión.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          <InputFloatingLabel
            label="Correo institucional"
            placeholder="nombre.apellido@sedmagdalena.gov.co"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />

          <InputFloatingLabel
            label="Contraseña"
            placeholder="••••••••••••"
            isPassword
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-neutral-400 text-brand-600 focus:ring-brand-500 cursor-pointer"
                {...register('rememberMe')}
              />
              <span>Recordarme</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-gold-600 hover:text-gold-700 font-semibold transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>

          <div className="text-center text-xs text-neutral-700 pt-1">
            <span>¿Eres docente nombrado y aún no tienes cuenta? </span>
            <Link
              href="/signup"
              className="text-gold-600 hover:text-gold-700 font-semibold transition-colors ml-1"
            >
              Regístrate
            </Link>
          </div>
        </form>

        <DemoAccountsHelper onSelectAccount={handleSelectDemo} />
      </div>
    </AuthShell>
  );
}
