import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-[--color-text]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-none',
            'border border-[--color-border] bg-white',
            'text-[--color-text] placeholder:text-[--color-text-muted]',
            'focus:outline-none focus:border-[--color-primary] focus:ring-1 focus:ring-[--color-primary]',
            'transition-colors duration-250 ease-out',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[--color-danger] focus:border-[--color-danger] focus:ring-[--color-danger]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[--color-danger]">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs text-[--color-text-muted]">{helpText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
