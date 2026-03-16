import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays, isSameDay, startOfWeek, type Locale } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ClassCard } from './ClassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface ScheduleClass {
  id: string;
  name: string;
  teacherName: string;
  teacherInitials: string;
  time: string;
  duration: string;
  spotsLeft: number;
  totalSpots: number;
}

interface ScheduleViewProps {
  classes: ScheduleClass[];
  onBook?: (classId: string) => void;
  onJoinWaitlist?: (classId: string) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

function DaySelector({
  selectedDate,
  onSelect,
  locale,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  locale: Locale;
}) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={() => setWeekStart((d) => addDays(d, -7))}
        className="p-1 text-[--color-text-muted] hover:text-[--color-text] transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {days.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              className={cn(
                'flex flex-col items-center px-3 py-2 min-w-[3.5rem] rounded-none transition-colors duration-250',
                isSelected
                  ? 'bg-[--color-primary] text-white'
                  : 'hover:bg-[--color-surface] text-[--color-text]',
                isToday && !isSelected && 'border border-[--color-primary]',
              )}
            >
              <span className="text-xs font-semibold uppercase">
                {format(day, 'EEE', { locale })}
              </span>
              <span className="text-lg font-semibold">{format(day, 'd')}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => setWeekStart((d) => addDays(d, 7))}
        className="p-1 text-[--color-text-muted] hover:text-[--color-text] transition-colors"
        aria-label="Next week"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function ScheduleView({ classes, onBook, onJoinWaitlist, selectedDate: controlledDate, onDateChange }: ScheduleViewProps) {
  const { t, i18n } = useTranslation();
  const [internalDate, setInternalDate] = useState(new Date());
  const locale = i18n.language === 'de' ? de : enUS;

  const selectedDate = controlledDate ?? internalDate;
  const handleDateSelect = (date: Date) => {
    setInternalDate(date);
    onDateChange?.(date);
  };

  const dayClasses = classes;

  return (
    <div>
      <DaySelector selectedDate={selectedDate} onSelect={handleDateSelect} locale={locale} />
      {dayClasses.length === 0 ? (
        <EmptyState
          title={t('schedule.noClasses', 'No classes on this day')}
          description={t('schedule.noClassesDesc', 'Try selecting a different date.')}
        />
      ) : (
        <div className="space-y-3">
          {dayClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              {...cls}
              onBook={() => onBook?.(cls.id)}
              onJoinWaitlist={() => onJoinWaitlist?.(cls.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
