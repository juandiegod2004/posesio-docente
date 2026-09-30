'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@/types/auth';
import { LoginFormData, SignupFormData } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { ApiError, BackendUsuario, cambiarPassword as cambiarPasswordApi, fetchMe, registrarDocente } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: User['role'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData, captchaToken?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Cambia la contraseña del usuario autenticado (obligatorio si debeCambiarPassword=true, o voluntario). */
  cambiarPassword: (passwordNueva: string) => Promise<{ success: boolean; error?: string }>;
  /** Token del usuario autenticado, para llamar al backend directamente desde una página. */
  getAccessToken: () => Promise<string | null>;
  /** Vuelve a pedir /api/auth/me y actualiza el usuario en memoria (ej. tras subir un documento). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapBackendUsuario(usuario: BackendUsuario): User {
  return {
    id: usuario.id,
    firstName: usuario.nombres,
    lastName: usuario.apellidos,
    email: usuario.email,
    phoneNumber: usuario.telefono ?? undefined,
    documentNumber: usuario.cedula,
    role: usuario.rol,
    createdAt: usuario.createdAt,
    debeCambiarPassword: usuario.debeCambiarPassword,
    docenteId: usuario.docente?.id,
    registroCompletado: usuario.docente?.registroCompletado,
    tipoPosesion: usuario.docente?.tipoPosesion,
    documentacionFinalizada: usuario.docente?.documentacionFinalizada,
    debeCompletarInformacionAdicional: usuario.docente?.debeCompletarInformacionAdicional,
    informacionAdicionalCompleta: usuario.docente?.informacionAdicionalCompleta,
    tipoDocumentoAutorizacionId: usuario.docente?.tipoDocumentoAutorizacionId ?? null,
    authorizationDocumentRejected: usuario.docente?.documentoAutorizacionRechazado ?? null,
    authorizationDocumentPendiente: usuario.docente?.documentoAutorizacionPendiente,
  };
}

function mapAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'Correo o contraseña incorrectos.';
  }
  if (/user is banned|user_banned/i.test(message)) {
    return 'Tu cuenta ha sido desactivada. Comunícate con el área de Servicios Informáticos para más información.';
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        try {
          const usuario = await fetchMe(session.access_token);
          setUser(mapBackendUsuario(usuario));
        } catch (err) {
          console.error('Error cargando el perfil del usuario:', err);
          // El backend rechazó el token (cuenta desactivada, token corrupto, etc.):
          // cerramos la sesión local para no repetir este error en cada carga.
          await supabase.auth.signOut();
        }
      }
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const login = async (
    data: LoginFormData,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const supabase = supabaseRef.current;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
      options: captchaToken ? { captchaToken } : undefined,
    });

    if (error || !authData.session) {
      setIsLoading(false);
      return { success: false, error: mapAuthError(error?.message || 'No se pudo iniciar sesión.') };
    }

    try {
      const usuario = await fetchMe(authData.session.access_token);
      setUser(mapBackendUsuario(usuario));
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      await supabase.auth.signOut();
      const message = err instanceof ApiError ? err.message : 'No se pudo cargar tu perfil.';
      return { success: false, error: message };
    }
  };

  // No inicia sesión automáticamente: el docente se loguea manualmente después
  // (así el formulario de registro no necesita su propio widget de Turnstile).
  // El documento de autorización ya no se sube aquí, se sube como cualquier otro
  // ítem del checklist tras el primer login.
  const signup = async (data: SignupFormData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await registrarDocente({
        cedula: data.documentNumber.replace(/\D/g, ''),
        nombres: data.firstName.trim(),
        apellidos: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        telefono: data.phoneNumber?.trim() || undefined,
        tipoPosesion: data.tipoPosesion,
        tipoDocumento: data.tipoDocumento,
      });
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      const message =
        err instanceof ApiError
          ? err.status === 409
            ? 'Ya existe una cuenta registrada con esta cédula o correo electrónico.'
            : err.message
          : err instanceof Error
          ? err.message
          : 'Ocurrió un error al procesar el registro.';
      return { success: false, error: message };
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabaseRef.current.auth.getSession();
    return session?.access_token ?? null;
  };

  const refreshUser = async (): Promise<void> => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const usuario = await fetchMe(token);
      setUser(mapBackendUsuario(usuario));
    } catch (err) {
      console.error('Error actualizando el perfil del usuario:', err);
    }
  };

  const logout = () => {
    setUser(null);
    supabaseRef.current.auth.signOut();
  };

  // Cambiar la contraseña invalida la sesión actual (Supabase revoca sus tokens), así que no
  // tiene sentido intentar refrescar el usuario con el mismo access token: cerramos sesión
  // localmente y el usuario vuelve a loguearse ya con la contraseña nueva.
  const cambiarPassword = async (passwordNueva: string): Promise<{ success: boolean; error?: string }> => {
    const token = await getAccessToken();
    if (!token) return { success: false, error: 'No se pudo validar tu sesión. Recarga la página e intenta de nuevo.' };
    try {
      await cambiarPasswordApi(token, passwordNueva);
      setUser(null);
      await supabaseRef.current.auth.signOut();
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        cambiarPassword,
        getAccessToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
