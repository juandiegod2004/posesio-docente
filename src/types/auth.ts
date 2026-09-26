export type UserRole = 'super_usuario' | 'administrativo' | 'validador' | 'docente';

export interface UploadedDocument {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  documentNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  document?: UploadedDocument;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
