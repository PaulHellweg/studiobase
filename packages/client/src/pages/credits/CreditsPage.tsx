import { useTranslation } from 'react-i18next';
import { CreditBalance } from '@/components/CreditBalance';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { trpc } from '@/trpc';
import { format } from 'date-fns';

export function CreditsPage() {
  const { t } = useTranslation();

  const { data: balanceData, isLoading: balanceLoading } = trpc.credit.getBalance.useQuery();
  const { data: ledger, isLoading: ledgerLoading } = trpc.credit.listLedger.useQuery({ limit: 50 });

  const isLoading = balanceLoading || ledgerLoading;

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-40" />
          <div className="lg:col-span-2">
            <Skeleton className="h-60" />
          </div>
        </div>
      </div>
    );
  }

  const balance = balanceData?.balance ?? 0;
  const entries = (ledger ?? [])
    .filter((e) => e.amount > 0 && e.expiresAt)
    .map((e) => ({
      amount: e.amount,
      expiresAt: e.expiresAt ? format(new Date(e.expiresAt), 'MMM d, yyyy') : 'No expiry',
    }));

  const history = (ledger ?? []).map((e) => ({
    date: format(new Date(e.createdAt), 'MMM d, yyyy'),
    description: e.type === 'grant' ? 'Credit Grant' : e.type === 'debit' ? 'Booking' : e.type === 'refund' ? 'Refund' : 'Expiry',
    credits: e.amount,
    type: e.type,
  }));

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('nav.credits', 'Credits')}
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <CreditBalance total={balance} entries={entries} />
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <CardTitle className="mb-4">{t('credits.history', 'History')}</CardTitle>
              {history.length === 0 ? (
                <EmptyState title={t('credits.noHistory', 'No credit history yet')} />
              ) : (
                <div className="space-y-0">
                  {history.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[--color-border]/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[--color-text]">{entry.description}</p>
                        <p className="text-xs text-[--color-text-muted]">{entry.date}</p>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${entry.credits > 0 ? 'text-[--color-success]' : 'text-[--color-text]'}`}>
                        {entry.credits > 0 ? '+' : ''}{entry.credits}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
