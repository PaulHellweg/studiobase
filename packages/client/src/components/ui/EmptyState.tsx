import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <h3 className="font-heading text-lg font-semibold text-[--color-text] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[--color-text-muted] max-w-md mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
