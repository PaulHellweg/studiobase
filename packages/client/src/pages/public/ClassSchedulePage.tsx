import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startOfWeek, endOfWeek } from 'date-fns';
import { ScheduleView } from '@/components/ScheduleView';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/trpc';

interface ScheduleInstance {
  id: string;
  date: string;
  className: string;
  teacherName: string;
  teacherInitials: string;
  startTime: string;
  endTime: string;
  duration: number;
  spotsLeft: number;
  totalSpots: number;
  creditCost: number;
  location: string | null;
  status: string;
  capacity: number;
}

export function ClassSchedulePage() {
  const { tenantSlug } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [confirmInstance, setConfirmInstance] = useState<ScheduleInstance | null>(null);

  // Fetch 2 weeks of data
  const now = new Date();
  const dateFrom = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const dateTo = endOfWeek(new Date(now.getTime() + 14 * 86400000), { weekStartsOn: 1 }).toISOString();

  const { data, isLoading } = trpc.schedule.listInstances.useQuery({ dateFrom, dateTo });
  const utils = trpc.useUtils();

  const bookMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      addToast(
        t('schedule.booked', 'Booked {{name}}!', { name: confirmInstance?.className ?? '' }),
        'success',
      );
      setConfirmInstance(null);
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

  const allInstances: ScheduleInstance[] = data?.instances ?? [];

  // ScheduleView handles day filtering internally
  const scheduleClasses = allInstances.map((i) => ({
    id: i.id,
    name: i.className,
    teacherName: i.teacherName,
    teacherInitials: i.teacherInitials,
    time: `${i.startTime}–${i.endTime}`,
    duration: `${i.duration} min`,
    spotsLeft: i.spotsLeft,
    totalSpots: i.totalSpots,
  }));

  const handleBook = (classId: string) => {
    const instance = allInstances.find((i) => i.id === classId);
    if (!instance) return;
    if (!isAuthenticated) {
      addToast(t('schedule.loginToBook', 'Please log in to book a class'), 'info');
      return;
    }
    if (instance.spotsLeft <= 0) {
      waitlistMutation.mutate({ scheduleInstanceId: classId });
      return;
    }
    setConfirmInstance(instance);
  };

  const handleConfirmBooking = () => {
    if (confirmInstance) {
      bookMutation.mutate({ scheduleInstanceId: confirmInstance.id });
    }
  };

  const handleJoinWaitlist = (classId: string) => {
    if (!isAuthenticated) {
      addToast(t('schedule.loginToBook', 'Please log in to join the waitlist'), 'info');
      return;
    }
    waitlistMutation.mutate({ scheduleInstanceId: classId });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">
          {t('schedule.title', 'Class Schedule')}
        </h1>
        {tenantSlug && (
          <p className="text-[--color-text-muted] mt-1">{tenantSlug.replace(/-/g, ' ')}</p>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <ScheduleView
          classes={scheduleClasses}
          onBook={handleBook}
          onJoinWaitlist={handleJoinWaitlist}
        />
      )}
      <Modal
        open={!!confirmInstance}
        onClose={() => setConfirmInstance(null)}
        title={t('schedule.confirmBooking', 'Confirm Booking')}
        description={
          confirmInstance
            ? `${confirmInstance.className} — ${confirmInstance.startTime}–${confirmInstance.endTime}`
            : ''
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmInstance(null)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBooking}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending
                ? t('common.loading', 'Loading…')
                : t('schedule.confirmBook', 'Book ({{cost}} credit)', {
                    cost: confirmInstance?.creditCost ?? 1,
                  })}
            </Button>
          </>
        }
      >
        {confirmInstance && (
          <div className="text-sm text-[--color-text-muted] space-y-2">
            <p>{t('schedule.teacher', 'Teacher')}: {confirmInstance.teacherName}</p>
            <p>{t('schedule.duration', 'Duration')}: {confirmInstance.duration} min</p>
            <p>{t('schedule.spotsRemaining', 'Spots remaining')}: {confirmInstance.spotsLeft}</p>
            {confirmInstance.location && (
              <p>{t('schedule.location', 'Location')}: {confirmInstance.location}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
