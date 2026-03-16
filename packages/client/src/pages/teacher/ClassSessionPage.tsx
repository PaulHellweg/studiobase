import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save } from 'lucide-react';
import { AttendanceRow } from '@/components/AttendanceRow';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export function ClassSessionPage() {
  const { sessionId } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const utils = trpc.useUtils();

  const { data: attendees, isLoading } = trpc.booking.listByInstance.useQuery(
    { scheduleInstanceId: sessionId!, limit: 100 },
    { enabled: !!sessionId },
  );

  const markAttended = trpc.booking.markAttended.useMutation({
    onSuccess: () => {
      utils.booking.listByInstance.invalidate({ scheduleInstanceId: sessionId! });
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleToggle = (id: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === status ? 'unmarked' : status,
    }));
  };

  const handleSave = async () => {
    const entries = Object.entries(attendance).filter(([_, status]) => status !== 'unmarked');
    for (const [bookingId, status] of entries) {
      const mappedStatus = status === 'present' ? 'attended' : 'no_show';
      await markAttended.mutateAsync({ bookingId, status: mappedStatus });
    }
    addToast(t('teacher.attendanceSaved', 'Attendance saved'), 'success');
  };

  const present = Object.values(attendance).filter((s) => s === 'present').length;
  const absent = Object.values(attendance).filter((s) => s === 'absent').length;
  const bookingList = attendees ?? [];

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-32 mb-6" />
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/teacher/schedule"
        className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
      >
        <ArrowLeft size={16} />
        {t('teacher.mySchedule', 'My Schedule')}
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-1">
            {t('teacher.classSession', 'Class Session')}
          </h1>
          <p className="text-sm text-[--color-text-muted] mb-6">
            {t('teacher.attendeeCount', '{{count}} attendees', { count: bookingList.length })}
          </p>
          {bookingList.length === 0 ? (
            <EmptyState title={t('teacher.noAttendees', 'No bookings for this session')} />
          ) : (
            <Card padding="none">
              <CardContent>
                {bookingList.map((a) => {
                  const nameParts = (a.studentName ?? '').split(' ');
                  const initials = nameParts.map((p) => p[0] ?? '').join('').toUpperCase().slice(0, 2);
                  return (
                    <AttendanceRow
                      key={a.id}
                      customerName={a.studentName ?? 'Unknown'}
                      customerInitials={initials}
                      bookingStatus={a.status as 'confirmed' | 'waitlisted'}
                      attendance={attendance[a.id] ?? (a.attendanceMarked ? (a.status === 'attended' ? 'present' : 'absent') : 'unmarked')}
                      onToggle={(status) => handleToggle(a.id, status)}
                    />
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent>
              <CardTitle className="mb-3">{t('teacher.stats', 'Session Stats')}</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[--color-text-muted]">{t('teacher.booked', 'Booked')}</span>
                  <span className="font-semibold">{bookingList.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-muted]">{t('teacher.present', 'Present')}</span>
                  <span className="font-semibold text-[--color-success]">{present}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--color-text-muted]">{t('teacher.absent', 'Absent')}</span>
                  <span className="font-semibold text-[--color-danger]">{absent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleSave} className="w-full" disabled={markAttended.isPending}>
            <Save size={16} className="mr-2" />
            {markAttended.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
