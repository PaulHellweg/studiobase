import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';

interface TeacherRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export function TeacherManagementPage() {
  const { t } = useTranslation();

  const { data: teachers, isLoading } = trpc.admin.listTeachers.useQuery({ limit: 100 });

  const columns: Column<TeacherRow>[] = [
    { key: 'name', header: t('admin.name', 'Name'), render: (r) => <span className="font-semibold">{r.name}</span>, sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'email', header: t('auth.email', 'Email'), render: (r) => <span className="text-[--color-text-muted]">{r.email}</span> },
    { key: 'status', header: t('admin.status', 'Status'), render: (r) => <Badge variant={r.active ? 'success' : 'muted'}>{r.active ? 'active' : 'inactive'}</Badge> },
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
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">{t('admin.teachers', 'Teachers')}</h1>
      </div>
      <DataTable
        columns={columns}
        data={(teachers ?? []) as TeacherRow[]}
        keyExtractor={(r) => r.id}
        searchFn={(r, q) => r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase())}
        searchPlaceholder={t('admin.searchTeachers', 'Search teachers...')}
      />
    </div>
  );
}
