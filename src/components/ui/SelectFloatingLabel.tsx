'use client';

import React, { forwardRef } from 'react';

interface SelectFloatingLabelProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const SelectFloatingLabel = forwardRef<HTMLSelectElement, SelectFloatingLabelProps>(
  ({ label, error, placeholder, options, id, className = '', ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full">
        <div className="relative">
          <label
            htmlFor={selectId}
            className={`absolute -top-2.5 left-3 bg-white px-1.5 text-xs font-normal transition-colors select-none z-10 ${
              error ? 'text-red-600' : 'text-neutral-600'
            }`}
          >
            {label}
          </label>

          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            defaultValue=""
            className={`w-full h-12 px-4 rounded-md border text-sm text-neutral-800 bg-white transition-all outline-none appearance-none ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-200'
                : 'border-neutral-400 hover:border-neutral-500 focus:border-brand-600 focus:ring-1 focus:ring-brand-200'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1 text-xs text-red-600 font-medium px-1 flex items-center gap-1 animate-fadeIn"
          >
            <span>•</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

SelectFloatingLabel.displayName = 'SelectFloatingLabel';
