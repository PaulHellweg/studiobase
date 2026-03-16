import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';
import { Download } from 'lucide-react';

export function DataExportPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const requestExport = trpc.user.requestExport.useMutation({
    onSuccess: () => addToast(t('profile.exportRequested', 'Data export requested. You will receive a download link via email.'), 'success'),
    onError: (err) => addToast(err.message, 'error'),
  });

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('profile.dataExport', 'Data Export')}
      </h1>
      <Card className="max-w-lg">
        <CardContent>
          <p className="text-sm text-[--color-text-muted] mb-4">
            {t('profile.dataExportDesc', 'Request a copy of all your personal data in JSON format, as required by DSGVO/GDPR Article 20.')}
          </p>
          <Button onClick={() => requestExport.mutate()} disabled={requestExport.isPending || requestExport.isSuccess}>
            <Download size={16} className="mr-2" />
            {requestExport.isSuccess
              ? t('profile.exportPending', 'Export Requested')
              : requestExport.isPending
                ? t('common.loading', 'Loading...')
                : t('profile.requestExport', 'Request Data Export')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
