import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { trpc } from '@/trpc';

export function ScheduleManagementPage() {
  const { t } = useTranslation();

  const { data: schedules, isLoading } = trpc.schedule.list.useQuery({ limit: 100 });

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

  const entries = schedules ?? [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold text-[--color-text]">
          {t('admin.scheduleManagement', 'Schedule')}
        </h1>
        <Link to="/admin/schedule/new">
          <Button>
            <Plus size={16} className="mr-2" />
            {t('admin.createEntry', 'New Entry')}
          </Button>
        </Link>
      </div>
      {entries.length === 0 ? (
        <EmptyState title={t('admin.noSchedule', 'No schedule entries')} action={<Link to="/admin/schedule/new"><Button>{t('admin.createEntry', 'New Entry')}</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link key={entry.id} to={`/admin/schedule/${entry.id}`}>
              <Card padding="md" className="hover:bg-[--color-background] transition-colors duration-250">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-base font-semibold text-[--color-text]">
                        Schedule #{entry.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-[--color-text-muted] mt-0.5">
                        {entry.dayOfWeek != null ? dayNames[entry.dayOfWeek] : 'One-off'} {entry.startTime}–{entry.endTime}
                      </p>
                    </div>
                    <Badge variant={entry.status === 'published' ? 'success' : entry.status === 'cancelled' ? 'danger' : 'muted'}>
                      {entry.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
