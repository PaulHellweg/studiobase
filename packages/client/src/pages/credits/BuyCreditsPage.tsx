import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function BuyCreditsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const { data: packs, isLoading } = trpc.creditPack.list.useQuery({ limit: 20 });

  const checkoutMutation = trpc.payment.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) {
        window.location.href = url;
      }
    },
    onError: (err) => {
      addToast(err.message ?? t('common.error', 'Something went wrong'), 'error');
    },
  });

  const activePacks = packs?.filter((p) => p.active) ?? [];

  return (
    <div>
      <Link
        to="/credits"
        className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
      >
        <ArrowLeft size={16} />
        {t('nav.credits', 'Credits')}
      </Link>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-2">
        {t('credits.buyPack', 'Buy Credits')}
      </h1>
      <p className="text-[--color-text-muted] mb-8">
        {t('credits.buyDesc', 'Choose a credit pack. Credits expire after a set number of days.')}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : activePacks.length === 0 ? (
        <EmptyState
          title={t('credits.noPacks', 'No credit packs available')}
          description={t('credits.noPacksDesc', 'Check back later for available credit packs.')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activePacks.map((pack, idx) => {
            const priceEur = pack.price / 100;
            const pricePerCredit = pack.quantity > 0 ? (pack.price / pack.quantity / 100).toFixed(2) : '—';
            const isPopular = idx === 1;
            const isPending = checkoutMutation.isPending && checkoutMutation.variables?.creditPackId === pack.id;

            return (
              <Card key={pack.id} className={isPopular ? 'border-[--color-accent-hover] border-2' : ''}>
                <CardContent>
                  <div className="space-y-4">
                    {isPopular && (
                      <span className="inline-block text-xs font-semibold text-[--color-accent-hover] uppercase tracking-wide">
                        {t('credits.popular', 'Most Popular')}
                      </span>
                    )}
                    <h3 className="font-heading text-xl font-bold text-[--color-text]">{pack.name}</h3>
                    <p className="font-mono text-3xl font-bold text-[--color-accent-hover]">
                      {priceEur.toFixed(2)}<span className="text-sm text-[--color-text-muted]"> EUR</span>
                    </p>
                    <ul className="space-y-1 text-sm text-[--color-text-muted]">
                      <li className="flex items-center gap-1">
                        <Check size={14} className="text-[--color-success]" />
                        {pack.quantity} {t('credits.credits', 'credits')}
                      </li>
                      <li className="flex items-center gap-1">
                        <Check size={14} className="text-[--color-success]" />
                        {pricePerCredit} EUR / {t('credits.credit', 'credit')}
                      </li>
                      {pack.expiryDays && (
                        <li className="flex items-center gap-1">
                          <Check size={14} className="text-[--color-success]" />
                          {pack.expiryDays} {t('credits.dayExpiry', 'day expiry')}
                        </li>
                      )}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'primary' : 'secondary'}
                      onClick={() => checkoutMutation.mutate({ creditPackId: pack.id })}
                      disabled={checkoutMutation.isPending}
                    >
                      {isPending ? t('common.loading', 'Loading…') : t('credits.buy', 'Buy')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
