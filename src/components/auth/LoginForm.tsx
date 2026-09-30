'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { AuthShell } from '@/components/auth/AuthShell';
import { Turnstile, TurnstileHandle } from '@/components/ui/Turnstile';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

/** Solo permite rutas internas: evita que un `callbackUrl` manipulado redirija a un dominio externo (open redirect). */
function getSafeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/dashboard';
  }
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));
  const { login, isAuthenticated, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const successNotice =
    searchParams.get('registered') === '1'
      ? 'Cuenta creada exitosamente. Inicia sesión para continuar tu registro.'
      : searchParams.get('passwordChanged') === '1'
      ? 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.'
      : null;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetTick, setCaptchaResetTick] = useState(0);
  const [captchaError, setCaptchaError] = useState(false);
  // Se activa tras un login exitoso y ya no se apaga: evita que el botón "parpadee"
  // de vuelta a su estado normal mientras la navegación al dashboard todavía está en curso.
  const [isRedirecting, setIsRedirecting] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [isLoading, isAuthenticated, callbackUrl, router]);

  // El token de Turnstile es de un solo uso: lo renovamos aquí (fuera del handler
  // de submit) para que el React Compiler no trate el acceso al ref como lectura en render.
  useEffect(() => {
    if (captchaResetTick > 0) {
      turnstileRef.current?.reset();
    }
  }, [captchaResetTick]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setCaptchaError(true);
  };

  const handleCaptchaRetry = () => {
    setCaptchaError(false);
    setCaptchaResetTick((tick) => tick + 1);
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    if (!captchaToken) {
      setServerError('Completa la verificación de seguridad para continuar.');
      return;
    }
    const result = await login(data, captchaToken);
    if (result.success) {
      // No navegamos aquí: duplicaba la redirección del useEffect de arriba y disparaba
      // el middleware dos veces en paralelo (causaba el error de stream cerrado en dev).
      setIsRedirecting(true);
    } else {
      setServerError(result.error || 'Credenciales inválidas');
      setCaptchaToken(null);
      setCaptchaResetTick((tick) => tick + 1);
    }
  };

  return (
    <AuthShell>
      <div className="space-y-7">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-[34px] font-bold text-neutral-900 tracking-tight">
            Iniciar sesión
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Ingresa con tu correo para continuar tu proceso de posesión.
          </p>
        </div>

        {successNotice && !serverError && (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* suppressHydrationWarning: gestores de contraseñas marcan el <form> antes de hidratar. */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" suppressHydrationWarning>
          <InputFloatingLabel
            label="Correo electrónico"
            placeholder="tu@correo.com"
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

          <Turnstile
            ref={turnstileRef}
            onVerify={(token) => {
              setCaptchaToken(token);
              setCaptchaError(false);
            }}
            onExpire={() => setCaptchaToken(null)}
            onError={handleCaptchaError}
          />

          {captchaError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span className="flex-1">No pudimos verificar que eres humano. Puede ser un problema temporal de conexión.</span>
              <button
                type="button"
                onClick={handleCaptchaRetry}
                className="font-semibold text-red-800 hover:text-red-900 underline flex-shrink-0"
              >
                Reintentar
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isRedirecting || !captchaToken}
            className="w-full h-12 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting || isRedirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isRedirecting ? 'Ingresando...' : 'Iniciando sesión...'}</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>

          <div className="text-center text-xs text-neutral-700 pt-1">
            <span>¿Fuiste notificado para tu posesión? </span>
            <Link
              href="/signup"
              className="text-gold-600 hover:text-gold-700 font-semibold transition-colors ml-1 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
            >
              Regístrate
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
