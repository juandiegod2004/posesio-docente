'use client';

import React from 'react';
import { LogoSeal } from '@/components/ui/LogoSeal';
import { DOCENTE_UPLOAD_ITEMS } from '@/lib/constants/docente-documents';
import { ShieldCheck } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  contentClassName?: string;
}

const STEPS = [
  { n: 1, text: 'Regístrate con tus datos básicos' },
  { n: 2, text: `Inicia sesión y sube los ${DOCENTE_UPLOAD_ITEMS} documentos requeridos para tu posesión` },
  { n: 3, text: 'Sigue cada validación y corrige si el auditor lo solicita' },
];

export function AuthShell({ children, contentClassName = 'max-w-md' }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Institutional hero panel */}
      <div className="relative lg:w-[44%] xl:w-[40%] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white flex flex-col justify-between overflow-hidden px-8 py-10 sm:px-12 sm:py-12">
        <div className="absolute inset-0 bg-brand-dots text-white/[0.06] pointer-events-none" />
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 bottom-0 w-64 h-64 rounded-full bg-brand-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2 text-[11px] font-bold text-brand-100 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-gold-400" />
          <span>Secretaría de Educación del Magdalena</span>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center gap-6 py-10">
          <LogoSeal size={180} className="max-w-[150px] sm:max-w-[180px]" />
          <div className="space-y-2.5">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight leading-tight">
              Portal de Posesión Docente
            </h2>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 text-[11px] text-brand-100/85">
          {STEPS.map((step) => (
            <div key={step.n} className="border-t border-white/15 pt-3">
              <span className="block text-gold-300 font-bold text-base mb-1">{step.n}</span>
              {step.text}
            </div>
          ))}
        </div>
      </div>

      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16">
        <div className={`w-full ${contentClassName}`}>{children}</div>
      </div>
    </div>
  );
}
