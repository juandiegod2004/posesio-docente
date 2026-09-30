export type DocumentStatus = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export interface ChecklistDocumentItem {
  id: number;
  /** Código del tipo de documento en el backend (TipoDocumento.codigo), une el contenido estático con el dato real. */
  codigo: string;
  /** id real del TipoDocumento en el backend, requerido para subir/resubir el archivo. */
  tipoDocumentoId?: string;
  /** id real del Documento en el backend, requerido para ver el archivo radicado. */
  documentoId?: string;
  title: string;
  shortDescription?: string;
  instructions: string;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  validatorComment?: string;
  /** El archivo fue borrado directo del almacenamiento (no por un rechazo normal): exige resubir, pero ya no se puede ver. */
  archivoEliminado?: boolean;
  specialNote?: string;
  category?: 'registro' | 'financiero' | 'legal' | 'seguridad_social' | 'antecedentes' | 'academico' | 'nombramiento';
}

export interface DocenteProfile {
  fullName: string;
  documentNumber: string;
  documentType: string;
  email: string;
  phone: string;
  position: string;
  decreeNumber?: string;
}
