import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { trpc } from '@/trpc';
import { format } from 'date-fns';

export function CustomerDetailPage() {
  const { customerId } = useParams();
  const { t } = useTranslation();

  const { data: customer, isLoading } = trpc.admin.customerDetail.useQuery(
    { id: customerId! },
    { enabled: !!customerId },
  );

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-40" /></div>
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return <EmptyState title={t('common.notFound', 'Customer not found')} />;
  }

  return (
    <div>
      <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6">
        <ArrowLeft size={16} /> {t('admin.customers', 'Customers')}
      </Link>
      <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-1">{customer.name}</h1>
      <p className="text-sm text-[--color-text-muted] mb-6">
        {customer.email} — {t('admin.joined', 'Joined')} {format(new Date(customer.joinedAt), 'MMM d, yyyy')}
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <CardTitle>{t('admin.recentBookings', 'Recent Bookings')}</CardTitle>
          {(customer.bookings ?? []).length === 0 ? (
            <EmptyState title={t('admin.noBookings', 'No bookings')} />
          ) : (
            <div className="space-y-2">
              {(customer.bookings as any[]).map((b: any) => (
                <Card key={b.id} padding="md">
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{b.className ?? 'Class'}</p>
                        <p className="text-xs text-[--color-text-muted]">
                          {b.date ? format(new Date(b.date), 'EEE, MMM d') : ''} {b.startTime ?? ''}
                        </p>
                      </div>
                      <span className="text-xs font-semibold">{b.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <Card>
            <CardContent>
              <CardTitle className="mb-3">{t('admin.customerInfo', 'Customer Info')}</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--color-text-muted]">{t('nav.credits', 'Credits')}</span>
                  <span className="font-mono font-semibold">{customer.creditBalance ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-muted]">{t('admin.totalBookings', 'Total Bookings')}</span>
                  <span className="font-semibold">{(customer.bookings as any[])?.length ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
