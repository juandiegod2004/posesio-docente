export type UserRole = 'SUPER_USUARIO' | 'SAC' | 'TALENTO_HUMANO' | 'DOCENTE' | 'GESTOR_DOCUMENTAL';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  documentNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  /** true si un Super Usuario le restableció la clave con una temporal: aplica a cualquier rol. */
  debeCambiarPassword: boolean;
  /** Presente solo si el usuario es DOCENTE; id de su registro Docente en el backend. */
  docenteId?: string;
  registroCompletado?: boolean;
  tipoPosesion?: 'DOCENTE' | 'ADMINISTRATIVO';
  /** true una vez el docente marcó su checklist completo y se notificó a los validadores. */
  documentacionFinalizada?: boolean;
  /** true si debe completar el formulario de información adicional antes de subir documentos.
   * Los docentes registrados antes de esta feature siempre tienen `false` (nunca ven el gate). */
  debeCompletarInformacionAdicional?: boolean;
  /** true una vez completó PATCH /api/docentes/:id/informacion-adicional. */
  informacionAdicionalCompleta?: boolean;
  /** id del TipoDocumento de la autorización de notificación electrónica, para poder subirla
   * (sea la primera vez o al corregir un rechazo) sin depender de que ya exista un Documento. */
  tipoDocumentoAutorizacionId?: string | null;
  /** No nulo si el documento de autorización de notificación electrónica (el del registro) fue rechazado y debe resubirse. */
  authorizationDocumentRejected?: {
    documentoId: string;
    tipoDocumentoId: string;
    comentario: string | null;
    actualizadoEn: string;
  } | null;
  /** true si ya subió la autorización (EN_REVISION) pero un validador aún no la aprueba ni
   * la rechaza. Puramente informativo: subirla ya desbloqueó el resto del checklist, este
   * campo no se usa para bloquear nada. */
  authorizationDocumentPendiente?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
