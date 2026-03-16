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

interface TierRow {
  id: string;
  name: string;
  creditsPerPeriod: number;
  period: string;
  price: number;
  active: boolean;
}

export function SubscriptionTierConfigPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', creditsPerPeriod: '8', period: 'monthly', price: '6000' });
  const utils = trpc.useUtils();

  const { data: tiers, isLoading } = trpc.subscriptionTier.list.useQuery({ limit: 100 });

  const createTier = trpc.subscriptionTier.create.useMutation({
    onSuccess: () => {
      addToast(t('admin.tierCreated', 'Tier created'), 'success');
      setModalOpen(false);
      setForm({ name: '', creditsPerPeriod: '8', period: 'monthly', price: '6000' });
      utils.subscriptionTier.list.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleCreate = () => {
    createTier.mutate({
      name: form.name,
      creditsPerPeriod: parseInt(form.creditsPerPeriod) || 8,
      period: form.period as 'weekly' | 'monthly',
      price: parseInt(form.price) || 6000,
    });
  };

  const columns: Column<TierRow>[] = [
    { key: 'name', header: t('admin.name', 'Name'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'credits', header: t('admin.creditsPerMonth', 'Credits/Period'), render: (r) => <span className="font-mono">{r.creditsPerPeriod}</span> },
    { key: 'period', header: t('admin.period', 'Period'), render: (r) => r.period },
    { key: 'price', header: t('admin.price', 'Price'), render: (r) => `${(r.price / 100).toFixed(0)} EUR/${r.period}` },
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
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">{t('admin.subscriptions', 'Subscriptions')}</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} className="mr-2" />{t('admin.createTier', 'New Tier')}</Button>
      </div>
      <DataTable columns={columns} data={(tiers ?? []) as TierRow[]} keyExtractor={(r) => r.id} />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('admin.createTier', 'New Tier')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={createTier.isPending || !form.name}>
              {createTier.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('admin.name', 'Name')} placeholder="e.g., Regular" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.creditsPerMonth', 'Credits/Period')} type="number" value={form.creditsPerPeriod} onChange={(e) => setForm({ ...form, creditsPerPeriod: e.target.value })} />
            <Input label={t('admin.priceCents', 'Price (cents)')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[--color-text] mb-1">{t('admin.period', 'Period')}</label>
            <select
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              className="w-full px-3 py-2 border border-[--color-border] rounded-none bg-white text-[--color-text] text-sm focus:outline-none focus:border-[--color-primary]"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
