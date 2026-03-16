import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/KPICard';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { trpc } from '@/trpc';

export function RevenueReportsPage() {
  const { t } = useTranslation();

  const { data: report, isLoading } = trpc.admin.revenueReport.useQuery({});

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-60" />
      </div>
    );
  }

  const rows = report ?? [];

  // Aggregate by month
  const monthMap = new Map<string, { packs: number; subscriptions: number; total: number }>();
  for (const row of rows) {
    const month = row.month ?? '';
    const existing = monthMap.get(month) ?? { packs: 0, subscriptions: 0, total: 0 };
    const amount = Number(row.total ?? 0);
    if (row.type === 'one_time') {
      existing.packs += amount;
    } else {
      existing.subscriptions += amount;
    }
    existing.total += amount;
    monthMap.set(month, existing);
  }
  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  const totalRevenue = months.reduce((sum, m) => sum + m.total, 0);
  const totalPacks = months.reduce((sum, m) => sum + m.packs, 0);
  const totalSubs = months.reduce((sum, m) => sum + m.subscriptions, 0);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('admin.reports', 'Revenue Reports')}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KPICard label={t('admin.totalRevenue', 'Total Revenue')} value={`${(totalRevenue / 100).toLocaleString()} EUR`} />
        <KPICard label={t('admin.packRevenue', 'Credit Pack Revenue')} value={`${(totalPacks / 100).toLocaleString()} EUR`} />
        <KPICard label={t('admin.subRevenue', 'Subscription Revenue')} value={`${(totalSubs / 100).toLocaleString()} EUR`} />
      </div>
      <Card>
        <CardContent>
          <CardTitle className="mb-4">{t('admin.monthlyBreakdown', 'Monthly Breakdown')}</CardTitle>
          {months.length === 0 ? (
            <EmptyState title={t('admin.noRevenue', 'No revenue data yet')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[--color-border]">
                    <th className="text-left px-3 py-2 font-semibold text-[--color-text-muted]">{t('admin.month', 'Month')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-[--color-text-muted]">{t('admin.packs', 'Packs')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-[--color-text-muted]">{t('admin.subscriptions', 'Subscriptions')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-[--color-text-muted]">{t('admin.total', 'Total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((row) => (
                    <tr key={row.month} className="border-b border-[--color-border]/50">
                      <td className="px-3 py-2.5">{row.month}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{(row.packs / 100).toFixed(0)} EUR</td>
                      <td className="px-3 py-2.5 text-right font-mono">{(row.subscriptions / 100).toFixed(0)} EUR</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">{(row.total / 100).toFixed(0)} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
