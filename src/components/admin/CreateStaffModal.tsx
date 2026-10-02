'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { ApiError, crearUsuarioStaff } from '@/lib/api';
import { crearUsuarioStaffSchema, CrearUsuarioStaffFormData } from '@/lib/validations/usuario';
import { filtrarNombrePersona, filtrarSoloDigitos } from '@/lib/validations/auth';
import { ROLES } from '@/lib/constants/roles';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const ASSIGNABLE_ROLES = ['SAC', 'TALENTO_HUMANO', 'GESTOR_DOCUMENTAL', 'SUPER_USUARIO'] as const;

export function CreateStaffModal({ isOpen, onClose, onCreated }: CreateStaffModalProps) {
  const { getAccessToken } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CrearUsuarioStaffFormData>({
    resolver: zodResolver(crearUsuarioStaffSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      email: '',
      telefono: '',
      password: '',
      rol: 'SAC',
    },
    mode: 'onChange',
  });

  useLockBodyScroll(isOpen);
  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: CrearUsuarioStaffFormData) => {
    setServerError(null);
    const token = await getAccessToken();
    if (!token) {
      setServerError('No se pudo verificar tu sesión. Inicia sesión de nuevo.');
      return;
    }
    try {
      await crearUsuarioStaff(token, {
        cedula: data.cedula,
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        telefono: data.telefono || undefined,
        rol: data.rol,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof ApiError
          ? err.status === 409
            ? 'Ya existe una cuenta registrada con esta cédula o correo electrónico.'
            : err.message
          : 'Ocurrió un error al crear el funcionario.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-brand-100 text-brand-800 rounded-md">
              <UserPlus className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              Registrar nuevo funcionario
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Nombres"
              placeholder="María"
              maxLength={50}
              error={errors.nombres?.message}
              {...register('nombres', {
                onChange: (e) => {
                  e.target.value = filtrarNombrePersona(e.target.value);
                },
              })}
            />
            <InputFloatingLabel
              label="Apellidos"
              placeholder="Gómez"
              maxLength={50}
              error={errors.apellidos?.message}
              {...register('apellidos', {
                onChange: (e) => {
                  e.target.value = filtrarNombrePersona(e.target.value);
                },
              })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputFloatingLabel
              label="Número de cédula"
              placeholder="1088888888"
              inputMode="numeric"
              error={errors.cedula?.message}
              {...register('cedula', {
                onChange: (e) => {
                  e.target.value = filtrarSoloDigitos(e.target.value, 10);
                },
              })}
            />
            <InputFloatingLabel
              label="Teléfono (opcional)"
              placeholder="3001234567"
              type="tel"
              inputMode="numeric"
              error={errors.telefono?.message}
              {...register('telefono', {
                onChange: (e) => {
                  e.target.value = filtrarSoloDigitos(e.target.value, 10);
                },
              })}
            />
          </div>

          <InputFloatingLabel
            label="Correo electrónico"
            placeholder="tu@correo.com"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <InputFloatingLabel
            label="Contraseña temporal"
            placeholder="••••••••••••"
            isPassword
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="w-full">
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Rol</label>
            <select
              className="w-full h-12 px-4 rounded-md border border-neutral-400 text-sm text-neutral-800 bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-200"
              {...register('rol')}
            >
              {ASSIGNABLE_ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {ROLES[rol].label}
                </option>
              ))}
            </select>
            {errors.rol && <p className="mt-1 text-xs text-red-600 font-medium px-1">{errors.rol.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <span>Crear funcionario</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
