export function SkeletonLoader() {
  return (
    <div className="bg-white border border-[var(--color-border)] p-6">
      <div className="skeleton h-6 w-1/3 mb-4" />
      <div className="skeleton h-4 w-1/2 mb-2" />
      <div className="skeleton h-4 w-2/3 mb-4" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
