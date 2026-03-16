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

interface PackRow {
  id: string;
  name: string;
  quantity: number;
  price: number;
  expiryDays: number | null;
  active: boolean;
}

export function CreditPackConfigPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: '10', price: '8000', expiryDays: '90' });
  const utils = trpc.useUtils();

  const { data: packs, isLoading } = trpc.creditPack.list.useQuery({ limit: 100 });

  const createPack = trpc.creditPack.create.useMutation({
    onSuccess: () => {
      addToast(t('admin.packCreated', 'Pack created'), 'success');
      setModalOpen(false);
      setForm({ name: '', quantity: '10', price: '8000', expiryDays: '90' });
      utils.creditPack.list.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const archivePack = trpc.creditPack.archive.useMutation({
    onSuccess: () => {
      addToast(t('admin.packArchived', 'Pack archived'), 'success');
      utils.creditPack.list.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleCreate = () => {
    createPack.mutate({
      name: form.name,
      quantity: parseInt(form.quantity) || 10,
      price: parseInt(form.price) || 8000,
      expiryDays: form.expiryDays ? parseInt(form.expiryDays) : null,
    });
  };

  const columns: Column<PackRow>[] = [
    { key: 'name', header: t('admin.name', 'Name'), render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'credits', header: t('admin.credits', 'Credits'), render: (r) => <span className="font-mono">{r.quantity}</span> },
    { key: 'price', header: t('admin.price', 'Price'), render: (r) => `${(r.price / 100).toFixed(0)} EUR` },
    { key: 'expiry', header: t('admin.expiry', 'Expiry'), render: (r) => r.expiryDays ? `${r.expiryDays} days` : 'No expiry' },
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
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">{t('admin.creditPacks', 'Credit Packs')}</h1>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} className="mr-2" />{t('admin.createPack', 'New Pack')}</Button>
      </div>
      <DataTable columns={columns} data={(packs ?? []) as PackRow[]} keyExtractor={(r) => r.id} />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('admin.createPack', 'New Pack')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={createPack.isPending || !form.name}>
              {createPack.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('admin.name', 'Name')} placeholder="e.g., 10-Pack" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.credits', 'Credits')} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label={t('admin.priceCents', 'Price (cents)')} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <Input label={t('admin.expiryDays', 'Expiry (days)')} type="number" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
