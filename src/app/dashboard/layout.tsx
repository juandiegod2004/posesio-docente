'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FileCheck2,
  FolderOpen,
  FileText,
  LogOut,
  HelpCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { WelcomeModal } from '@/components/docente/WelcomeModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // The navbar ONLY contains what pertains to the teacher uploading and verifying their documents
  const NAV_ITEMS = [
    {
      name: 'Checklist de Documentos (23)',
      href: '/dashboard/docente',
      icon: FileCheck2,
    },
    {
      name: 'Mis Documentos Radicados',
      href: '/dashboard/documentos',
      icon: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100/90 flex flex-col font-sans">
      {/* Top Header - Institutional and focused exclusively on Docente Document Submission */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3.5">
            <Link href="/dashboard/docente" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 relative flex-shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/logo-secretaria-educacion.png"
                  alt="Secretaría de Educación del Magdalena"
                  width={44}
                  height={44}
                  priority
                  className="object-contain"
                />
              </div>
              <div className="border-l border-neutral-200 pl-3.5 hidden sm:block">
                <div className="text-sm font-extrabold text-neutral-900 group-hover:text-blue-700 transition-colors tracking-tight">
                  Secretaría de Educación del Magdalena
                </div>
                <div className="text-[11px] text-blue-700 font-semibold tracking-wide flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Portal de Validación Documental y Posesión Docente</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links directly in header (Only document-related links) */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard/docente');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setGuideModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Instructivo de Posesión</span>
            </button>
          </nav>

          {/* Docente User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-bold text-neutral-900">
                {user ? `${user.firstName} ${user.lastName}` : 'Lic. Fernando Silva Pacheco'}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                C.C. 1.082.945.312 • Docente Aspirante
              </span>
            </div>

            <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
              En Posesión
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-semibold text-neutral-600 hover:text-red-700 hover:bg-red-50 rounded-xl border border-neutral-200 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-neutral-100 px-4 py-2 flex items-center justify-around bg-neutral-50 text-xs">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === '/dashboard' && item.href === '/dashboard/docente');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg font-bold ${
                  isActive ? 'bg-blue-700 text-white shadow-xs' : 'text-neutral-600'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setGuideModalOpen(true)}
            className="flex items-center gap-1 py-1.5 px-2 text-neutral-600 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Ayuda</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Guide / Onboarding Modal accessible from Navbar */}
      <WelcomeModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
    </div>
  );
}
