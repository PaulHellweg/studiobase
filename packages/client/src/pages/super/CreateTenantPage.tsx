import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function CreateTenantPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({ name: '', slug: '', plan: 'starter' });

  const createTenant = trpc.tenant.create.useMutation({
    onSuccess: (tenant) => {
      addToast(t('super.tenantCreated', 'Tenant created'), 'success');
      utils.tenant.list.invalidate();
      navigate(`/super/tenants/${tenant.id}`);
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenant.mutate({
      name: form.name,
      slug: form.slug,
      plan: (form.plan as 'free' | 'starter' | 'pro') || 'starter',
    });
  };

  return (
    <div>
      <Link to="/super/tenants" className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6">
        <ArrowLeft size={16} /> {t('super.tenants', 'Tenants')}
      </Link>
      <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-6">{t('super.createTenant', 'New Tenant')}</h1>
      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t('super.studioName', 'Studio Name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label={t('super.slug', 'Slug')} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="zen-flow" helpText={t('super.slugHelp', 'URL-safe identifier')} required />
            <Input label={t('super.plan', 'Plan')} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} placeholder="Starter" />
            <Button type="submit" disabled={createTenant.isPending || !form.name || !form.slug}>
              {createTenant.isPending ? t('common.saving', 'Saving...') : t('super.createTenant', 'Create Tenant')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
