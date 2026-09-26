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
import { AuthShell } from '@/components/auth/AuthShell';
import { Loader2, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

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
      documentNumber: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      signedDocument: null,
      termsAccepted: false,
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
      setServerError('No se puede crear la cuenta: la autorización de notificación electrónica firmada vía Ciudadano Digital es estrictamente obligatoria.');
      return;
    }

    const result = await signup(data);
    if (result.success) {
      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo a tu checklist de documentos...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1000);
    } else {
      setServerError(result.error || 'Ocurrió un error al procesar el registro.');
    }
  };

  return (
    <AuthShell contentClassName="max-w-xl">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[34px] font-bold text-neutral-900 tracking-tight">
            Regístrate como docente
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-normal">
            Completa tus datos y adjunta tu autorización de notificación electrónica firmada vía Ciudadano Digital para habilitar tu checklist de posesión.
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
          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Nombres"
              placeholder="Juan"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <InputFloatingLabel
              label="Apellidos"
              placeholder="Pérez Rodríguez"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          {/* Row 2: Cédula & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Número de cédula"
              placeholder="1.082.945.312"
              autoComplete="off"
              error={errors.documentNumber?.message}
              {...register('documentNumber')}
            />
            <InputFloatingLabel
              label="Teléfono"
              placeholder="+57 300 123 4567"
              type="tel"
              autoComplete="tel"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber')}
            />
          </div>

          {/* Row 3: Email */}
          <InputFloatingLabel
            label="Correo institucional"
            placeholder="nombre.apellido@sedmagdalena.gov.co"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          {/* Row 4: Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Contraseña"
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
          </div>

          {/* Autorización de notificación electrónica firmada (BLOQUEANTE) */}
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
              className="w-4 h-4 rounded border-neutral-400 text-brand-600 focus:ring-brand-500 mt-0.5 cursor-pointer"
              {...register('termsAccepted')}
            />
            <label htmlFor="terms" className="text-neutral-700 cursor-pointer">
              Acepto los{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Términos y condiciones del proceso de posesión docente - Secretaría de Educación del Magdalena.');
                }}
                className="text-gold-600 hover:text-gold-700 font-medium"
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
                className="text-gold-600 hover:text-gold-700 font-medium"
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

          {isDocumentMissing && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Registro bloqueado:</strong> adjunta arriba tu autorización de notificación electrónica firmada vía Ciudadano Digital para continuar.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isButtonBlocked || isSubmitting}
            className={`w-full h-12 font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 text-sm select-none ${
              isButtonBlocked
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-300'
                : 'bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2'
            }`}
            title={
              isDocumentMissing
                ? 'Debes adjuntar la autorización firmada para continuar'
                : 'Crear cuenta'
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando y creando cuenta...</span>
              </>
            ) : (
              <span>Crear mi cuenta</span>
            )}
          </button>

          <div className="text-center text-xs text-neutral-700 pt-1">
            <span>¿Ya tienes una cuenta? </span>
            <Link
              href="/login"
              className="text-gold-600 hover:text-gold-700 font-semibold transition-colors ml-1"
            >
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
