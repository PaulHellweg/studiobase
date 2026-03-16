import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'success' | 'danger' | 'muted' | 'accent' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-[--color-success]/15 text-[--color-success] border-[--color-success]/25',
  danger: 'bg-[--color-danger]/15 text-[--color-danger] border-[--color-danger]/25',
  muted: 'bg-[--color-border]/40 text-[--color-text-muted] border-[--color-border]',
  accent: 'bg-[--color-accent] text-[--color-text] border-[--color-accent]',
  info: 'bg-[--color-primary]/15 text-[--color-primary] border-[--color-primary]/25',
};

export function Badge({ className, variant = 'muted', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-none border',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
