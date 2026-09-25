'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { LogoSeal } from '@/components/ui/LogoSeal';
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
    <div className="min-h-screen bg-white flex items-center justify-center p-6 md:p-12 lg:p-16">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left column: Login Form (Tal como en Login.png) */}
        <div className="w-full max-w-md mx-auto order-2 lg:order-1 space-y-7">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-[42px] font-bold text-neutral-900 tracking-tight">
              Login
            </h1>
            <p className="text-sm md:text-base text-neutral-500 font-normal">
              Inicia sesión para acceder a tu cuenta de No Pierdas el Viaje
            </p>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            {/* Email Field */}
            <InputFloatingLabel
              label="Email"
              placeholder="john.doe@gmail.com"
              type="email"
              autoComplete="username"
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password Field */}
            <InputFloatingLabel
              label="Password"
              placeholder="••••••••••••••••••••"
              isPassword
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Remember me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-neutral-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-400 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  {...register('rememberMe')}
                />
                <span>Recordarme</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[#FF6E66] hover:text-[#e85c54] font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#5055FF] hover:bg-[#4146e6] active:bg-[#353ad6] text-white font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            {/* Don't have an account? Sign up */}
            <div className="text-center text-xs text-neutral-700 pt-1">
              <span>¿No tienes una cuenta? </span>
              <Link
                href="/signup"
                className="text-[#FF6E66] hover:text-[#e85c54] font-semibold transition-colors ml-1"
              >
                Regístrate
              </Link>
            </div>
          </form>

          {/* Quick Demo Accounts for reviewer */}
          <DemoAccountsHelper onSelectAccount={handleSelectDemo} />
        </div>

        {/* Right column: Official Seal Badge (Tal como en Login.png) */}
        <div className="w-full flex items-center justify-center order-1 lg:order-2">
          <LogoSeal size={500} className="max-w-[340px] md:max-w-[440px] lg:max-w-[500px]" />
        </div>
      </div>
    </div>
  );
}
