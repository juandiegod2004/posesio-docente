import { User, UserRole } from '@/types/auth';

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  iconName: string;
  allowedPaths: string[];
}

export const ROLES: Record<UserRole, RoleConfig> = {
  administrador: {
    id: 'administrador',
    label: 'Administrador',
    description: 'Acceso total al sistema, auditoría, gestión de usuarios y métricas globales.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    iconName: 'ShieldAlert',
    allowedPaths: [
      '/dashboard',
      '/dashboard/admin',
      '/dashboard/coordinador',
      '/dashboard/docente',
      '/dashboard/estudiante',
      '/dashboard/documentos',
    ],
  },
  coordinador: {
    id: 'coordinador',
    label: 'Coordinador',
    description: 'Gestión y verificación de documentos de autorización, seguimiento por sedes.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    iconName: 'FileCheck',
    allowedPaths: [
      '/dashboard',
      '/dashboard/coordinador',
      '/dashboard/docente',
      '/dashboard/estudiante',
      '/dashboard/documentos',
    ],
  },
  docente: {
    id: 'docente',
    label: 'Docente',
    description: 'Consulta de beneficiarios autorizados y alertas tempranas en aula.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'GraduationCap',
    allowedPaths: [
      '/dashboard',
      '/dashboard/docente',
      '/dashboard/estudiante',
    ],
  },
  estudiante: {
    id: 'estudiante',
    label: 'Estudiante',
    description: 'Consulta de estado de viaje, beneficio y autorización registrada.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    iconName: 'User',
    allowedPaths: [
      '/dashboard',
      '/dashboard/estudiante',
    ],
  },
};

export const DEMO_ACCOUNTS: Array<Omit<User, 'createdAt'> & { passwordHint: string }> = [
  {
    id: 'demo-admin-1',
    firstName: 'Carlos',
    lastName: 'Montoya',
    email: 'admin@educacion.gob.co',
    phoneNumber: '+57 310 555 0101',
    role: 'administrador',
    passwordHint: 'Admin123*',
    document: {
      name: 'autorizacion_direccion_general.pdf',
      size: 1420000,
      type: 'application/pdf',
      uploadedAt: '2026-01-15T08:30:00Z',
    },
  },
  {
    id: 'demo-coord-1',
    firstName: 'Patricia',
    lastName: 'Gómez',
    email: 'coordinador@educacion.gob.co',
    phoneNumber: '+57 312 444 0202',
    role: 'coordinador',
    passwordHint: 'Coord123*',
    document: {
      name: 'resolucion_coordinacion_firmada.pdf',
      size: 980000,
      type: 'application/pdf',
      uploadedAt: '2026-02-10T11:20:00Z',
    },
  },
  {
    id: 'demo-doc-1',
    firstName: 'Fernando',
    lastName: 'Silva',
    email: 'docente@educacion.gob.co',
    phoneNumber: '+57 315 333 0303',
    role: 'docente',
    passwordHint: 'Docente123*',
    document: {
      name: 'autorizacion_institucional_docente.pdf',
      size: 750000,
      type: 'application/pdf',
      uploadedAt: '2026-03-01T14:10:00Z',
    },
  },
  {
    id: 'demo-est-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@gmail.com',
    phoneNumber: '+57 300 123 4567',
    role: 'estudiante',
    passwordHint: 'Password123*',
    document: {
      name: 'autorizacion_acudiente_firmada.pdf',
      size: 1250000,
      type: 'application/pdf',
      uploadedAt: '2026-03-12T09:45:00Z',
    },
  },
];
