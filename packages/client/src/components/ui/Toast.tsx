import { useToast, type Toast as ToastType, type ToastVariant } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-[--color-success] text-white',
  error: 'bg-[--color-danger] text-white',
  info: 'bg-[--color-primary] text-white',
};

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 rounded-none min-w-[300px]',
        'animate-in slide-in-from-right-full fade-in-0 duration-300',
        variantStyles[toast.variant],
      )}
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
