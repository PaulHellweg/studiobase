import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function SubscribePage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const { data: tiers, isLoading } = trpc.subscriptionTier.list.useQuery({ limit: 20 });

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

  const activeTiers = tiers?.filter((tier) => tier.active) ?? [];

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
        {t('credits.subscribe', 'Subscribe')}
      </h1>
      <p className="text-[--color-text-muted] mb-8">
        {t('credits.subscribeDesc', 'Get monthly credits at a discount. Cancel anytime.')}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : activeTiers.length === 0 ? (
        <EmptyState
          title={t('credits.noTiers', 'No subscription plans available')}
          description={t('credits.noTiersDesc', 'Check back later for available subscription plans.')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeTiers.map((tier, idx) => {
            const priceEur = tier.price / 100;
            const isPopular = idx === 1;
            const isPending = checkoutMutation.isPending && checkoutMutation.variables?.subscriptionTierId === tier.id;

            return (
              <Card key={tier.id} className={isPopular ? 'border-[--color-accent-hover] border-2' : ''}>
                <CardContent>
                  <div className="space-y-4">
                    {isPopular && (
                      <span className="inline-block text-xs font-semibold text-[--color-accent-hover] uppercase tracking-wide">
                        {t('credits.popular', 'Most Popular')}
                      </span>
                    )}
                    <h3 className="font-heading text-xl font-bold text-[--color-text]">{tier.name}</h3>
                    <p className="font-mono text-3xl font-bold text-[--color-accent-hover]">
                      {priceEur.toFixed(2)}
                      <span className="text-sm text-[--color-text-muted]"> EUR/{tier.period}</span>
                    </p>
                    <ul className="space-y-1 text-sm text-[--color-text-muted]">
                      <li className="flex items-center gap-1">
                        <Check size={14} className="text-[--color-success]" />
                        {tier.creditsPerPeriod} {t('credits.creditsPerMonth', 'credits/month')}
                      </li>
                      <li className="flex items-center gap-1">
                        <Check size={14} className="text-[--color-success]" />
                        {t('credits.cancelAnytime', 'Cancel anytime')}
                      </li>
                      <li className="flex items-center gap-1">
                        <Check size={14} className="text-[--color-success]" />
                        {t('credits.creditsRollover', 'Credits roll over (max 2 months)')}
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'primary' : 'secondary'}
                      onClick={() => checkoutMutation.mutate({ subscriptionTierId: tier.id })}
                      disabled={checkoutMutation.isPending}
                    >
                      {isPending ? t('common.loading', 'Loading…') : t('credits.subscribeTo', 'Subscribe')}
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
