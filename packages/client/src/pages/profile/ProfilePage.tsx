import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export function ProfilePage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => addToast(t('profile.saved', 'Profile updated'), 'success'),
    onError: (err) => addToast(err.message, 'error'),
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ name: name || undefined, phone: phone || null });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <Card className="max-w-lg">
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('nav.profile', 'Profile')}
      </h1>
      <Card className="max-w-lg">
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input label={t('auth.name', 'Full Name')} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t('auth.email', 'Email')} type="email" value={user?.email ?? ''} disabled helpText={t('profile.emailHelp', 'Contact support to change your email')} />
            <Input label={t('profile.phone', 'Phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
