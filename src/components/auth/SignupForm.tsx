'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupFormData, filtrarNombrePersona, filtrarSoloDigitos } from '@/lib/validations/auth';
import { useAuth } from '@/context/AuthContext';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { SelectFloatingLabel } from '@/components/ui/SelectFloatingLabel';
import { AuthShell } from '@/components/auth/AuthShell';
import { TIPOS_DOCUMENTO_IDENTIDAD } from '@/lib/constants/informacion-adicional';
import { Loader2, AlertCircle, Lock } from 'lucide-react';

// 2026-10-06: registro cerrado por decisión institucional, en espejo del flag
// REGISTRO_CERRADO de backend/src/controllers/auth.controller.ts (que igual
// rechaza cualquier intento con 403 aunque este flag no estuviera). Esto solo
// evita que alguien llene todo el formulario para enterarse recién al final.
const REGISTRO_CERRADO = true;

function RegistroCerradoNotice() {
  return (
    <AuthShell>
      <div className="space-y-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Registro cerrado</h1>
          <p className="text-sm text-neutral-500">
            El registro de nuevos docentes está cerrado. Si ya tienes una cuenta, inicia sesión para completar tus
            correcciones y gestión documental. Para más información, comunícate con la Secretaría de Educación del
            Magdalena.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-md bg-brand-700 px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-800"
        >
          Iniciar sesión
        </Link>
      </div>
    </AuthShell>
  );
}

export function SignupForm() {
  if (REGISTRO_CERRADO) {
    return <RegistroCerradoNotice />;
  }
  return <SignupFormActive />;
}

function SignupFormActive() {
  const router = useRouter();
  const { signup } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      tipoPosesion: 'DOCENTE',
      firstName: '',
      lastName: '',
      tipoDocumento: 'CEDULA_CIUDADANIA',
      documentNumber: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
    mode: 'onChange',
  });

  const termsAccepted = useWatch({ control, name: 'termsAccepted' });
  const tipoPosesion = useWatch({ control, name: 'tipoPosesion' });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    const result = await signup(data);
    if (result.success) {
      router.push('/login?registered=1');
    } else {
      setServerError(result.error || 'Ocurrió un error al procesar el registro.');
    }
  };

  return (
    <AuthShell contentClassName="max-w-xl">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-[34px] font-bold text-neutral-900 tracking-tight">
            Regístrate para tu posesión
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-normal">
            Completa tus datos para crear tu cuenta. Después de iniciar sesión podrás subir la autorización de notificación electrónica y los demás documentos de tu checklist de posesión.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        {/* suppressHydrationWarning: gestores de contraseñas marcan el <form> antes de hidratar. */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" suppressHydrationWarning>
          {/* Tipo de posesión */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">¿Te vas a posesionar como Docente o como personal Administrativo?</span>
            <div className="grid grid-cols-2 gap-3">
              {(['DOCENTE', 'ADMINISTRATIVO'] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setValue('tipoPosesion', opcion, { shouldValidate: true })}
                  className={`h-11 rounded-md text-sm font-semibold border transition-colors ${
                    tipoPosesion === opcion
                      ? 'bg-brand-700 border-brand-700 text-white'
                      : 'bg-white border-neutral-300 text-neutral-600 hover:border-brand-400'
                  }`}
                >
                  {opcion === 'DOCENTE' ? 'Docente' : 'Administrativo'}
                </button>
              ))}
            </div>
          </div>

          {/* Row 1: First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Nombres"
              placeholder="Juan"
              autoComplete="given-name"
              maxLength={50}
              error={errors.firstName?.message}
              {...register('firstName', {
                onChange: (e) => {
                  e.target.value = filtrarNombrePersona(e.target.value);
                },
              })}
            />
            <InputFloatingLabel
              label="Apellidos"
              placeholder="Pérez Rodríguez"
              autoComplete="family-name"
              maxLength={50}
              error={errors.lastName?.message}
              {...register('lastName', {
                onChange: (e) => {
                  e.target.value = filtrarNombrePersona(e.target.value);
                },
              })}
            />
          </div>

          {/* Row 2: Tipo de documento, Cédula & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectFloatingLabel
              label="Tipo de documento"
              placeholder="Selecciona..."
              options={TIPOS_DOCUMENTO_IDENTIDAD}
              error={errors.tipoDocumento?.message}
              {...register('tipoDocumento')}
            />
            <InputFloatingLabel
              label="Número de cédula"
              placeholder="1082945312"
              autoComplete="off"
              inputMode="numeric"
              error={errors.documentNumber?.message}
              {...register('documentNumber', {
                onChange: (e) => {
                  e.target.value = filtrarSoloDigitos(e.target.value, 10);
                },
              })}
            />
            <InputFloatingLabel
              label="Teléfono"
              placeholder="3001234567"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              error={errors.phoneNumber?.message}
              {...register('phoneNumber', {
                onChange: (e) => {
                  e.target.value = filtrarSoloDigitos(e.target.value, 10);
                },
              })}
            />
          </div>

          {/* Row 3: Email */}
          <InputFloatingLabel
            label="Correo electrónico"
            placeholder="tu@correo.com"
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
                className="text-gold-600 hover:text-gold-700 font-medium rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
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
                className="text-gold-600 hover:text-gold-700 font-medium rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
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

          <button
            type="submit"
            disabled={!termsAccepted || isSubmitting}
            className={`w-full h-12 font-semibold rounded-md shadow-xs transition-all flex items-center justify-center gap-2 text-sm select-none ${
              !termsAccepted
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-300'
                : 'bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2'
            }`}
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
              className="text-gold-600 hover:text-gold-700 font-semibold transition-colors ml-1 rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
            >
              Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
