import { useTranslation } from 'react-i18next';
import { Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface ClassCardProps {
  id: string;
  name: string;
  teacherName: string;
  teacherInitials: string;
  time: string;
  duration: string;
  spotsLeft: number;
  totalSpots: number;
  onBook?: () => void;
  onJoinWaitlist?: () => void;
  compact?: boolean;
}

export function ClassCard({
  name,
  teacherName,
  teacherInitials,
  time,
  duration,
  spotsLeft,
  totalSpots,
  onBook,
  onJoinWaitlist,
  compact = false,
}: ClassCardProps) {
  const { t } = useTranslation();
  const isFull = spotsLeft <= 0;

  return (
    <Card padding={compact ? 'sm' : 'md'}>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-heading font-semibold text-[--color-text] ${compact ? 'text-base' : 'text-lg'}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[--color-primary] text-white text-xs font-semibold rounded-none shrink-0">
                {teacherInitials}
              </span>
              <span className="text-sm text-[--color-text-muted]">{teacherName}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-[--color-text-muted]">
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                {time}
              </span>
              <span>{duration}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={isFull ? 'danger' : spotsLeft <= 3 ? 'accent' : 'success'}>
              <Users size={12} className="mr-1" />
              {isFull
                ? t('schedule.full', 'Full')
                : t('schedule.spotsLeft', '{{count}} spots', { count: spotsLeft })}
            </Badge>
            {!compact && (
              isFull ? (
                <Button variant="secondary" size="sm" onClick={onJoinWaitlist}>
                  {t('schedule.joinWaitlist', 'Waitlist')}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={onBook}>
                  {t('schedule.book', 'Book')}
                </Button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
