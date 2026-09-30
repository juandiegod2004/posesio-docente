'use client';

import React from 'react';
import Image from 'next/image';

interface LogoSealProps {
  size?: number;
  priority?: boolean;
  className?: string;
}

export function LogoSeal({ size = 460, priority = true, className = '' }: LogoSealProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none transition-transform duration-300 hover:scale-[1.01] ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <Image
        src="/logo-secretaria-educacion.png"
        alt="Secretaría de Educación del Magdalena"
        width={size}
        height={size}
        priority={priority}
        className="w-full h-full object-contain drop-shadow-sm pointer-events-none"
      />
    </div>
  );
}
