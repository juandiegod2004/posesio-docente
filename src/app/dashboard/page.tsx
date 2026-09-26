'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_ROUTE_BY_ROLE: Record<string, string> = {
  docente: '/dashboard/docente',
  validador: '/dashboard/validador',
  administrativo: '/dashboard/admin',
  super_usuario: '/dashboard/admin',
};

export default function DashboardRootPage() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(role ? DEFAULT_ROUTE_BY_ROLE[role] || '/dashboard/docente' : '/login');
  }, [role, isLoading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
