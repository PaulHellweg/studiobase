"use client";

import { InputHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helpText?: string;
};

export function FormField({ label, error, helpText, ...props }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-600 text-[var(--color-text)] mb-2">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2 border ${
          error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]"
        } focus:outline-none focus:border-[var(--color-primary)] transition-colors duration-250`}
      />
      {error && <div className="text-sm text-[var(--color-danger)] mt-1">{error}</div>}
      {helpText && !error && (
        <div className="text-sm text-[var(--color-text-muted)] mt-1">{helpText}</div>
      )}
    </div>
  );
}
