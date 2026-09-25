'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupFormData } from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { DocumentUpload } from '@/components/ui/DocumentUpload';
import { LogoSeal } from '@/components/ui/LogoSeal';
import { SocialButtons } from '@/components/ui/SocialButtons';
import { Loader2, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';
import { UserRole } from '@/types/auth';

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'estudiante',
      password: '',
      confirmPassword: '',
      signedDocument: null,
      termsAccepted: true,
    },
    mode: 'onChange',
  });

  const signedDoc = watch('signedDocument');
  const termsAccepted = watch('termsAccepted');
  const isDocumentMissing = !signedDoc;
  const isButtonBlocked = isDocumentMissing || !termsAccepted;

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    setSuccessMessage(null);

    if (isDocumentMissing) {
      setServerError('No se puede crear la cuenta: El documento de autorización firmado es estrictamente obligatorio.');
      return;
    }

    const result = await signup(data);
    if (result.success) {
      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo a tu panel...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } else {
      setServerError(result.error || 'Ocurrió un error al procesar el registro.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 md:p-10 lg:p-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left column: Official Seal Badge (Tal como en Sign up.png) */}
        <div className="w-full flex items-center justify-center order-1">
          <LogoSeal size={500} className="max-w-[320px] md:max-w-[420px] lg:max-w-[500px]" />
        </div>

        {/* Right column: Signup Form (Tal como en Sign up.png) */}
        <div className="w-full max-w-xl mx-auto order-2 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-[38px] font-bold text-neutral-900 tracking-tight">
              Sign up
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 font-normal">
              Completa tus datos para acceder a tu cuenta personal de No Pierdas el Viaje.
            </p>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{serverError}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            {/* Row 1: First Name & Last Name (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputFloatingLabel
                label="First Name"
                placeholder="Juan"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <InputFloatingLabel
                label="Last Name"
                placeholder="Pérez"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            {/* Row 2: Email & Phone Number (2 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputFloatingLabel
                label="Email"
                placeholder="john.doe@gmail.com"
                type="email"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <InputFloatingLabel
                label="Phone Number"
                placeholder="+57 300 123 4567"
                type="tel"
                autoComplete="tel"
                error={errors.phoneNumber?.message}
                {...register('phoneNumber')}
              />
            </div>

            {/* Rol de usuario para el sistema de rutas protegidas */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-700">
                Rol en la institución
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['estudiante', 'docente', 'coordinador', 'administrador'] as UserRole[]).map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-1.5 p-2 rounded-md border border-neutral-200 text-xs font-medium cursor-pointer hover:bg-neutral-50 has-checked:border-indigo-600 has-checked:bg-indigo-50/50 has-checked:text-indigo-900 transition-all select-none"
                  >
                    <input
                      type="radio"
                      value={r}
                      className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      {...register('role')}
                    />
                    <span className="capitalize">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Row 3: Password */}
            <InputFloatingLabel
              label="Password"
              placeholder="••••••••••••••••••••"
              isPassword
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Row 4: Confirm Password */}
            <InputFloatingLabel
              label="Confirm Password"
              placeholder="••••••••••••••••••••"
              isPassword
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {/* Documento de autorización firmado (BLOQUEANTE) */}
            <div className="pt-1">
              <Controller
                name="signedDocument"
                control={control}
                render={({ field, fieldState }) => (
                  <DocumentUpload
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            {/* Terms and Privacy Policies Checkbox */}
            <div className="flex items-start gap-2 pt-1 text-xs select-none">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 rounded border-neutral-400 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                {...register('termsAccepted')}
              />
              <label htmlFor="terms" className="text-neutral-700 cursor-pointer">
                Acepto todos los{' '}
                <a
                  href="#terms"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Términos y condiciones del programa No Pierdas el Viaje - Secretaría de Educación.');
                  }}
                  className="text-[#FF6E66] hover:text-[#e85c54] font-medium"
                >
                  Términos
                </a>{' '}
                y{' '}
                <a
                  href="#privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Políticas de privacidad y protección de datos personales.');
                  }}
                  className="text-[#FF6E66] hover:text-[#e85c54] font-medium"
                >
                  Políticas de Privacidad
                </a>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-xs text-red-600 font-medium px-1">
                {errors.termsAccepted.message}
              </p>
            )}

            {/* Bloqueo informativo si falta el documento */}
            {isDocumentMissing && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Botón bloqueado:</strong> Para habilitar el registro debes adjuntar el documento de autorización firmado arriba.
                </span>
              </div>
            )}

            {/* Submit Button: BLOQUEADO SI NO SUBE EL DOCUMENTO */}
            <button
              type="submit"
              disabled={isButtonBlocked || isSubmitting}
              className={`w-full h-12 font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 text-sm select-none ${
                isButtonBlocked
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-300'
                  : 'bg-[#5055FF] hover:bg-[#4146e6] active:bg-[#353ad6] text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2'
              }`}
              title={
                isDocumentMissing
                  ? 'Debes cargar el documento de autorización firmado para continuar'
                  : 'Crear cuenta'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando y creando cuenta...</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </button>

            {/* Already have an account? Login */}
            <div className="text-center text-xs text-neutral-700 pt-1">
              <span>¿Ya tienes una cuenta? </span>
              <Link
                href="/login"
                className="text-[#FF6E66] hover:text-[#e85c54] font-semibold transition-colors ml-1"
              >
                Login
              </Link>
            </div>

            {/* Divider and Social Login */}
            <SocialButtons />
          </form>
        </div>
      </div>
    </div>
  );
}
