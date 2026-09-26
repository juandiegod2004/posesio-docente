'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '@/types/auth';
import { LoginFormData, SignupFormData } from '@/lib/validations/auth';
import { DEMO_ACCOUNTS } from '@/lib/constants/roles';
import { setCookie, getCookie, removeCookie } from '@/lib/auth/cookies';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  loginWithDemo: (email: string) => Promise<boolean>;
  signup: (data: SignupFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'posesion_docente_sed_magdalena_session';
const REGISTERED_USERS_KEY = 'posesion_docente_sed_magdalena_users';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage & cookies
  useEffect(() => {
    try {
      // Check stored custom users or seed with DEMO_ACCOUNTS
      const storedUsersRaw = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!storedUsersRaw) {
        const initialUsers: User[] = DEMO_ACCOUNTS.map((acc) => ({
          ...acc,
          createdAt: new Date().toISOString(),
        }));
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initialUsers));
      }

      // Check active session
      const storedSession = localStorage.getItem(STORAGE_KEY);
      const cookieRole = getCookie('auth_role');

      if (storedSession) {
        const parsed = JSON.parse(storedSession) as User;
        setUser(parsed);
        setCookie('auth_token', parsed.id);
        setCookie('auth_role', parsed.role);
      } else if (cookieRole) {
        // Fallback to demo account matching cookie
        const matched = DEMO_ACCOUNTS.find((d) => d.role === cookieRole);
        if (matched) {
          const u: User = { ...matched, createdAt: new Date().toISOString() };
          setUser(u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        }
      }
    } catch (err) {
      console.error('Error initializing auth session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginFormData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600)); // Smooth UX transition

    try {
      const storedUsersRaw = localStorage.getItem(REGISTERED_USERS_KEY);
      const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      // Find user by email
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === data.email.toLowerCase().trim()
      );

      if (!foundUser) {
        // Allow demo accounts or create fallback session
        const demo = DEMO_ACCOUNTS.find(
          (d) => d.email.toLowerCase() === data.email.toLowerCase().trim()
        );
        if (demo) {
          const loggedUser: User = { ...demo, createdAt: new Date().toISOString() };
          setUser(loggedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
          setCookie('auth_token', loggedUser.id);
          setCookie('auth_role', loggedUser.role);
          setIsLoading(false);
          return { success: true };
        }

        // If email not found in mock store, for demo convenience we notify
        setIsLoading(false);
        return {
          success: false,
          error: 'No encontramos ninguna cuenta con este correo institucional. Puedes usar una de las cuentas de prueba o registrarte.',
        };
      }

      setUser(foundUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(foundUser));
      setCookie('auth_token', foundUser.id);
      setCookie('auth_role', foundUser.role);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Ocurrió un error inesperado al iniciar sesión.' };
    }
  };

  const loginWithDemo = async (email: string): Promise<boolean> => {
    const demo = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === email.toLowerCase());
    if (!demo) return false;

    const loggedUser: User = { ...demo, createdAt: new Date().toISOString() };
    setUser(loggedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
    setCookie('auth_token', loggedUser.id);
    setCookie('auth_role', loggedUser.role);
    return true;
  };

  const signup = async (data: SignupFormData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // Validate that signed document is present (defense in depth)
      if (!data.signedDocument) {
        setIsLoading(false);
        return {
          success: false,
          error: 'La autorización de notificación electrónica firmada vía Ciudadano Digital es estrictamente obligatoria para completar el registro.',
        };
      }

      const storedUsersRaw = localStorage.getItem(REGISTERED_USERS_KEY);
      const users: User[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      const existsByEmail = users.some(
        (u) => u.email.toLowerCase() === data.email.toLowerCase().trim()
      );
      if (existsByEmail) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Ya existe una cuenta registrada con este correo electrónico.',
        };
      }

      const existsByDocument = users.some(
        (u) => u.documentNumber && u.documentNumber.replace(/\D/g, '') === data.documentNumber.replace(/\D/g, '')
      );
      if (existsByDocument) {
        setIsLoading(false);
        return {
          success: false,
          error: 'Ya existe un registro asociado a este número de cédula. Cada docente solo puede registrarse una vez.',
        };
      }

      const newUser: User = {
        id: `user-${Date.now()}`,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        phoneNumber: data.phoneNumber?.trim(),
        documentNumber: data.documentNumber?.trim(),
        role: 'docente',
        document: data.signedDocument,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));

      // Auto login newly registered user
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      setCookie('auth_token', newUser.id);
      setCookie('auth_role', newUser.role);

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Error al procesar el registro de usuario.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    removeCookie('auth_token');
    removeCookie('auth_role');
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCookie('auth_role', newRole);
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsLoading(false);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithDemo,
        signup,
        logout,
        switchRole,
        resetPassword,
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
