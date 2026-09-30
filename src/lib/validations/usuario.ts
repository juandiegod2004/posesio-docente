import { z } from 'zod';
import { cedulaSchema, nombrePersonaSchema, passwordSchema, telefonoSchema } from '@/lib/validations/auth';

export const STAFF_ROLES = ['SAC', 'TALENTO_HUMANO', 'GESTOR_DOCUMENTAL', 'SUPER_USUARIO'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const crearUsuarioStaffSchema = z.object({
  nombres: nombrePersonaSchema('El nombre'),
  apellidos: nombrePersonaSchema('El apellido'),
  cedula: cedulaSchema,
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Ingresa un correo electrónico válido'),
  telefono: z.union([telefonoSchema, z.literal('')]).optional(),
  password: passwordSchema,
  rol: z.enum(STAFF_ROLES, { message: 'Selecciona un rol' }),
});

export type CrearUsuarioStaffFormData = z.infer<typeof crearUsuarioStaffSchema>;
