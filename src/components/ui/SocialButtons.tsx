'use client';

import React from 'react';

export function SocialButtons() {
  const handleSocialClick = (provider: string) => {
    alert(`El inicio con ${provider} se encuentra en modo demostración. Por favor utiliza el formulario o las cuentas de prueba.`);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-neutral-200 w-full"></div>
        <span className="bg-white px-3 text-xs text-neutral-400 absolute">
          O regístrate con
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleSocialClick('Facebook')}
          className="flex items-center justify-center h-11 border border-indigo-400/80 rounded-md hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Registrarse con Facebook"
        >
          <svg className="w-5 h-5 text-[#1877F2] fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>

        {/* Google */}
        <button
          type="button"
          onClick={() => handleSocialClick('Google')}
          className="flex items-center justify-center h-11 border border-indigo-400/80 rounded-md hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Registrarse con Google"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.14C3.25 21.31 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.26C.46 8.19 0 9.99 0 12s.46 3.81 1.26 5.41l4.02-3.14z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.26 6.59l4.02 3.14c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleSocialClick('Apple')}
          className="flex items-center justify-center h-11 border border-indigo-400/80 rounded-md hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300"
          aria-label="Registrarse con Apple"
        >
          <svg className="w-5 h-5 text-neutral-900 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.65-.79 1.1-1.89.98-2.99-1 .04-2.18.66-2.88 1.47-.62.71-1.15 1.83-1.01 2.91 1.11.09 2.23-.57 2.91-1.39z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
