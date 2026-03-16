import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { trpc } from '@/trpc';
import { format } from 'date-fns';

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  memberCount: number;
  createdAt: Date | string;
}

export function TenantListPage() {
  const { t } = useTranslation();

  const { data: tenants, isLoading } = trpc.tenant.list.useQuery({ limit: 100 });

  const columns: Column<TenantRow>[] = [
    { key: 'name', header: t('super.name', 'Name'), render: (r) => <Link to={`/super/tenants/${r.id}`} className="font-semibold text-[--color-primary] hover:underline">{r.name}</Link>, sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'slug', header: t('super.slug', 'Slug'), render: (r) => <span className="font-mono text-[--color-text-muted]">{r.slug}</span> },
    { key: 'plan', header: t('super.plan', 'Plan'), render: (r) => <Badge variant="muted">{r.plan}</Badge> },
    { key: 'members', header: t('super.members', 'Members'), render: (r) => r.memberCount },
    { key: 'created', header: t('super.created', 'Created'), render: (r) => format(new Date(r.createdAt), 'MMM yyyy') },
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">{t('super.tenants', 'Tenants')}</h1>
        <Link to="/super/tenants/new"><Button><Plus size={16} className="mr-2" />{t('super.createTenant', 'New Tenant')}</Button></Link>
      </div>
      <DataTable
        columns={columns}
        data={(tenants ?? []) as TenantRow[]}
        keyExtractor={(r) => r.id}
        searchFn={(r, q) => r.name.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase())}
      />
    </div>
  );
}
