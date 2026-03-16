import { useTranslation } from 'react-i18next';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, X } from 'lucide-react';

type BookingStatus = 'confirmed' | 'cancelled' | 'waitlisted';

interface BookingCardProps {
  id: string;
  className: string;
  teacherName: string;
  date: string;
  time: string;
  status: BookingStatus;
  creditsUsed: number;
  canCancel: boolean;
  onCancel?: () => void;
}

const statusVariants: Record<BookingStatus, BadgeVariant> = {
  confirmed: 'success',
  cancelled: 'danger',
  waitlisted: 'accent',
};

export function BookingCard({
  className: classTitle,
  teacherName,
  date,
  time,
  status,
  creditsUsed,
  canCancel,
  onCancel,
}: BookingCardProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-base font-semibold text-[--color-text]">
              {classTitle}
            </h3>
            <p className="text-sm text-[--color-text-muted] mt-1">{teacherName}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-[--color-text-muted]">
              <span>{date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={14} />
                {time}
              </span>
              <span>{creditsUsed} {t('booking.credits', 'credits')}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={statusVariants[status]}>
              {t(`booking.status.${status}`, status)}
            </Badge>
            {canCancel && status === 'confirmed' && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X size={14} className="mr-1" />
                {t('booking.cancel', 'Cancel')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
