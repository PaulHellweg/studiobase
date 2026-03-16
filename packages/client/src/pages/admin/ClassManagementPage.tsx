import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

interface ClassTypeRow {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  capacity: number;
  creditCost: number;
  active: boolean;
}

export function ClassManagementPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', duration: '60', capacity: '20', creditCost: '1' });
  const utils = trpc.useUtils();

  const { data: classTypes, isLoading } = trpc.classType.list.useQuery({ limit: 100 });

  const createClassType = trpc.classType.create.useMutation({
    onSuccess: () => {
      addToast(t('admin.classCreated', 'Class created'), 'success');
      setModalOpen(false);
      setForm({ name: '', description: '', duration: '60', capacity: '20', creditCost: '1' });
      utils.classType.list.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const archiveClassType = trpc.classType.archive.useMutation({
    onSuccess: () => {
      addToast(t('admin.classArchived', 'Class archived'), 'success');
      utils.classType.list.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleCreate = () => {
    createClassType.mutate({
      name: form.name,
      description: form.description || undefined,
      duration: parseInt(form.duration) || 60,
      capacity: parseInt(form.capacity) || 20,
      creditCost: parseInt(form.creditCost) || 1,
    });
  };

  const columns: Column<ClassTypeRow>[] = [
    { key: 'name', header: t('admin.className', 'Name'), render: (r) => <span className="font-semibold">{r.name}</span>, sortable: true, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'duration', header: t('admin.duration', 'Duration'), render: (r) => `${r.duration} min`, sortable: true, sortFn: (a, b) => a.duration - b.duration },
    { key: 'capacity', header: t('admin.capacity', 'Capacity'), render: (r) => r.capacity, sortable: true, sortFn: (a, b) => a.capacity - b.capacity },
    { key: 'credits', header: t('admin.credits', 'Credits'), render: (r) => r.creditCost },
    { key: 'status', header: t('admin.status', 'Status'), render: (r) => <Badge variant={r.active ? 'success' : 'muted'}>{r.active ? 'active' : 'archived'}</Badge> },
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
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">
          {t('admin.classes', 'Classes')}
        </h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} className="mr-2" />
          {t('admin.createClass', 'New Class')}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={(classTypes ?? []) as ClassTypeRow[]}
        keyExtractor={(r) => r.id}
        searchFn={(r, q) => r.name.toLowerCase().includes(q.toLowerCase())}
        searchPlaceholder={t('admin.searchClasses', 'Search classes...')}
        emptyTitle={t('admin.noClasses', 'No classes yet')}
        emptyDescription={t('admin.noClassesDesc', 'Create your first class to get started.')}
      />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('admin.createClass', 'New Class')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={createClassType.isPending || !form.name}>
              {createClassType.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('admin.className', 'Name')} placeholder="e.g., Morning Vinyasa" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label={t('admin.description', 'Description')} placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.duration', 'Duration (min)')} type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <Input label={t('admin.capacity', 'Capacity')} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <Input label={t('admin.credits', 'Credits Required')} type="number" value={form.creditCost} onChange={(e) => setForm({ ...form, creditCost: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
