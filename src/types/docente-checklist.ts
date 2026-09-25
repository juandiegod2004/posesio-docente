export type DocumentStatus = 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado';

export interface ChecklistDocumentItem {
  id: number;
  title: string;
  shortDescription?: string;
  instructions: string;
  status: DocumentStatus;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  dataUrl?: string;
  uploadedAt?: string;
  validatorComment?: string;
  specialNote?: string;
  category?: 'financiero' | 'legal' | 'seguridad_social' | 'antecedentes' | 'academico' | 'nombramiento';
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
