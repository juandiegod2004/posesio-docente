import { UserRole } from '@/types/auth';

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  iconName: string;
  /** Rutas de /dashboard a las que este rol tiene acceso. */
  allowedPaths: string[];
  /** A dónde se redirige a este rol al entrar a /dashboard o a una sección que no le corresponde. */
  homePath: string;
  /** Puede aprobar/rechazar documentos (PATCH /api/documentos/:id/validar solo lo permite el backend a estos roles). */
  canValidateDocuments: boolean;
}

export const ROLES: Record<UserRole, RoleConfig> = {
  SUPER_USUARIO: {
    id: 'SUPER_USUARIO',
    label: 'Super Usuario',
    description: 'Control total del sistema: usuarios, roles, auditoría y métricas globales del proceso de posesión.',
    badgeColor: 'bg-brand-100 text-brand-900 border-brand-300',
    iconName: 'ShieldAlert',
    allowedPaths: ['/dashboard', '/dashboard/admin', '/dashboard/validador', '/dashboard/docentes'],
    homePath: '/dashboard/admin',
    canValidateDocuments: true,
  },
  SAC: {
    id: 'SAC',
    label: 'SAC',
    description:
      'Valida exclusivamente la autorización de notificación electrónica, sin acceso al resto del perfil ni checklist del docente.',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    iconName: 'FileCheck',
    allowedPaths: ['/dashboard', '/dashboard/validador'],
    homePath: '/dashboard/validador',
    canValidateDocuments: true,
  },
  TALENTO_HUMANO: {
    id: 'TALENTO_HUMANO',
    label: 'Talento Humano',
    description:
      'Revisión, aprobación y rechazo con comentario de los 24 documentos del checklist de posesión (no incluye la autorización de notificación electrónica).',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    iconName: 'FileCheck',
    allowedPaths: ['/dashboard', '/dashboard/validador'],
    homePath: '/dashboard/validador',
    canValidateDocuments: true,
  },
  GESTOR_DOCUMENTAL: {
    id: 'GESTOR_DOCUMENTAL',
    label: 'Gestor Documental',
    description:
      'Consulta el perfil y los documentos de docentes con su checklist aprobado, y sube/valida exclusivamente el acta de posesión.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    iconName: 'FileCheck',
    allowedPaths: ['/dashboard', '/dashboard/validador'],
    homePath: '/dashboard/validador',
    canValidateDocuments: true,
  },
  DOCENTE: {
    id: 'DOCENTE',
    label: 'Docente',
    description: 'Carga y seguimiento de los documentos requeridos para el proceso de posesión.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    iconName: 'GraduationCap',
    allowedPaths: [
      '/dashboard',
      '/dashboard/docente',
      '/dashboard/documentos',
    ],
    homePath: '/dashboard/docente',
    canValidateDocuments: false,
  },
};

/**
 * Cada rol de staff valida solo su carril del checklist, por `codigo` del tipo de documento:
 * SAC exclusivamente la autorización de notificación electrónica (y no tiene acceso a nada
 * más del docente — ni perfil, ni el resto del checklist); Gestor Documental exclusivamente
 * el acta de posesión; Talento Humano el resto (los otros 23). Super Usuario no tiene esta
 * restricción. El backend aplica la misma regla en `PATCH /api/documentos/:id/validar` (403
 * si el rol no corresponde) — esto es solo para mostrar/ocultar el botón en la UI, no
 * reemplaza esa validación.
 */
export function puedeValidarDocumento(role: UserRole | null, codigo: string): boolean {
  if (role === 'SUPER_USUARIO') return true;
  if (codigo === 'AUTORIZACION_NOTIFICACION_ELECTRONICA') return role === 'SAC';
  if (codigo === 'ACTA_DE_POSESION') return role === 'GESTOR_DOCUMENTAL';
  return role === 'TALENTO_HUMANO';
}
