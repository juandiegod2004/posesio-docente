'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/constants/roles';
import {
  FileCheck2,
  FolderOpen,
  LogOut,
  HelpCircle,
  ShieldAlert,
  FileCheck,
  GraduationCap,
} from 'lucide-react';
import { WelcomeModal } from '@/components/docente/WelcomeModal';
import { AuthorizationGateModal } from '@/components/docente/AuthorizationGateModal';
import { InformacionAdicionalGateModal } from '@/components/docente/InformacionAdicionalGateModal';
import { ChangePasswordGateModal } from '@/components/auth/ChangePasswordGateModal';
import { DashboardNotice } from '@/components/dashboard/DashboardNotice';
import { NotificationBell } from '@/components/dashboard/NotificationBell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const NAV_ITEMS = [
    ...(role === 'DOCENTE'
      ? [
          { name: 'Checklist de Documentos', href: '/dashboard/docente', icon: FileCheck2 },
          { name: 'Mis Documentos Radicados', href: '/dashboard/documentos', icon: FolderOpen },
        ]
      : []),
    ...(role === 'SAC' || role === 'TALENTO_HUMANO' || role === 'SUPER_USUARIO' || role === 'GESTOR_DOCUMENTAL'
      ? [
          {
            // Gestor Documental no valida nada: solo consulta docentes con documentación ya aprobada.
            name: role === 'GESTOR_DOCUMENTAL' ? 'Docentes Aprobados' : 'Validación Documental',
            href: '/dashboard/validador',
            icon: FileCheck,
          },
        ]
      : []),
    ...(role === 'SUPER_USUARIO'
      ? [{ name: 'Docentes', href: '/dashboard/docentes', icon: GraduationCap }]
      : []),
    ...(role === 'SUPER_USUARIO'
      ? [{ name: 'Administración', href: '/dashboard/admin', icon: ShieldAlert }]
      : []),
  ];

  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '--';

  return (
    <div className="min-h-screen flex bg-neutral-50 font-sans">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-neutral-200 sticky top-0 h-screen shrink-0">
        <div className="h-20 flex items-center gap-3 px-6 border-b border-neutral-100">
          <div className="w-9 h-9 relative flex-shrink-0">
            <Image
              src="/logo-secretaria-educacion.png"
              alt="Secretaría de Educación del Magdalena"
              width={36}
              height={36}
              priority
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-neutral-900 leading-tight truncate">
              Posesión Docente
            </div>
            <div className="text-[10px] text-neutral-400 font-medium truncate">SED Magdalena</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Panel
            </span>
            <div className="mt-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'bg-brand-700 text-white' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}

              {role === 'DOCENTE' && (
                <button
                  type="button"
                  onClick={() => setGuideModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-500 hover:text-brand-800 hover:bg-neutral-50 transition-all"
                >
                  <span className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <span>Instructivo de Posesión</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mx-4 mb-6 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-500 hover:text-red-700 hover:bg-red-50 transition-all"
        >
          <span className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-4 h-4" />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <Image
              src="/logo-secretaria-educacion.png"
              alt="Secretaría de Educación del Magdalena"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>

          <div className="min-w-0 hidden sm:block">
            <h1 className="text-lg font-bold text-neutral-900 truncate">
              Hola, {user ? user.firstName : 'bienvenido'}
            </h1>
            <p className="text-xs text-neutral-400 truncate">
              {role ? ROLES[role].description : ''}
            </p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-neutral-900">
                  {user ? `${user.firstName} ${user.lastName}` : '—'}
                </div>
                <div className="text-[10px] text-neutral-400">{role ? ROLES[role].label : ''}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile nav strip */}
        <div className="lg:hidden border-b border-neutral-200 px-4 py-2 flex items-center gap-2 bg-white overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-brand-700 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-neutral-500 whitespace-nowrap ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>

        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
      </div>

      <WelcomeModal isOpen={guideModalOpen} onClose={() => setGuideModalOpen(false)} />
      <Suspense fallback={null}>
        <DashboardNotice />
      </Suspense>

      {/* Cambio de contraseña obligatorio: aplica a cualquier rol y tiene prioridad sobre
          cualquier otro bloqueo (sin clave propia no tiene sentido pedir nada más). */}
      {user?.debeCambiarPassword ? (
        <ChangePasswordGateModal />
      ) : (
        role === 'DOCENTE' && user?.docenteId && (
          user.debeCompletarInformacionAdicional && !user.informacionAdicionalCompleta ? (
            <InformacionAdicionalGateModal docenteId={user.docenteId} />
          ) : user.authorizationDocumentRejected ? (
            <AuthorizationGateModal
              docenteId={user.docenteId}
              tipoDocumentoId={user.authorizationDocumentRejected.tipoDocumentoId}
              comentarioRechazo={user.authorizationDocumentRejected.comentario}
              estado="rechazado"
            />
          ) : (
            !user.registroCompletado &&
            user.tipoDocumentoAutorizacionId && (
              <AuthorizationGateModal
                docenteId={user.docenteId}
                tipoDocumentoId={user.tipoDocumentoAutorizacionId}
                comentarioRechazo={null}
                estado="pendiente_subir"
              />
            )
          )
        )
      )}
    </div>
  );
}
