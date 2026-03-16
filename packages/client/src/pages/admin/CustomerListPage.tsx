import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';
import { format } from 'date-fns';

interface CustomerRow {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date | string;
}

export function CustomerListPage() {
  const { t } = useTranslation();

  const { data: customers, isLoading } = trpc.admin.listCustomers.useQuery({ limit: 100 });

  const columns: Column<CustomerRow>[] = [
    { key: 'name', header: t('admin.name', 'Name'), render: (r) => <Link to={`/admin/customers/${r.userId}`} className="font-semibold text-[--color-primary] hover:underline">{r.name}</Link>, sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'email', header: t('auth.email', 'Email'), render: (r) => <span className="text-[--color-text-muted]">{r.email}</span> },
    { key: 'joined', header: t('admin.joined', 'Joined'), render: (r) => <span className="text-[--color-text-muted]">{format(new Date(r.joinedAt), 'MMM yyyy')}</span> },
  ];

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">{t('admin.customers', 'Customers')}</h1>
      <DataTable
        columns={columns}
        data={(customers ?? []) as CustomerRow[]}
        keyExtractor={(r) => r.userId}
        searchFn={(r, q) => r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase())}
        searchPlaceholder={t('admin.searchCustomers', 'Search customers...')}
        emptyTitle={t('admin.noCustomers', 'No customers yet')}
        emptyDescription={t('admin.noCustomersDesc', 'Customers appear here after their first booking.')}
      />
    </div>
  );
}
