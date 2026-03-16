import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

interface CreditEntry {
  amount: number;
  expiresAt: string;
}

interface CreditBalanceProps {
  total: number;
  entries: CreditEntry[];
}

export function CreditBalance({ total, entries }: CreditBalanceProps) {
  const { t } = useTranslation();

  return (
    <Card padding="lg">
      <CardContent>
        <div className="text-center mb-6">
          <p className="text-sm text-[--color-text-muted] mb-1">
            {t('credits.balance', 'Credit Balance')}
          </p>
          <p className="font-mono text-4xl font-bold text-[--color-accent-hover]">
            {total}
          </p>
        </div>
        {entries.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-wide">
              {t('credits.expiry', 'Expiry Breakdown')}
            </p>
            {entries.map((entry, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[--color-text]">{entry.amount} {t('credits.credits', 'credits')}</span>
                <span className="text-[--color-text-muted]">{entry.expiresAt}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <Link to="/credits/buy" className="flex-1">
            <Button variant="primary" size="md" className="w-full">
              {t('credits.buyPack', 'Buy Credits')}
            </Button>
          </Link>
          <Link to="/credits/subscribe" className="flex-1">
            <Button variant="secondary" size="md" className="w-full">
              {t('credits.subscribe', 'Subscribe')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
