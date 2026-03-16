import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';

export function StudioLandingPage() {
  const { tenantSlug } = useParams();
  const { t } = useTranslation();

  const { data, isLoading } = trpc.studio.getBySlug.useQuery(
    { slug: tenantSlug! },
    { enabled: !!tenantSlug },
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-3/4 max-w-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const studioName = data?.studio?.name ?? (tenantSlug ? tenantSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Studio');
  const description = data?.studio?.description ?? '';
  const address = data?.studio?.address ?? '';
  const hours = ''; // Studio table has no openingHours field

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="font-heading text-4xl font-bold text-[--color-text]">
          {studioName}
        </h1>
        {description && (
          <p className="text-lg text-[--color-text-muted] max-w-2xl">
            {description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {address && (
          <Card>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-[--color-accent-hover] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[--color-text]">{t('studio.location', 'Location')}</p>
                  <p className="text-sm text-[--color-text-muted] mt-0.5">{address}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {hours && (
          <Card>
            <CardContent>
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-[--color-accent-hover] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[--color-text]">{t('studio.hours', 'Hours')}</p>
                  <p className="text-sm text-[--color-text-muted] mt-0.5">{hours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent>
            <Link to={`/${tenantSlug}/schedule`} className="block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-[--color-text]">{t('studio.viewSchedule', 'View Schedule')}</p>
                  <p className="text-sm text-[--color-text-muted] mt-0.5">{t('studio.browseClasses', 'Browse available classes')}</p>
                </div>
                <ArrowRight size={20} className="text-[--color-accent-hover]" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
      <div className="pt-4">
        <Link to={`/${tenantSlug}/schedule`}>
          <Button size="lg">
            {t('studio.seeSchedule', 'See Full Schedule')}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
