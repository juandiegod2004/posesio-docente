'use client';

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFloatingLabelProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export const InputFloatingLabel = forwardRef<HTMLInputElement, InputFloatingLabelProps>(
  ({ label, error, isPassword = false, type = 'text', id, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        <div className="relative">
          {/* Label sitting over the top border */}
          <label
            htmlFor={inputId}
            className={`absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-normal transition-colors select-none z-10 ${
              error ? 'text-red-600' : 'text-neutral-600'
            }`}
          >
            {label}
          </label>

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            className={`w-full h-12 px-4 rounded-md border text-sm text-neutral-800 placeholder-neutral-400 bg-white transition-all outline-none ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-200'
                : 'border-neutral-400 hover:border-neutral-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200'
            } ${isPassword ? 'pr-12' : ''} ${className}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 p-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? (
                <Eye className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <EyeOff className="w-5 h-5" strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium px-1 flex items-center gap-1 animate-fadeIn">
            <span>•</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

InputFloatingLabel.displayName = 'InputFloatingLabel';
