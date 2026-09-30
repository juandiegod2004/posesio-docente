import { UserRole } from '@/types/auth';

// Rutas relativas: next.config.ts reescribe /api/* hacia el backend, así el
// navegador nunca le habla directo (evita CORS y no expone el backend).
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error || `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

/** Tipo de posesión del aspirante: no confundir con `UserRole` — un ADMINISTRATIVO aquí sigue
 * teniendo `Usuario.rol === 'DOCENTE'` (mismos permisos), solo cambia la etiqueta del proceso. */
export type TipoPosesion = 'DOCENTE' | 'ADMINISTRATIVO';

/** Tipo de documento de identidad de la persona (registro). No confundir con `TipoDocumento`
 * (el catálogo de los ítems del checklist) ni con `tipoDocumentoAutorizacionId`. */
export type TipoDocumentoIdentidad =
  | 'CEDULA_CIUDADANIA'
  | 'CEDULA_EXTRANJERIA'
  | 'TARJETA_IDENTIDAD'
  | 'PASAPORTE'
  | 'PEP'
  | 'PPT';

export type EstadoCivil = 'SOLTERO' | 'CASADO' | 'UNION_LIBRE' | 'SEPARADO' | 'DIVORCIADO' | 'VIUDO';

export type TipoSangre =
  | 'O_POSITIVO'
  | 'O_NEGATIVO'
  | 'A_POSITIVO'
  | 'A_NEGATIVO'
  | 'B_POSITIVO'
  | 'B_NEGATIVO'
  | 'AB_POSITIVO'
  | 'AB_NEGATIVO';

export interface DocumentoAutorizacionRechazado {
  documentoId: string;
  tipoDocumentoId: string;
  comentario: string | null;
  actualizadoEn: string;
}

export interface BackendDocente {
  id: string;
  usuarioId: string;
  institucionEducativa: string | null;
  cargo: string | null;
  actoNombramientoNro: string | null;
  registroCompletado: boolean;
  tipoPosesion: TipoPosesion;
  /** true una vez el docente marcó su checklist completo y se notificó a los validadores. */
  documentacionFinalizada: boolean;
  documentacionFinalizadaEn?: string | null;
  /** id del TipoDocumento de la autorización de notificación electrónica; viene siempre,
   * exista o no todavía un Documento subido para ese tipo. */
  tipoDocumentoAutorizacionId?: string | null;
  /** No nulo solo si el documento de autorización de notificación electrónica (registro) fue RECHAZADO. */
  documentoAutorizacionRechazado?: DocumentoAutorizacionRechazado | null;
  /** true si la autorización de notificación electrónica ya se subió (EN_REVISION) pero un
   * validador todavía no la aprueba ni la rechaza. Mientras sea true, el docente sigue
   * bloqueado (no puede subir otros documentos) pero no tiene ninguna acción pendiente:
   * solo debe esperar. Mutuamente excluyente con `documentoAutorizacionRechazado` y con
   * "nunca la subió" mientras `registroCompletado` sea false. */
  documentoAutorizacionPendiente: boolean;
  /** true si este docente debe completar el formulario de información adicional antes de
   * poder subir cualquier documento. Los docentes registrados antes de esta feature siempre
   * tienen `false` acá (nunca ven el gate). */
  debeCompletarInformacionAdicional: boolean;
  /** true una vez completó PATCH /api/docentes/:id/informacion-adicional. */
  informacionAdicionalCompleta: boolean;
}

export interface BackendUsuario {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  rol: UserRole;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  /** true si el Super Usuario le restableció la clave con una temporal: debe cambiarla antes de seguir usando la cuenta. */
  debeCambiarPassword: boolean;
  docente?: BackendDocente | null;
}

export interface TipoDocumento {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  esRequisitoRegistro: boolean;
  orden: number;
}

/** GET /api/auth/me — perfil del usuario autenticado (rol incluido). */
export async function fetchMe(accessToken: string): Promise<BackendUsuario> {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface RegistroDocentePayload {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
  tipoPosesion: TipoPosesion;
  tipoDocumento: TipoDocumentoIdentidad;
}

/**
 * POST /api/auth/registro — auto-registro de un docente. No requiere token.
 * No inicia sesión automáticamente: el docente debe loguearse manualmente después
 * (evita que el formulario de registro necesite su propio widget de Turnstile).
 * El documento de autorización de notificación electrónica ya no se sube aquí:
 * se sube como cualquier otro ítem del checklist, tras el primer login.
 */
export async function registrarDocente(
  payload: RegistroDocentePayload
): Promise<{ usuario: BackendUsuario }> {
  const res = await fetch('/api/auth/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface DocenteResumen {
  id: string;
  usuario: {
    id: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string | null;
    debeCambiarPassword: boolean;
    activo: boolean;
  };
  registroCompletado: boolean;
  tipoPosesion: TipoPosesion;
  documentacionFinalizada: boolean;
  documentosSubidos: number;
  documentosAprobados: number;
  documentosRechazados: number;
}

/** GET /api/docentes — lista todos los docentes con un resumen de avance. */
export async function fetchDocentes(accessToken: string): Promise<DocenteResumen[]> {
  const res = await fetch('/api/docentes', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** PATCH /api/docentes/:id/finalizar — el propio docente marca su checklist como completo
 * y dispara la notificación a validadores/staff. 400 si aún falta algún documento por subir. */
export async function finalizarDocumentacion(accessToken: string, docenteId: string): Promise<void> {
  const res = await fetch(`/api/docentes/${docenteId}/finalizar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
}

export interface InformacionAdicionalPayload {
  sexo: 'MASCULINO' | 'FEMENINO';
  /** ISO 8601. */
  fechaNacimiento: string;
  paisNacimiento: string;
  /** Solo obligatorios (el backend los exige) si `paisNacimiento === "Colombia"`. */
  departamentoNacimientoId?: string;
  ciudadNacimientoId?: string;
  cantidadHijos: number;
  /** ISO 8601. */
  fechaExpedicionCedula: string;
  departamentoExpedicionId: string;
  ciudadExpedicionId: string;
  /** Opcionales para el backend, pero el frontend los exige igual (decisión de producto). */
  estadoCivil: EstadoCivil;
  tipoSangre: TipoSangre;
  direccion: string;
}

/** PATCH /api/docentes/:id/informacion-adicional — completa el paso obligatorio de datos
 * personales que desbloquea la carga de documentos. Repetible: el propio docente puede
 * corregir estos datos siempre que el backend lo permita (idempotente para nuestro caso). */
export async function completarInformacionAdicional(
  accessToken: string,
  docenteId: string,
  payload: InformacionAdicionalPayload
): Promise<BackendDocente> {
  const res = await fetch(`/api/docentes/${docenteId}/informacion-adicional`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface DocentePerfilCompleto {
  id: string;
  usuarioId: string;
  registroCompletado: boolean;
  tipoPosesion: TipoPosesion;
  documentacionFinalizada: boolean;
  documentacionFinalizadaEn: string | null;
  documentacionAprobada: boolean;
  documentacionAprobadaEn: string | null;
  debeCompletarInformacionAdicional: boolean;
  informacionAdicionalCompleta: boolean;
  sexo: 'MASCULINO' | 'FEMENINO' | null;
  /** ISO 8601. null si aún no completó información adicional. */
  fechaNacimiento: string | null;
  paisNacimiento: string | null;
  departamentoNacimientoId: string | null;
  ciudadNacimientoId: string | null;
  cantidadHijos: number | null;
  /** ISO 8601. null si aún no completó información adicional. */
  fechaExpedicionCedula: string | null;
  departamentoExpedicionId: string | null;
  ciudadExpedicionId: string | null;
  estadoCivil: EstadoCivil | null;
  tipoSangre: TipoSangre | null;
  direccion: string | null;
  createdAt: string;
  updatedAt: string;
  usuario: {
    id: string;
    cedula: string;
    tipoDocumento: TipoDocumentoIdentidad;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string | null;
  };
  departamentoNacimiento: { id: string; nombre: string } | null;
  ciudadNacimiento: { id: string; nombre: string } | null;
  departamentoExpedicion: { id: string; nombre: string } | null;
  ciudadExpedicion: { id: string; nombre: string } | null;
}

/** GET /api/docentes/:id — perfil completo del docente (datos de registro + información
 * adicional). Acceso: el propio docente, SAC/Talento Humano/Super Usuario sin restricción, o Gestor
 * Documental solo si `documentacionAprobada: true` (403 si no). */
export async function fetchDocentePerfil(accessToken: string, docenteId: string): Promise<DocentePerfilCompleto> {
  const res = await fetch(`/api/docentes/${docenteId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface NotificacionBackend {
  id: string;
  tipo: string;
  canal: 'IN_APP' | 'EMAIL';
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

/** GET /api/notificaciones — las notificaciones in-app del usuario autenticado (más recientes primero). */
export async function fetchNotificaciones(accessToken: string): Promise<NotificacionBackend[]> {
  const res = await fetch('/api/notificaciones', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** PATCH /api/notificaciones/:id/leida — marca una notificación como leída. */
export async function marcarNotificacionLeida(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`/api/notificaciones/${id}/leida`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
}

export interface ChecklistDocumentoBackend {
  id: string;
  estado: EstadoDocumento;
  comentarioValidador: string | null;
  subidoEn: string;
  archivoNombre?: string;
  /** Última validación registrada (puede no coincidir con `estado` si el docente resubió tras un rechazo). */
  validadoPor: { nombres: string; apellidos: string } | null;
  validadoEn: string | null;
}

export interface ChecklistItemBackend {
  tipoDocumentoId: string;
  codigo: string;
  nombre: string;
  obligatorio: boolean;
  documento: ChecklistDocumentoBackend | null;
}

/** GET /api/docentes/:id/checklist — todos los tipos de documento (incluida la autorización de
 * registro) con el documento real del docente, o null si no ha subido nada. */
export async function fetchChecklist(
  accessToken: string,
  docenteId: string
): Promise<{ docenteId: string; checklist: ChecklistItemBackend[] }> {
  const res = await fetch(`/api/docentes/${docenteId}/checklist`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** GET /api/usuarios — personal interno (SAC/Talento Humano/Gestor Documental/Super Usuario). Solo SUPER_USUARIO. */
export async function fetchUsuariosStaff(accessToken: string): Promise<BackendUsuario[]> {
  const res = await fetch('/api/usuarios', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface CrearUsuarioStaffPayload {
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  telefono?: string;
  rol: 'SAC' | 'TALENTO_HUMANO' | 'GESTOR_DOCUMENTAL' | 'SUPER_USUARIO';
}

/** POST /api/usuarios — crea una cuenta de personal interno. Solo SUPER_USUARIO. */
export async function crearUsuarioStaff(
  accessToken: string,
  payload: CrearUsuarioStaffPayload
): Promise<{ usuario: BackendUsuario }> {
  const res = await fetch('/api/usuarios', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** PATCH /api/usuarios/:id/activo — activa o desactiva una cuenta de personal interno. */
export async function actualizarActivoUsuario(
  accessToken: string,
  id: string,
  activo: boolean
): Promise<BackendUsuario> {
  const res = await fetch(`/api/usuarios/${id}/activo`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/**
 * PATCH /api/usuarios/:id/clave — Solo Super Usuario. Restablece la clave de CUALQUIER
 * usuario (staff o docente, usando su `usuario.id`, no el `docenteId`) a una temporal
 * generada por el backend, y lo marca con `debeCambiarPassword: true`. Devuelve esa clave
 * temporal para que el Super Usuario se la comunique al usuario fuera de la plataforma.
 */
export async function restablecerPasswordUsuario(
  accessToken: string,
  usuarioId: string
): Promise<{ passwordTemporal: string }> {
  const res = await fetch(`/api/usuarios/${usuarioId}/clave`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** POST /api/auth/cambiar-password — el usuario autenticado cambia su propia contraseña
 * (obligatorio cuando `debeCambiarPassword` es true, o voluntario). */
export async function cambiarPassword(accessToken: string, passwordNueva: string): Promise<void> {
  const res = await fetch('/api/auth/cambiar-password', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ passwordNueva }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
}

/** GET /backend-health — reescrito hacia GET /health del backend (sin auth). */
export async function fetchBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('/backend-health', { cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

/** GET /api/tipos-documento — catálogo completo (incluye el de registro). */
export async function fetchTiposDocumento(accessToken: string): Promise<TipoDocumento[]> {
  const res = await fetch('/api/tipos-documento', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export interface Departamento {
  id: string;
  codigoDivipola: string;
  nombre: string;
}

export interface Ciudad {
  id: string;
  codigoDivipola: string;
  nombre: string;
  departamentoId: string;
}

/** GET /api/catalogos/paises — lista de nombres de país para el select de nacimiento. */
export async function fetchPaises(accessToken: string): Promise<string[]> {
  const res = await fetch('/api/catalogos/paises', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** GET /api/catalogos/departamentos — los 32 departamentos + Bogotá D.C. (datos DANE). */
export async function fetchDepartamentos(accessToken: string): Promise<Departamento[]> {
  const res = await fetch('/api/catalogos/departamentos', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** GET /api/catalogos/ciudades — sin `departamentoId` trae las 1123; con él, filtra el select
 * en cascada de ciudad por el departamento elegido. */
export async function fetchCiudades(accessToken: string, departamentoId?: string): Promise<Ciudad[]> {
  const search = new URLSearchParams();
  if (departamentoId) search.set('departamentoId', departamentoId);
  const query = search.toString();

  const res = await fetch(`/api/catalogos/ciudades${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

export type EstadoDocumento = 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'ARCHIVO_ELIMINADO';

export interface DocumentoListItem {
  id: string;
  estado: EstadoDocumento;
  archivoNombre: string;
  comentarioValidador: string | null;
  subidoEn: string;
  docente: { id: string; cedula: string; nombres: string; apellidos: string };
  tipoDocumento: { id: string; codigo: string; nombre: string; orden: number };
  /** Última validación registrada (puede no coincidir con `estado` si el docente resubió tras un rechazo). */
  validadoPor: { nombres: string; apellidos: string } | null;
  validadoEn: string | null;
}

/** GET /api/documentos — bandeja de validación: todos los docentes/documentos. */
export async function fetchDocumentos(
  accessToken: string,
  params?: { estado?: EstadoDocumento; q?: string }
): Promise<DocumentoListItem[]> {
  const search = new URLSearchParams();
  if (params?.estado) search.set('estado', params.estado);
  if (params?.q) search.set('q', params.q);
  const query = search.toString();

  const res = await fetch(`/api/documentos${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** GET /api/documentos/:id/url — URL firmada temporal (10 min) para ver/descargar el archivo. */
export async function fetchDocumentoUrl(accessToken: string, id: string): Promise<string> {
  const res = await fetch(`/api/documentos/${id}/url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  const { url } = await res.json();
  return url;
}

/** GET /api/docentes/:id/descargar — .zip con todos los documentos APROBADOS del docente
 * (respaldo interno). 404 si todavía no tiene ninguno aprobado. */
export async function descargarDocumentosAprobados(
  accessToken: string,
  docenteId: string
): Promise<{ blob: Blob; fileName: string }> {
  const res = await fetch(`/api/docentes/${docenteId}/descargar`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const fileName = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? `${docenteId}.zip`;
  const blob = await res.blob();
  return { blob, fileName };
}

/** PATCH /api/documentos/:id/validar — aprueba o rechaza un documento. SAC solo puede validar
 * la autorización de notificación electrónica; Talento Humano el resto del checklist; Super
 * Usuario cualquiera (403 si el rol no corresponde al tipo de documento). */
export async function validarDocumento(
  accessToken: string,
  id: string,
  body: { estado: 'APROBADO' | 'RECHAZADO'; comentario?: string }
): Promise<DocumentoListItem> {
  const res = await fetch(`/api/documentos/${id}/validar`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}

/** POST /api/documentos — sube (o resube) el archivo de un tipo de documento del checklist. */
export async function subirDocumento(
  accessToken: string,
  params: { docenteId: string; tipoDocumentoId: string; file: File | Blob; fileName: string }
): Promise<unknown> {
  const formData = new FormData();
  formData.append('docenteId', params.docenteId);
  formData.append('tipoDocumentoId', params.tipoDocumentoId);
  formData.append('archivo', params.file, params.fileName);

  const res = await fetch('/api/documentos', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorMessage(res));
  return res.json();
}
