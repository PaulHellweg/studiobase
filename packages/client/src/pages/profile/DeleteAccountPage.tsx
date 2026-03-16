import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/trpc';

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { logout } = useAuth();
  const [confirmation, setConfirmation] = useState('');

  const requestDeletion = trpc.user.requestDeletion.useMutation({
    onSuccess: () => {
      addToast(t('profile.deleteRequested', 'Account deletion requested. Your data will be removed within 30 days.'), 'info');
      logout();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmation !== 'DELETE') return;
    requestDeletion.mutate();
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('profile.deleteAccount', 'Delete Account')}
      </h1>
      <Card className="max-w-lg border-[--color-danger]">
        <CardContent>
          <p className="text-sm text-[--color-text-muted] mb-4">
            {t('profile.deleteWarning', 'This action cannot be undone. All your data, bookings, and credits will be permanently deleted within 30 days.')}
          </p>
          <form onSubmit={handleDelete} className="space-y-4">
            <Input
              label={t('profile.typeDelete', 'Type DELETE to confirm')}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
            />
            <Button variant="danger" type="submit" disabled={confirmation !== 'DELETE' || requestDeletion.isPending}>
              {requestDeletion.isPending
                ? t('common.loading', 'Loading...')
                : t('profile.confirmDelete', 'Permanently Delete My Account')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
