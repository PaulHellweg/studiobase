import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface KPICardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; label: string };
}

export function KPICard({ label, value, trend }: KPICardProps) {
  return (
    <Card padding="md">
      <CardContent>
        <p className="text-sm text-[--color-text-muted] mb-1">{label}</p>
        <p className="font-mono text-3xl font-bold text-[--color-text]">{value}</p>
        {trend && (
          <p
            className={cn(
              'flex items-center gap-1 text-xs font-semibold mt-2',
              trend.direction === 'up' ? 'text-[--color-success]' : 'text-[--color-danger]',
            )}
          >
            {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
