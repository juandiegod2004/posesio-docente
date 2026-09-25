import { z } from 'zod';
import type { UserRole, UploadedDocument } from '@/types/auth';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  signedDocument: UploadedDocument | null;
  termsAccepted: boolean;
}

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z
      .string()
      .min(2, 'El apellido debe tener al menos 2 caracteres'),
    email: z
      .string()
      .min(1, 'El correo electrónico es requerido')
      .email('Ingresa un correo electrónico válido'),
    phoneNumber: z
      .string()
      .min(7, 'Ingresa un número de teléfono válido (mínimo 7 dígitos)')
      .regex(/^[0-9+\s()-]+$/, 'Solo se permiten números y símbolos telefónicos'),
    role: z.enum(['estudiante', 'docente', 'coordinador', 'administrador']),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar tu contraseña'),
    // Documento de autorización firmado: BLOQUEANTE
    signedDocument: z
      .object({
        name: z.string().min(1, 'Nombre de archivo inválido'),
        size: z.number().max(10 * 1024 * 1024, 'El archivo no debe exceder 10MB'),
        type: z.string(),
        dataUrl: z.string().optional(),
        uploadedAt: z.string(),
      })
      .nullable()
      .refine((val) => val !== null && val !== undefined, {
        message: 'Debes adjuntar el documento de autorización firmado para poder registrarte',
      }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'Debes aceptar los Términos y Políticas de Privacidad',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirmPassword: z
      .string()
      .min(1, 'Debes confirmar la nueva contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const forgotPasswordEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Ingresa un correo electrónico válido'),
});

export type ForgotPasswordEmailFormData = z.infer<typeof forgotPasswordEmailSchema>;
