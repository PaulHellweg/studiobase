import { useTranslation } from 'react-i18next';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type AttendanceStatus = 'present' | 'absent' | 'unmarked';

interface AttendanceRowProps {
  customerName: string;
  customerInitials: string;
  bookingStatus: 'confirmed' | 'waitlisted';
  attendance: AttendanceStatus;
  onToggle: (status: AttendanceStatus) => void;
}

const bookingVariants: Record<string, BadgeVariant> = {
  confirmed: 'success',
  waitlisted: 'accent',
};

export function AttendanceRow({
  customerName,
  customerInitials,
  bookingStatus,
  attendance,
  onToggle,
}: AttendanceRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between py-3 px-3 border-b border-[--color-border]/50 hover:bg-[--color-surface] transition-colors duration-250">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-8 h-8 bg-[--color-primary] text-white text-xs font-semibold rounded-none shrink-0">
          {customerInitials}
        </span>
        <div>
          <p className="text-sm font-semibold text-[--color-text]">{customerName}</p>
          <Badge variant={bookingVariants[bookingStatus]} className="mt-0.5">
            {t(`booking.status.${bookingStatus}`, bookingStatus)}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onToggle('present')}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-none border transition-colors duration-250',
            attendance === 'present'
              ? 'bg-[--color-success] text-white border-[--color-success]'
              : 'border-[--color-border] text-[--color-text-muted] hover:border-[--color-success] hover:text-[--color-success]',
          )}
        >
          {t('teacher.present', 'Present')}
        </button>
        <button
          onClick={() => onToggle('absent')}
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-none border transition-colors duration-250',
            attendance === 'absent'
              ? 'bg-[--color-danger] text-white border-[--color-danger]'
              : 'border-[--color-border] text-[--color-text-muted] hover:border-[--color-danger] hover:text-[--color-danger]',
          )}
        >
          {t('teacher.absent', 'Absent')}
        </button>
      </div>
    </div>
  );
}
