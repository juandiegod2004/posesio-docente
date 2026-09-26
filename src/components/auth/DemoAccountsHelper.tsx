'use client';

import React, { useState } from 'react';
import { DEMO_ACCOUNTS, ROLES } from '@/lib/constants/roles';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface DemoAccountsHelperProps {
  onSelectAccount: (email: string, passwordHint: string) => void;
}

export function DemoAccountsHelper({ onSelectAccount }: DemoAccountsHelperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-4 border border-brand-100 bg-brand-50/50 rounded-lg p-3 text-xs text-neutral-700 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-semibold text-brand-900 focus:outline-none"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Cuentas de demostración por rol (acceso rápido)</span>
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 pt-2 border-t border-brand-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fadeIn">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelectAccount(acc.email, acc.passwordHint)}
              className="text-left p-2 rounded-md bg-white border border-neutral-200 hover:border-brand-400 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-neutral-800 text-xs">
                  {ROLES[acc.role].label}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                  {acc.passwordHint}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 truncate mt-1">
                {acc.email}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
