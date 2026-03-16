import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export function MyBookingsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: bookings, isLoading } = trpc.booking.list.useQuery({ limit: 100 });

  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      addToast(t('booking.cancelled', 'Booking cancelled. Credit returned.'), 'success');
      setCancelId(null);
      utils.booking.list.invalidate();
      utils.credit.getBalance.invalidate();
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleCancel = () => {
    if (cancelId) {
      cancelBooking.mutate({ bookingId: cancelId });
    }
  };

  const now = new Date();
  const upcoming = bookings?.filter((b) => b.status === 'confirmed') ?? [];
  const past = bookings?.filter((b) => b.status !== 'confirmed') ?? [];

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('nav.bookings', 'My Bookings')}
      </h1>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            {t('booking.upcoming', 'Upcoming')} ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            {t('booking.past', 'Past')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyState
              title={t('booking.noUpcoming', "You haven't booked any classes yet")}
              description={t('booking.noUpcomingDesc', 'Browse the schedule to find your next class.')}
              action={<Link to="/"><Button>{t('schedule.browseSchedule', 'Browse Schedule')}</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  id={b.id}
                  className={b.className ?? 'Class'}
                  teacherName={b.teacherName ?? 'Teacher'}
                  date={b.date ? format(new Date(b.date), 'EEE, MMM d') : ''}
                  time={b.startTime ?? ''}
                  status={b.status as 'confirmed' | 'cancelled'}
                  creditsUsed={b.creditsUsed}
                  canCancel={b.status === 'confirmed'}
                  onCancel={() => setCancelId(b.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {past.length === 0 ? (
            <EmptyState title={t('booking.noPast', 'No past bookings')} />
          ) : (
            <div className="space-y-3">
              {past.map((b) => (
                <BookingCard
                  key={b.id}
                  id={b.id}
                  className={b.className ?? 'Class'}
                  teacherName={b.teacherName ?? 'Teacher'}
                  date={b.date ? format(new Date(b.date), 'EEE, MMM d') : ''}
                  time={b.startTime ?? ''}
                  status={b.status as 'confirmed' | 'cancelled'}
                  creditsUsed={b.creditsUsed}
                  canCancel={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      <Modal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        title={t('booking.cancelTitle', 'Cancel Booking')}
        description={t('booking.cancelDesc', 'Are you sure? Your credit will be returned.')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelId(null)}>
              {t('common.back', 'Back')}
            </Button>
            <Button variant="danger" onClick={handleCancel} disabled={cancelBooking.isPending}>
              {cancelBooking.isPending ? t('common.loading', 'Loading...') : t('booking.confirmCancel', 'Yes, Cancel')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[--color-text-muted]">
          {t('booking.cancelNote', 'Cancellation is immediate. If the class is full, the next person on the waitlist will be notified.')}
        </p>
      </Modal>
    </div>
  );
}
