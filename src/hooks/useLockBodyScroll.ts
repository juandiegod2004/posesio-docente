'use client';

import { useEffect } from 'react';

/**
 * Bloquea el scroll del body mientras `locked` es true, para que un modal encima
 * (con fondo oscurecido) no deje mover el contenido detrás. Restaura el valor
 * previo al desmontar o al pasar a `locked=false`.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
