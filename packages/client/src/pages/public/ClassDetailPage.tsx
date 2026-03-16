import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, Users, MapPin } from 'lucide-react';
import { subMonths, addMonths } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/trpc';

export function ClassDetailPage() {
  const { tenantSlug, classId } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();

  const dateFrom = subMonths(new Date(), 1).toISOString();
  const dateTo = addMonths(new Date(), 3).toISOString();

  const { data, isLoading } = trpc.schedule.listInstances.useQuery(
    { dateFrom, dateTo },
    { enabled: !!classId },
  );
  const utils = trpc.useUtils();

  const instance = data?.instances.find((i) => i.id === classId) ?? null;

  const bookMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      addToast(
        t('schedule.booked', 'Booked {{name}}!', { name: instance?.className ?? '' }),
        'success',
      );
      utils.schedule.listInstances.invalidate();
    },
    onError: (err) => {
      addToast(err.message ?? t('common.error', 'Something went wrong'), 'error');
    },
  });

  const waitlistMutation = trpc.waitlist.join.useMutation({
    onSuccess: (result) => {
      addToast(
        t('schedule.joinedWaitlist', 'Added to waitlist (position {{pos}})', { pos: result.position }),
        'success',
      );
      utils.schedule.listInstances.invalidate();
    },
    onError: (err) => {
      addToast(err.message ?? t('common.error', 'Something went wrong'), 'error');
    },
  });

  const handleAction = () => {
    if (!isAuthenticated) {
      addToast(t('schedule.loginToBook', 'Please log in to book a class'), 'info');
      return;
    }
    if (!instance) return;
    if (instance.spotsLeft > 0) {
      bookMutation.mutate({ scheduleInstanceId: instance.id });
    } else {
      waitlistMutation.mutate({ scheduleInstanceId: instance.id });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-5 w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div>
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div>
        <Link
          to={`/${tenantSlug}/schedule`}
          className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
        >
          <ArrowLeft size={16} />
          {t('common.back', 'Back')}
        </Link>
        <p className="text-[--color-text-muted]">{t('schedule.classNotFound', 'Class not found.')}</p>
      </div>
    );
  }

  const isPending = bookMutation.isPending || waitlistMutation.isPending;

  return (
    <div>
      <Link
        to={`/${tenantSlug}/schedule`}
        className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
      >
        <ArrowLeft size={16} />
        {t('common.back', 'Back')}
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-[--color-text]">{instance.className}</h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[--color-primary] text-white text-xs font-semibold rounded-none">
                {instance.teacherInitials}
              </span>
              <span className="text-[--color-text-muted]">{instance.teacherName}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[--color-text-muted]">
            <span className="inline-flex items-center gap-1">
              <Clock size={16} /> {instance.startTime}–{instance.endTime}
            </span>
            <span>{instance.duration} min</span>
            {instance.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={16} /> {instance.location}
              </span>
            )}
          </div>
        </div>
        <div>
          <Card>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[--color-text-muted]">{t('schedule.availability', 'Availability')}</span>
                  <Badge variant={instance.spotsLeft > 0 ? 'success' : 'danger'}>
                    <Users size={12} className="mr-1" />
                    {instance.spotsLeft > 0
                      ? t('schedule.spotsLeft', '{{count}} spots', { count: instance.spotsLeft })
                      : t('schedule.full', 'Full')}
                  </Badge>
                </div>
                <div className="text-xs text-[--color-text-muted]">
                  {instance.spotsLeft} / {instance.totalSpots} {t('schedule.available', 'available')}
                </div>
                <Button
                  className="w-full"
                  onClick={handleAction}
                  disabled={isPending}
                >
                  {isPending
                    ? t('common.loading', 'Loading…')
                    : instance.spotsLeft > 0
                      ? t('schedule.bookNow', 'Book Now ({{cost}} credit)', { cost: instance.creditCost })
                      : t('schedule.joinWaitlist', 'Join Waitlist')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
