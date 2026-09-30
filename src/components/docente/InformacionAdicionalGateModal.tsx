'use client';

import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import {
  informacionAdicionalSchema,
  InformacionAdicionalFormData,
  InformacionAdicionalFormInput,
} from '@/lib/validations/informacion-adicional';
import {
  SEXO_OPTIONS,
  ESTADO_CIVIL_OPTIONS,
  TIPO_SANGRE_OPTIONS,
} from '@/lib/constants/informacion-adicional';
import {
  ApiError,
  Ciudad,
  Departamento,
  EstadoCivil,
  TipoSangre,
  completarInformacionAdicional,
  fetchCiudades,
  fetchDepartamentos,
  fetchPaises,
} from '@/lib/api';
import { InputFloatingLabel } from '@/components/ui/InputFloatingLabel';
import { SelectFloatingLabel } from '@/components/ui/SelectFloatingLabel';
import { AlertCircle, IdCard, Loader2 } from 'lucide-react';

interface InformacionAdicionalGateModalProps {
  docenteId: string;
}

/**
 * Modal bloqueante: cubre todo el dashboard del docente hasta que complete el paso de
 * información adicional (datos personales) exigido por el backend antes de habilitar la
 * carga de cualquier documento — incluida la autorización de notificación electrónica, por
 * eso este gate tiene prioridad sobre `AuthorizationGateModal` en `dashboard/layout.tsx`.
 * Sin cierre ni botón de saltar, igual que los demás gates de este flujo.
 */
export function InformacionAdicionalGateModal({ docenteId }: InformacionAdicionalGateModalProps) {
  const { getAccessToken, refreshUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const [paises, setPaises] = useState<string[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(true);
  const [catalogoError, setCatalogoError] = useState<string | null>(null);

  const [ciudadesNacimiento, setCiudadesNacimiento] = useState<Ciudad[]>([]);
  const [isLoadingCiudadesNacimiento, setIsLoadingCiudadesNacimiento] = useState(false);
  const [ciudadesExpedicion, setCiudadesExpedicion] = useState<Ciudad[]>([]);
  const [isLoadingCiudadesExpedicion, setIsLoadingCiudadesExpedicion] = useState(false);

  useLockBodyScroll(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InformacionAdicionalFormInput, unknown, InformacionAdicionalFormData>({
    resolver: zodResolver(informacionAdicionalSchema),
    defaultValues: {
      sexo: undefined,
      fechaNacimiento: undefined,
      paisNacimiento: '',
      departamentoNacimientoId: '',
      ciudadNacimientoId: '',
      cantidadHijos: undefined,
      fechaExpedicionCedula: undefined,
      departamentoExpedicionId: '',
      ciudadExpedicionId: '',
      estadoCivil: '',
      tipoSangre: '',
      direccion: '',
    },
  });

  const paisNacimiento = useWatch({ control, name: 'paisNacimiento' });
  const departamentoNacimientoId = useWatch({ control, name: 'departamentoNacimientoId' });
  const departamentoExpedicionId = useWatch({ control, name: 'departamentoExpedicionId' });
  const esColombiaNacimiento = paisNacimiento === 'Colombia';

  // Catálogos base: siempre se necesitan (países para nacimiento, departamentos para ambas cascadas).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getAccessToken();
      if (!token) return;
      setIsLoadingCatalogos(true);
      setCatalogoError(null);
      try {
        const [paisesData, departamentosData] = await Promise.all([
          fetchPaises(token),
          fetchDepartamentos(token),
        ]);
        if (cancelled) return;
        setPaises(paisesData);
        setDepartamentos(departamentosData);
      } catch (err) {
        if (cancelled) return;
        setCatalogoError(
          err instanceof ApiError ? err.message : 'No se pudieron cargar los catálogos de país/departamento.'
        );
      } finally {
        if (!cancelled) setIsLoadingCatalogos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  // Cascada: ciudades de nacimiento, filtradas por el departamento de nacimiento elegido.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!departamentoNacimientoId) {
        setCiudadesNacimiento([]);
        return;
      }
      const token = await getAccessToken();
      if (!token) return;
      setIsLoadingCiudadesNacimiento(true);
      try {
        const data = await fetchCiudades(token, departamentoNacimientoId);
        if (!cancelled) setCiudadesNacimiento(data);
      } catch {
        if (!cancelled) setCiudadesNacimiento([]);
      } finally {
        if (!cancelled) setIsLoadingCiudadesNacimiento(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departamentoNacimientoId, getAccessToken]);

  // Cascada: ciudades de expedición, filtradas por el departamento de expedición elegido.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!departamentoExpedicionId) {
        setCiudadesExpedicion([]);
        return;
      }
      const token = await getAccessToken();
      if (!token) return;
      setIsLoadingCiudadesExpedicion(true);
      try {
        const data = await fetchCiudades(token, departamentoExpedicionId);
        if (!cancelled) setCiudadesExpedicion(data);
      } catch {
        if (!cancelled) setCiudadesExpedicion([]);
      } finally {
        if (!cancelled) setIsLoadingCiudadesExpedicion(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [departamentoExpedicionId, getAccessToken]);

  const departamentoOptions = departamentos.map((d) => ({ value: d.id, label: d.nombre }));
  const ciudadNacimientoOptions = ciudadesNacimiento.map((c) => ({ value: c.id, label: c.nombre }));
  const ciudadExpedicionOptions = ciudadesExpedicion.map((c) => ({ value: c.id, label: c.nombre }));
  const paisOptions = paises.map((p) => ({ value: p, label: p }));

  const onSubmit = async (data: InformacionAdicionalFormData) => {
    setServerError(null);
    const token = await getAccessToken();
    if (!token) {
      setServerError('No se pudo validar tu sesión. Recarga la página e intenta de nuevo.');
      return;
    }
    try {
      await completarInformacionAdicional(token, docenteId, {
        sexo: data.sexo,
        fechaNacimiento: data.fechaNacimiento.toISOString(),
        paisNacimiento: data.paisNacimiento,
        ...(esColombiaNacimiento
          ? {
              departamentoNacimientoId: data.departamentoNacimientoId,
              ciudadNacimientoId: data.ciudadNacimientoId,
            }
          : {}),
        cantidadHijos: data.cantidadHijos,
        fechaExpedicionCedula: data.fechaExpedicionCedula.toISOString(),
        departamentoExpedicionId: data.departamentoExpedicionId,
        ciudadExpedicionId: data.ciudadExpedicionId,
        estadoCivil: data.estadoCivil as EstadoCivil,
        tipoSangre: data.tipoSangre as TipoSangre,
        direccion: data.direccion,
      });
      await refreshUser();
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : 'No se pudo guardar tu información. Intenta de nuevo.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 border border-neutral-200 relative my-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
          <span className="p-2 bg-amber-100 text-amber-600 rounded-xl flex-shrink-0">
            <IdCard className="w-5 h-5" />
          </span>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              Completa tu información personal
            </h3>
            <p className="text-xs text-neutral-600">
              Antes de subir tus documentos necesitamos algunos datos personales adicionales. Esto solo toma un
              minuto.
            </p>
          </div>
        </div>

        {catalogoError && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{catalogoError}</span>
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" suppressHydrationWarning>
          {/* Nacimiento */}
          <div>
            {/* block + mb-4: en un <span> inline el margen vertical no separa del
                siguiente elemento (las reglas CSS lo ignoran); con block sí abre espacio
                real antes del primer campo, evitando que su label flotante (que sube
                -10px sobre su propio borde) quede pegado al título de la sección. */}
            <span className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4">
              Nacimiento
            </span>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectFloatingLabel
                  label="Sexo"
                  placeholder="Selecciona..."
                  options={SEXO_OPTIONS}
                  error={errors.sexo?.message}
                  {...register('sexo')}
                />
                <InputFloatingLabel
                  label="Fecha de nacimiento"
                  type="date"
                  error={errors.fechaNacimiento?.message}
                  {...register('fechaNacimiento')}
                />
              </div>
              <SelectFloatingLabel
                label="País de nacimiento"
                placeholder={isLoadingCatalogos ? 'Cargando...' : 'Selecciona...'}
                options={paisOptions}
                disabled={isLoadingCatalogos}
                error={errors.paisNacimiento?.message}
                {...register('paisNacimiento')}
              />
              {esColombiaNacimiento && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectFloatingLabel
                    label="Departamento de nacimiento"
                    placeholder={isLoadingCatalogos ? 'Cargando...' : 'Selecciona...'}
                    options={departamentoOptions}
                    disabled={isLoadingCatalogos}
                    error={errors.departamentoNacimientoId?.message}
                    {...register('departamentoNacimientoId', {
                      onChange: () => setValue('ciudadNacimientoId', ''),
                    })}
                  />
                  <SelectFloatingLabel
                    label="Ciudad de nacimiento"
                    placeholder={
                      !departamentoNacimientoId
                        ? 'Elige un departamento primero'
                        : isLoadingCiudadesNacimiento
                        ? 'Cargando...'
                        : 'Selecciona...'
                    }
                    options={ciudadNacimientoOptions}
                    disabled={!departamentoNacimientoId || isLoadingCiudadesNacimiento}
                    error={errors.ciudadNacimientoId?.message}
                    {...register('ciudadNacimientoId')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cédula de ciudadanía */}
          <div>
            <span className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4">
              Expedición de la cédula
            </span>
            <div className="space-y-3">
              <InputFloatingLabel
                label="Fecha de expedición"
                type="date"
                error={errors.fechaExpedicionCedula?.message}
                {...register('fechaExpedicionCedula')}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectFloatingLabel
                  label="Departamento de expedición"
                  placeholder={isLoadingCatalogos ? 'Cargando...' : 'Selecciona...'}
                  options={departamentoOptions}
                  disabled={isLoadingCatalogos}
                  error={errors.departamentoExpedicionId?.message}
                  {...register('departamentoExpedicionId', {
                    onChange: () => setValue('ciudadExpedicionId', ''),
                  })}
                />
                <SelectFloatingLabel
                  label="Ciudad de expedición"
                  placeholder={
                    !departamentoExpedicionId
                      ? 'Elige un departamento primero'
                      : isLoadingCiudadesExpedicion
                      ? 'Cargando...'
                      : 'Selecciona...'
                  }
                  options={ciudadExpedicionOptions}
                  disabled={!departamentoExpedicionId || isLoadingCiudadesExpedicion}
                  error={errors.ciudadExpedicionId?.message}
                  {...register('ciudadExpedicionId')}
                />
              </div>
            </div>
          </div>

          {/* Otros datos */}
          <div>
            <span className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-4">
              Otros datos
            </span>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputFloatingLabel
                  label="Cantidad de hijos"
                  type="number"
                  min={0}
                  error={errors.cantidadHijos?.message}
                  {...register('cantidadHijos')}
                />
                <SelectFloatingLabel
                  label="Estado civil"
                  placeholder="Selecciona..."
                  options={ESTADO_CIVIL_OPTIONS}
                  error={errors.estadoCivil?.message}
                  {...register('estadoCivil')}
                />
                <SelectFloatingLabel
                  label="Tipo de sangre"
                  placeholder="Selecciona..."
                  options={TIPO_SANGRE_OPTIONS}
                  error={errors.tipoSangre?.message}
                  {...register('tipoSangre')}
                />
              </div>
              <InputFloatingLabel
                label="Dirección"
                placeholder="Calle 10 # 5-20"
                autoComplete="street-address"
                error={errors.direccion?.message}
                {...register('direccion')}
              />
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLoadingCatalogos}
            className="w-full h-11 bg-brand-700 hover:bg-brand-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar y continuar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
