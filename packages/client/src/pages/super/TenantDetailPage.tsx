import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function TenantDetailPage() {
  const { tenantId } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  const { data: tenant, isLoading } = trpc.tenant.get.useQuery(
    { id: tenantId! },
    { enabled: !!tenantId },
  );

  const updateTenant = trpc.tenant.update.useMutation({
    onSuccess: () => {
      addToast(t('common.saved', 'Saved'), 'success');
      utils.tenant.get.invalidate({ id: tenantId! });
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const [form, setForm] = useState({ name: '', slug: '', plan: '' });

  useEffect(() => {
    if (tenant) {
      setForm({ name: tenant.name, slug: tenant.slug, plan: tenant.plan });
    }
  }, [tenant]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    updateTenant.mutate({
      id: tenantId,
      name: form.name || undefined,
      plan: (form.plan as 'free' | 'starter' | 'pro') || undefined,
    });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-60" />
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return <div className="text-[--color-text-muted]">{t('common.notFound', 'Not found')}</div>;
  }

  return (
    <div>
      <Link to="/super/tenants" className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6">
        <ArrowLeft size={16} /> {t('super.tenants', 'Tenants')}
      </Link>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="font-heading text-2xl font-bold text-[--color-text]">{tenant.name}</h1>
        <Badge variant="success">{tenant.plan}</Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardContent>
            <CardTitle className="mb-4">{t('super.tenantConfig', 'Configuration')}</CardTitle>
            <form className="space-y-4" onSubmit={handleSave}>
              <Input label={t('super.studioName', 'Studio Name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label={t('super.slug', 'Slug')} value={form.slug} disabled />
              <Input label={t('super.plan', 'Plan')} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} />
              <Button type="submit" disabled={updateTenant.isPending}>
                {updateTenant.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardTitle className="mb-4">{t('super.info', 'Info')}</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[--color-text-muted]">{t('super.slug', 'Slug')}</span><span className="font-mono">{tenant.slug}</span></div>
              <div className="flex justify-between"><span className="text-[--color-text-muted]">{t('super.locale', 'Locale')}</span><span>{tenant.locale}</span></div>
              <div className="flex justify-between"><span className="text-[--color-text-muted]">{t('super.created', 'Created')}</span><span>{new Date(tenant.createdAt).toLocaleDateString()}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
