'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';

const NOTICE_MESSAGES: Record<string, string> = {
  forbidden: 'No tienes acceso a esa sección. Te llevamos a tu panel.',
  'session-error': 'No pudimos verificar tu sesión. Inicia sesión de nuevo.',
};

export function DashboardNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const notice = searchParams.get('notice');
    if (!notice) return;

    setMessage(NOTICE_MESSAGES[notice] || null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('notice');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-amber-50 border border-amber-300 text-amber-900 rounded-xl shadow-lg p-3.5 flex items-start gap-2.5 animate-fadeIn">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-xs font-medium flex-1">{message}</p>
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="text-amber-500 hover:text-amber-800 flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
