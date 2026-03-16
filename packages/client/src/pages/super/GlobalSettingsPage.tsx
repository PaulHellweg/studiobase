import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';

export function GlobalSettingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">{t('super.globalSettings', 'Global Settings')}</h1>
      <Card className="max-w-2xl">
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <CardTitle>{t('super.platform', 'Platform')}</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[--color-border]/50">
                  <span className="text-[--color-text-muted]">{t('super.platformName', 'Platform Name')}</span>
                  <span className="font-semibold">StudioBase</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[--color-border]/50">
                  <span className="text-[--color-text-muted]">{t('super.environment', 'Environment')}</span>
                  <span className="font-mono">{import.meta.env.MODE}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <CardTitle>{t('super.defaults', 'Defaults')}</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-[--color-border]/50">
                  <span className="text-[--color-text-muted]">{t('super.defaultLocale', 'Default Locale')}</span>
                  <span>de</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[--color-text-muted]">
              {t('super.envNote', 'Global settings are configured via environment variables. Contact your system administrator to make changes.')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
