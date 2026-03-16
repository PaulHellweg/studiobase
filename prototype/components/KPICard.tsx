type KPICardProps = {
  label: string;
  value: string | number;
  change?: string;
};

export function KPICard({ label, value, change }: KPICardProps) {
  return (
    <div className="bg-white border border-[var(--color-border)] p-6">
      <div className="text-sm text-[var(--color-text-muted)] mb-2">{label}</div>
      <div className="text-3xl font-heading font-700 text-[var(--color-text)] mb-1">
        {value}
      </div>
      {change && (
        <div className="text-xs text-[var(--color-success)]">{change}</div>
      )}
    </div>
  );
}
