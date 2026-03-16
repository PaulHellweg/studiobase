import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Clock, Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { trpc } from '@/trpc';
import { format, startOfDay, addDays } from 'date-fns';

interface SessionInstance {
  id: string;
  date: Date | string;
  className: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  totalSpots: number;
}

function SessionRow({ session }: { session: SessionInstance }) {
  const booked = session.totalSpots - session.spotsLeft;
  return (
    <Link to={`/teacher/class/${session.id}`}>
      <Card padding="md" className="hover:bg-[--color-background] transition-colors duration-250">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-[--color-text]">{session.className}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-[--color-text-muted]">
                <span>{format(new Date(session.date), 'EEE, MMM d')}</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {session.startTime}–{session.endTime}</span>
              </div>
            </div>
            <Badge variant={booked >= session.totalSpots ? 'danger' : 'success'}>
              <Users size={12} className="mr-1" />
              {booked}/{session.totalSpots}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TeacherSchedulePage() {
  const { t } = useTranslation();

  const now = new Date();
  const { data: upcoming, isLoading: loadingUpcoming } = trpc.schedule.listByTeacher.useQuery({
    dateFrom: startOfDay(now).toISOString(),
    dateTo: addDays(now, 30).toISOString(),
  });
  const { data: past, isLoading: loadingPast } = trpc.schedule.listByTeacher.useQuery({
    dateFrom: addDays(now, -30).toISOString(),
    dateTo: startOfDay(now).toISOString(),
  });

  const isLoading = loadingUpcoming || loadingPast;

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const upcomingInstances = upcoming?.instances ?? [];
  const pastInstances = past?.instances ?? [];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-[--color-text] mb-6">
        {t('teacher.mySchedule', 'My Schedule')}
      </h1>
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">{t('booking.upcoming', 'Upcoming')}</TabsTrigger>
          <TabsTrigger value="past">{t('booking.past', 'Past')}</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {upcomingInstances.length === 0 ? (
            <EmptyState title={t('teacher.noUpcoming', 'No upcoming classes')} />
          ) : (
            <div className="space-y-3">
              {upcomingInstances.map((s) => <SessionRow key={s.id} session={s} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past">
          {pastInstances.length === 0 ? (
            <EmptyState title={t('teacher.noPast', 'No past classes')} />
          ) : (
            <div className="space-y-3">
              {pastInstances.map((s) => <SessionRow key={s.id} session={s} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
