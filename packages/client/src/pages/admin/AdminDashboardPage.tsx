import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/KPICard';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';

export function AdminDashboardPage() {
  const { t } = useTranslation();

  const { data: dashboard, isLoading } = trpc.admin.dashboard.useQuery();

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: t('admin.totalBookings', 'Total Bookings'), value: dashboard?.totalBookings ?? 0 },
    { label: t('admin.revenue', 'Revenue'), value: `${((dashboard?.totalRevenue ?? 0) / 100).toLocaleString()} EUR` },
    { label: t('admin.activeCustomers', 'Active Customers'), value: dashboard?.totalCustomers ?? 0 },
    { label: t('admin.activeSubscriptions', 'Active Subscriptions'), value: dashboard?.activeSubscriptions ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('admin.dashboard', 'Dashboard')}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </div>
    </div>
  );
}
