import { EstadoCivil, TipoDocumentoIdentidad, TipoSangre } from '@/lib/api';

export const TIPOS_DOCUMENTO_IDENTIDAD: { value: TipoDocumentoIdentidad; label: string }[] = [
  { value: 'CEDULA_CIUDADANIA', label: 'Cédula de ciudadanía' },
  { value: 'CEDULA_EXTRANJERIA', label: 'Cédula de extranjería' },
  { value: 'TARJETA_IDENTIDAD', label: 'Tarjeta de identidad' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PEP', label: 'Permiso Especial de Permanencia (PEP)' },
  { value: 'PPT', label: 'Permiso por Protección Temporal (PPT)' },
];

export const SEXO_OPTIONS: { value: 'MASCULINO' | 'FEMENINO'; label: string }[] = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
];

export const ESTADO_CIVIL_OPTIONS: { value: EstadoCivil; label: string }[] = [
  { value: 'SOLTERO', label: 'Soltero(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'UNION_LIBRE', label: 'Unión libre' },
  { value: 'SEPARADO', label: 'Separado(a)' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUDO', label: 'Viudo(a)' },
];

export const TIPO_SANGRE_OPTIONS: { value: TipoSangre; label: string }[] = [
  { value: 'O_POSITIVO', label: 'O+' },
  { value: 'O_NEGATIVO', label: 'O-' },
  { value: 'A_POSITIVO', label: 'A+' },
  { value: 'A_NEGATIVO', label: 'A-' },
  { value: 'B_POSITIVO', label: 'B+' },
  { value: 'B_NEGATIVO', label: 'B-' },
  { value: 'AB_POSITIVO', label: 'AB+' },
  { value: 'AB_NEGATIVO', label: 'AB-' },
];
