'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApiError, NotificacionBackend, fetchNotificaciones, marcarNotificacionLeida } from '@/lib/api';

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function NotificationBell() {
  const { getAccessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionBackend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const load = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      setNotificaciones(await fetchNotificaciones(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las notificaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const handleMarkRead = async (id: string) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    const token = await getAccessToken();
    if (!token) return;
    try {
      await marcarNotificacionLeida(token, id);
    } catch {
      // No es crítico si falla: se reintenta solo en la próxima carga.
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-brand-700 hover:border-brand-300 transition-colors relative"
        title="Notificaciones"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold-500 border border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto bg-white rounded-xl border border-neutral-200 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white">
            <span className="text-xs font-bold text-neutral-800">Notificaciones</span>
            {unreadCount > 0 && <span className="text-[10px] text-neutral-400">{unreadCount} sin leer</span>}
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <div className="px-4 py-6 text-xs text-red-600">{error}</div>
          ) : notificaciones.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-neutral-400">No tienes notificaciones todavía.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notificaciones.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.leida && handleMarkRead(n.id)}
                  className={`w-full text-left px-4 py-3 text-xs transition-colors hover:bg-neutral-50 ${
                    n.leida ? 'text-neutral-500' : 'text-neutral-900 bg-brand-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.leida && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className={n.leida ? 'font-medium' : 'font-semibold'}>{n.mensaje}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{formatFecha(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
