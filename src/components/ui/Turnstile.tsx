'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Script from 'next/script';

type TurnstileWidgetId = string;

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
      reset: (widgetId: TurnstileWidgetId) => void;
      remove: (widgetId: TurnstileWidgetId) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export interface TurnstileHandle {
  /** El token de Turnstile es de un solo uso: hay que llamar esto antes de reintentar tras un error. */
  reset: () => void;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /** Se dispara si el widget falla al renderizar o al validar (ej. error 600010). Sin esto,
   * un fallo deja el botón de submit deshabilitado para siempre sin ninguna explicación. */
  onError?: () => void;
  className?: string;
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  ({ onVerify, onExpire, onError, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    // Ref "última versión" para no tener que re-renderizar el widget cada vez
    // que el padre pasa una nueva referencia de función.
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);
    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) return;

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
      });
      widgetIdRef.current = widgetId;

      return () => {
        if (window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        widgetIdRef.current = null;
      };
    }, [scriptReady]);

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div ref={containerRef} className={className} />
      </>
    );
  }
);

Turnstile.displayName = 'Turnstile';
