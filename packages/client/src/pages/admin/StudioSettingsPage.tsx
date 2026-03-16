import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function StudioSettingsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  const { data: studio, isLoading } = trpc.studio.get.useQuery();

  const updateStudio = trpc.studio.update.useMutation({
    onSuccess: () => {
      addToast(t('admin.settingsSaved', 'Settings saved'), 'success');
      utils.studio.get.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const [form, setForm] = useState({ name: '', description: '', address: '' });

  useEffect(() => {
    if (studio) {
      setForm({
        name: studio.name ?? '',
        description: studio.description ?? '',
        address: studio.address ?? '',
      });
    }
  }, [studio]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudio.mutate({
      name: form.name || undefined,
      description: form.description || undefined,
      address: form.address || undefined,
    });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-80 max-w-2xl" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">{t('admin.settings', 'Studio Settings')}</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <CardTitle>{t('admin.general', 'General')}</CardTitle>
              <Input label={t('admin.studioName', 'Studio Name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label={t('admin.description', 'Description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input label={t('admin.location', 'Location')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Button type="submit" disabled={updateStudio.isPending}>
              {updateStudio.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
