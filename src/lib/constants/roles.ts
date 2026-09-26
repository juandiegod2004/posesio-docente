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
  super_usuario: {
    id: 'super_usuario',
    label: 'Super Usuario',
    description: 'Control total del sistema: usuarios, roles, auditoría y métricas globales del proceso de posesión.',
    badgeColor: 'bg-brand-100 text-brand-900 border-brand-300',
    iconName: 'ShieldAlert',
    allowedPaths: ['/dashboard', '/dashboard/admin', '/dashboard/validador'],
  },
  administrativo: {
    id: 'administrativo',
    label: 'Administrativo',
    description: 'Gestión operativa del proceso: seguimiento de docentes, soporte y generación de reportes.',
    badgeColor: 'bg-gold-100 text-gold-800 border-gold-300',
    iconName: 'Settings',
    allowedPaths: ['/dashboard', '/dashboard/admin', '/dashboard/validador'],
  },
  validador: {
    id: 'validador',
    label: 'Validador',
    description: 'Revisión, aprobación y rechazo con comentario de los documentos radicados por los docentes.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'FileCheck',
    allowedPaths: ['/dashboard', '/dashboard/validador'],
  },
  docente: {
    id: 'docente',
    label: 'Docente',
    description: 'Carga y seguimiento de los 23 documentos requeridos para el proceso de posesión.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    iconName: 'GraduationCap',
    allowedPaths: [
      '/dashboard',
      '/dashboard/docente',
      '/dashboard/documentos',
    ],
  },
};

export const DEMO_ACCOUNTS: Array<Omit<User, 'createdAt'> & { passwordHint: string }> = [
  {
    id: 'demo-super-1',
    firstName: 'Carlos',
    lastName: 'Montoya',
    email: 'superusuario@sedmagdalena.gov.co',
    phoneNumber: '+57 310 555 0101',
    documentNumber: '1.082.111.222',
    role: 'super_usuario',
    passwordHint: 'Super123*',
  },
  {
    id: 'demo-admin-1',
    firstName: 'Patricia',
    lastName: 'Gómez',
    email: 'administrativo@sedmagdalena.gov.co',
    phoneNumber: '+57 312 444 0202',
    documentNumber: '1.082.333.444',
    role: 'administrativo',
    passwordHint: 'Admin123*',
  },
  {
    id: 'demo-validador-1',
    firstName: 'Andrea',
    lastName: 'Reales',
    email: 'validador@sedmagdalena.gov.co',
    phoneNumber: '+57 313 222 0505',
    documentNumber: '1.082.555.666',
    role: 'validador',
    passwordHint: 'Valida123*',
  },
  {
    id: 'demo-doc-1',
    firstName: 'Fernando',
    lastName: 'Silva Pacheco',
    email: 'docente@sedmagdalena.gov.co',
    phoneNumber: '+57 315 333 0303',
    documentNumber: '1.082.945.312',
    role: 'docente',
    passwordHint: 'Docente123*',
    document: {
      name: 'autorizacion_notificacion_electronica_ciudadano_digital.pdf',
      size: 750000,
      type: 'application/pdf',
      uploadedAt: '2026-03-01T14:10:00Z',
    },
  },
];
