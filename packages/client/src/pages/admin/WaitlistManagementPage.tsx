import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';
import { format } from 'date-fns';

interface WaitlistRow {
  id: string;
  studentName: string;
  className: string;
  instanceDate: Date | string;
  startTime: string;
  position: number;
}

export function WaitlistManagementPage() {
  const { t } = useTranslation();

  const { data: entries, isLoading } = trpc.waitlist.list.useQuery({ limit: 100 });

  const columns: Column<WaitlistRow>[] = [
    { key: 'customer', header: t('admin.customer', 'Customer'), render: (r) => <span className="font-semibold">{r.studentName}</span> },
    { key: 'class', header: t('admin.class', 'Class'), render: (r) => r.className },
    { key: 'date', header: t('admin.date', 'Date'), render: (r) => format(new Date(r.instanceDate), 'EEE, MMM d') },
    { key: 'time', header: t('admin.time', 'Time'), render: (r) => r.startTime },
    { key: 'position', header: t('admin.position', 'Position'), render: (r) => `#${r.position}` },
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
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">{t('admin.waitlists', 'Waitlists')}</h1>
      <DataTable
        columns={columns}
        data={(entries ?? []) as WaitlistRow[]}
        keyExtractor={(r) => r.id}
        searchFn={(r, q) => r.studentName.toLowerCase().includes(q.toLowerCase()) || r.className.toLowerCase().includes(q.toLowerCase())}
        emptyTitle={t('admin.noWaitlists', 'No active waitlists')}
      />
    </div>
  );
}
