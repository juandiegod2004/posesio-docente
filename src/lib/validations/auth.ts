import { z } from 'zod';
import { TipoDocumentoIdentidad } from '@/lib/api';
import { TIPOS_DOCUMENTO_IDENTIDAD } from '@/lib/constants/informacion-adicional';

const TIPO_DOCUMENTO_VALUES = TIPOS_DOCUMENTO_IDENTIDAD.map((o) => o.value) as [
  TipoDocumentoIdentidad,
  ...TipoDocumentoIdentidad[],
];

// Reglas compartidas con el formulario de registro de docente y el de
// personal interno (admin), replicadas también en el backend.
export const nombrePersonaSchema = (label: string) =>
  z
    .string()
    .min(2, `${label} debe tener al menos 2 caracteres`)
    .max(50, `${label} no debe superar los 50 caracteres`)
    .regex(/^[A-Za-zÁÉÍÓÚÑÜáéíóúñü'\s-]+$/, `${label} no puede contener números ni caracteres especiales`);

export const cedulaSchema = z
  .string()
  .min(6, 'Ingresa un número de cédula válido')
  .max(10, 'La cédula no debe superar los 10 dígitos')
  .regex(/^[0-9]+$/, 'Solo se permiten números en la cédula');

export const telefonoSchema = z
  .string()
  .min(1, 'El teléfono es requerido')
  .regex(/^[0-9\s]+$/, 'Solo se permiten números, sin código de país')
  .refine((val) => val.replace(/\D/g, '').length === 10, 'El teléfono debe tener 10 dígitos');

// Filtros de input en vivo (onChange): descartan el caracter en el momento en que se escribe,
// en vez de solo mostrar un error después. Las reglas coinciden exactamente con los schemas de
// arriba (y con el backend) para que nunca se pueda escribir algo que luego el submit rechace.
export function filtrarNombrePersona(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü'\s-]/g, '');
}

export function filtrarSoloDigitos(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface SignupFormData {
  tipoPosesion: 'DOCENTE' | 'ADMINISTRATIVO';
  firstName: string;
  lastName: string;
  tipoDocumento: TipoDocumentoIdentidad;
  documentNumber: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export const signupSchema = z
  .object({
    tipoPosesion: z.enum(['DOCENTE', 'ADMINISTRATIVO']),
    firstName: nombrePersonaSchema('El nombre'),
    lastName: nombrePersonaSchema('El apellido'),
    tipoDocumento: z.enum(TIPO_DOCUMENTO_VALUES, { message: 'Selecciona el tipo de documento' }),
    documentNumber: cedulaSchema,
    email: z
      .string()
      .min(1, 'El correo es requerido')
      .email('Ingresa un correo electrónico válido'),
    phoneNumber: telefonoSchema,
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar tu contraseña'),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los Términos y Políticas de Privacidad',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Cambio de contraseña obligatorio (cuando el Super Usuario restablece la clave de alguien
// con una temporal) o voluntario, para cualquier rol ya autenticado.
export const cambiarPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar la nueva contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type CambiarPasswordFormData = z.infer<typeof cambiarPasswordSchema>;
