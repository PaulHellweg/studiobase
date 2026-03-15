import { useState } from "react";
import { trpc } from "../lib/trpc";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // Mon=1 ... Sun=0 (JS getDay)

type ScheduleInstance = {
  id: string;
  startAt: string | Date;
  endAt: string | Date;
  maxCapacity: number;
  status: string;
  classType: {
    id: string;
    name: string;
    color: string | null;
    durationMinutes: number;
  };
  room: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    bookings: number;
  };
};

function getWeekBounds(offset: number = 0) {
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

function formatTime(dt: string | Date): string {
  const d = new Date(dt);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDateRange(monday: Date, sunday: Date): string {
  return `${monday.toLocaleDateString("de-DE", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}`;
}

function InstanceCard({
  instance,
  onClick,
}: {
  instance: ScheduleInstance;
  onClick: () => void;
}) {
  const booked = instance._count?.bookings ?? 0;
  const isFull = booked >= instance.maxCapacity;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md px-2 py-1.5 mb-1 transition-opacity hover:opacity-80"
      style={{
        background: `${instance.classType.color ?? "#8b5cf6"}20`,
        borderLeft: `3px solid ${instance.classType.color ?? "#8b5cf6"}`,
      }}
    >
      <p className="text-xs font-medium leading-tight truncate" style={{ color: "var(--text)" }}>
        {instance.classType.name}
      </p>
      <p className="text-xs leading-tight" style={{ color: "var(--text2)" }}>
        {formatTime(instance.startAt)}
      </p>
      <p className="text-xs leading-tight" style={{ color: isFull ? "#f87171" : "var(--text2)" }}>
        {booked}/{instance.maxCapacity}
      </p>
    </button>
  );
}

type InstanceDetailProps = {
  instance: ScheduleInstance;
  onClose: () => void;
  onCancelInstance: (instanceId: string) => void;
  cancelling: boolean;
};

function InstanceDetail({ instance, onClose, onCancelInstance, cancelling }: InstanceDetailProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
    >
      <div
        className="rounded-xl p-6 w-full max-w-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{ background: instance.classType.color ?? "var(--accent)" }}
            />
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>
              {instance.classType.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ color: "var(--text2)" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 text-sm mb-5">
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Zeit</span>
            <span style={{ color: "var(--text)" }}>
              {formatTime(instance.startAt)} – {formatTime(instance.endAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Raum</span>
            <span style={{ color: "var(--text)" }}>{instance.room.name}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Lehrer/in</span>
            <span style={{ color: "var(--text)" }}>
              {instance.teacher.firstName} {instance.teacher.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Buchungen</span>
            <span style={{ color: "var(--text)" }}>
              {instance._count?.bookings ?? 0} / {instance.maxCapacity}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Status</span>
            <span
              style={{
                color: instance.status === "scheduled" ? "#34d399" : "#f87171",
              }}
            >
              {instance.status === "scheduled"
                ? "Geplant"
                : instance.status === "cancelled"
                ? "Abgesagt"
                : "Abgeschlossen"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm"
            style={{ color: "var(--text2)", background: "var(--surface2)" }}
          >
            Schließen
          </button>
          {instance.status === "scheduled" && (
            <button
              onClick={() => onCancelInstance(instance.id)}
              disabled={cancelling}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ color: "#f87171", background: "var(--surface2)" }}
            >
              {cancelling ? "Wird abgesagt…" : "Absagen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstance, setSelectedInstance] = useState<ScheduleInstance | null>(null);

  const { monday, sunday } = getWeekBounds(weekOffset);

  const { data, isLoading, isError, refetch } = trpc.schedule.listInstances.useQuery(
    { from: monday, to: sunday },
    { retry: false }
  );

  const cancelMutation = trpc.schedule.overrideInstance.useMutation({
    onSuccess: () => {
      setSelectedInstance(null);
      void refetch();
    },
  });

  // Group instances by day-of-week index (0=Sun...6=Sat) → map to display index
  const byDay: Record<number, ScheduleInstance[]> = {};
  DAY_INDICES.forEach((d) => {
    byDay[d] = [];
  });

  if (data) {
    data.forEach((inst) => {
      const dow = new Date(inst.startAt).getDay();
      if (!byDay[dow]) byDay[dow] = [];
      byDay[dow].push(inst);
    });
    // Sort each day by time
    Object.keys(byDay).forEach((d) => {
      byDay[Number(d)].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      );
    });
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Stundenplan
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            {formatDateRange(monday, sunday)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            Heute
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {isError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Server nicht erreichbar — Stundenplan kann nicht geladen werden.
        </div>
      )}

      {/* Calendar grid */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Day headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            background: "var(--surface2)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {DAYS.map((day, idx) => {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + idx);
            const isToday = dayDate.toDateString() === new Date().toDateString();
            return (
              <div
                key={day}
                className="px-3 py-3 text-center"
                style={{ borderRight: idx < 6 ? "1px solid var(--border)" : undefined }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                  style={{ color: isToday ? "var(--accent)" : "var(--text2)" }}
                >
                  {day}
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: isToday ? "var(--accent)" : "var(--text)" }}
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
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            background: "var(--surface)",
            minHeight: "400px",
          }}
        >
          {DAY_INDICES.map((dow, idx) => {
            const instances = byDay[dow] ?? [];
            return (
              <div
                key={dow}
                className="p-2"
                style={{ borderRight: idx < 6 ? "1px solid var(--border)" : undefined }}
              >
                {isLoading && (
                  <div
                    className="h-16 rounded-md animate-pulse"
                    style={{ background: "var(--surface2)" }}
                  />
                )}
                {instances.map((inst) => (
                  <InstanceCard
                    key={inst.id}
                    instance={inst}
                    onClick={() => setSelectedInstance(inst)}
                  />
                ))}
                {!isLoading && instances.length === 0 && (
                  <div className="h-full min-h-16" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {data && (
        <p className="text-xs mt-3" style={{ color: "var(--text2)" }}>
          {data.length} Kurse diese Woche
        </p>
      )}

      {/* Instance detail modal */}
      {selectedInstance && (
        <InstanceDetail
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
          onCancelInstance={(id) =>
            cancelMutation.mutate({ instanceId: id, isCancelled: true, cancelReason: "Admin-Absage" })
          }
          cancelling={cancelMutation.isPending}
        />
      )}
    </div>
  );
}
