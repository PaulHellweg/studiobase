import Link from "next/link";

type EmptyStateProps = {
  message: string;
  ctaText?: string;
  ctaHref?: string;
};

export function EmptyState({ message, ctaText, ctaHref }: EmptyStateProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] p-12 text-center">
      <p className="text-[var(--color-text-muted)] mb-4">{message}</p>
      {ctaText && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-block px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
        >
          {ctaText}
        </Link>
      )}
    </div>
  );
}
