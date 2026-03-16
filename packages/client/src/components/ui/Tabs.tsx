import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';
import type { ComponentPropsWithoutRef } from 'react';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex border-b border-[--color-border] gap-0',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'px-4 py-2.5 text-sm font-semibold text-[--color-text-muted]',
        'border-b-2 border-transparent -mb-px',
        'hover:text-[--color-text] transition-colors duration-250 ease-out',
        'data-[state=active]:text-[--color-primary] data-[state=active]:border-[--color-primary]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
