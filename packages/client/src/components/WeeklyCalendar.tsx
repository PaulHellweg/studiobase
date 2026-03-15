import { ReactNode } from "react";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
// JS getDay(): 0=Sun,1=Mon,...,6=Sat → display order Mon…Sun
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

export type CalendarInstance = {
  id: string;
  startAt: string | Date;
  endAt: string | Date;
  maxCapacity: number;
  classType: {
    id: string;
    name: string;
    color: string | null;
    durationMinutes: number;
    creditCost?: number;
  };
  room: { id: string; name: string };
  teacher: { id: string; firstName: string; lastName: string };
  _count?: { bookings: number };
};

export function getWeekBounds(offset = 0): { monday: Date; sunday: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysToMonday + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export function formatTime(dt: string | Date): string {
  return new Date(dt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateRange(monday: Date, sunday: Date): string {
  return `${monday.toLocaleDateString("de-DE", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}`;
}

type WeeklyCalendarProps = {
  instances: CalendarInstance[];
  onInstanceClick: (instance: CalendarInstance) => void;
  weekStart: Date; // the Monday of the displayed week
  isLoading?: boolean;
  /** Render a custom card; if not provided a default card is used */
  renderCard?: (instance: CalendarInstance) => ReactNode;
  /** Theme: "dark" uses CSS vars, "light" uses neutral palette */
  theme?: "dark" | "light";
};

function DefaultCard({
  instance,
  onClick,
  theme,
}: {
  instance: CalendarInstance;
  onClick: () => void;
  theme: "dark" | "light";
}) {
  const booked = instance._count?.bookings ?? 0;
  const isFull = booked >= instance.maxCapacity;
  const accent = instance.classType.color ?? "#6366f1";

  const cardBg = theme === "light" ? `${accent}15` : `${accent}20`;
  const textPrimary = theme === "light" ? "#1a1a1a" : "var(--text)";
  const textSecondary = theme === "light" ? "#666" : "var(--text2)";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md px-2 py-1.5 mb-1 transition-opacity hover:opacity-80"
      style={{ background: cardBg, borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-xs font-medium leading-tight truncate" style={{ color: textPrimary }}>
        {instance.classType.name}
      </p>
      <p className="text-xs leading-tight" style={{ color: textSecondary }}>
        {formatTime(instance.startAt)}
      </p>
      <p
        className="text-xs leading-tight"
        style={{ color: isFull ? "#ef4444" : textSecondary }}
      >
        {booked}/{instance.maxCapacity}
      </p>
    </button>
  );
}

export default function WeeklyCalendar({
  instances,
  onInstanceClick,
  weekStart,
  isLoading = false,
  renderCard,
  theme = "dark",
}: WeeklyCalendarProps) {
  // Group by JS day-of-week index
  const byDay: Record<number, CalendarInstance[]> = {};
  DAY_INDICES.forEach((d) => { byDay[d] = []; });

  instances.forEach((inst) => {
    const dow = new Date(inst.startAt).getDay();
    if (!byDay[dow]) byDay[dow] = [];
    byDay[dow].push(inst);
  });

  Object.keys(byDay).forEach((d) => {
    byDay[Number(d)].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
  });

  const borderColor = theme === "light" ? "#e5e7eb" : "var(--border)";
  const headerBg = theme === "light" ? "#f3f4f6" : "var(--surface2)";
  const cellBg = theme === "light" ? "#ffffff" : "var(--surface)";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${borderColor}` }}>
      {/* Day headers */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          background: headerBg,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        {DAYS.map((day, idx) => {
          const dayDate = new Date(weekStart);
          dayDate.setDate(weekStart.getDate() + idx);
          const isToday = dayDate.toDateString() === new Date().toDateString();
          const accentColor = theme === "light" ? "#6366f1" : "var(--accent)";
          const textColor = theme === "light" ? "#1a1a1a" : "var(--text)";
          const subtleColor = theme === "light" ? "#666" : "var(--text2)";

          return (
            <div
              key={day}
              className="px-3 py-3 text-center"
              style={{ borderRight: idx < 6 ? `1px solid ${borderColor}` : undefined }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: isToday ? accentColor : subtleColor }}
              >
                {day}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: isToday ? accentColor : textColor }}
              >
                {dayDate.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Day cells */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(7, 1fr)", background: cellBg, minHeight: "360px" }}
      >
        {DAY_INDICES.map((dow, idx) => {
          const cells = byDay[dow] ?? [];
          return (
            <div
              key={dow}
              className="p-2"
              style={{ borderRight: idx < 6 ? `1px solid ${borderColor}` : undefined }}
            >
              {isLoading && (
                <div
                  className="h-16 rounded-md animate-pulse"
                  style={{ background: theme === "light" ? "#f3f4f6" : "var(--surface2)" }}
                />
              )}
              {cells.map((inst) =>
                renderCard ? (
                  <div key={inst.id} onClick={() => onInstanceClick(inst)} className="cursor-pointer">
                    {renderCard(inst)}
                  </div>
                ) : (
                  <DefaultCard
                    key={inst.id}
                    instance={inst}
                    onClick={() => onInstanceClick(inst)}
                    theme={theme}
                  />
                )
              )}
              {!isLoading && cells.length === 0 && <div className="min-h-16" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
