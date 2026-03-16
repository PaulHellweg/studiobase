import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'muted'> = {
  confirmed: 'success',
  cancelled: 'danger',
  attended: 'success',
  no_show: 'muted',
};

export function BookingDetailPage() {
  const { bookingId } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();

  const { data: booking, isLoading } = trpc.booking.get.useQuery(
    { id: bookingId! },
    { enabled: !!bookingId },
  );
  const utils = trpc.useUtils();

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      addToast(t('booking.cancelled', 'Booking cancelled'), 'success');
      utils.booking.get.invalidate({ id: bookingId! });
    },
    onError: (err) => {
      addToast(err.message ?? t('common.error', 'Something went wrong'), 'error');
    },
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-5 w-24 mb-6" />
        <div className="max-w-lg">
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div>
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
        >
          <ArrowLeft size={16} />
          {t('nav.bookings', 'My Bookings')}
        </Link>
        <p className="text-[--color-text-muted]">{t('booking.notFound', 'Booking not found.')}</p>
      </div>
    );
  }

  const formattedDate = booking.instanceDate
    ? format(new Date(booking.instanceDate), 'EEE, MMM d, yyyy')
    : '';

  const statusVariant = STATUS_VARIANT[booking.status] ?? 'muted';
  const canCancel = booking.status === 'confirmed';

  return (
    <div>
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
      >
        <ArrowLeft size={16} />
        {t('nav.bookings', 'My Bookings')}
      </Link>
      <Card className="max-w-lg">
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="font-heading text-xl font-bold text-[--color-text]">{booking.className}</h1>
              <Badge variant={statusVariant}>
                {t(`booking.status.${booking.status}`, booking.status)}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-[--color-text-muted]">
              <p>{booking.teacherName}</p>
              <p className="flex items-center gap-1">
                <Clock size={14} /> {formattedDate} {booking.startTime}–{booking.endTime}
              </p>
              {booking.location && (
                <p className="flex items-center gap-1">
                  <MapPin size={14} /> {booking.location}
                </p>
              )}
              <p>
                {booking.creditsUsed}{' '}
                {booking.creditsUsed === 1
                  ? t('booking.creditUsed', 'credit used')
                  : t('booking.creditsUsed', 'credits used')}
              </p>
            </div>
            {canCancel && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => cancelMutation.mutate({ bookingId: bookingId! })}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? t('common.loading', 'Loading…')
                  : t('booking.cancel', 'Cancel Booking')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
