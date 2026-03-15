import { useState } from "react";
import { trpc } from "../lib/trpc";
import WeeklyCalendar, {
  CalendarInstance,
  getWeekBounds,
  formatTime,
  formatDateRange,
} from "../components/WeeklyCalendar";
import ParticipantList from "../components/ParticipantList";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ─── Instance detail drawer ────────────────────────────────────────────────────

function InstanceDrawer({
  instance,
  onClose,
  onViewParticipants,
}: {
  instance: CalendarInstance;
  onClose: () => void;
  onViewParticipants: () => void;
}) {
  const booked = instance._count?.bookings ?? 0;
  const accent = instance.classType.color ?? "var(--accent)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="w-3 h-3 rounded-full mb-2" style={{ background: accent }} />
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>
              {instance.classType.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
              {instance.room.name}
            </p>
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
            <span style={{ color: "var(--text2)" }}>Datum</span>
            <span style={{ color: "var(--text)" }}>
              {new Date(instance.startAt).toLocaleDateString("de-DE", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text2)" }}>Buchungen</span>
            <span
              style={{
                color:
                  booked >= instance.maxCapacity
                    ? "#f87171"
                    : booked >= instance.maxCapacity * 0.8
                    ? "#fbbf24"
                    : "#34d399",
              }}
            >
              {booked} / {instance.maxCapacity}
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
          <button
            onClick={onViewParticipants}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Teilnehmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Monthly earnings summary ─────────────────────────────────────────────────

function EarningsSummary() {
  const { start, end } = getMonthBounds();

  // Fetch teacher's own instances for the month
  const { data: instances } = trpc.schedule.listInstances.useQuery(
    { from: start, to: end, limit: 200, offset: 0 },
    { retry: false }
  );

  // Fetch teacher profile for hourlyRate
  const { data: userProfile } = trpc.users.get.useQuery({}, { retry: false });

  const hourlyRate = (userProfile?.teacherProfile as { hourlyRate?: number } | null | undefined)?.hourlyRate ?? 0;

  const totalClasses = instances?.length ?? 0;
  const totalMinutes = instances?.reduce((sum, inst) => {
    const diff =
      new Date(inst.endAt).getTime() - new Date(inst.startAt).getTime();
    return sum + diff / 60_000;
  }, 0) ?? 0;
  const totalHours = totalMinutes / 60;
  const totalEarnings = hourlyRate * totalHours;

  const monthName = start.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <div
      className="rounded-xl p-5 mt-6"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: "var(--text2)" }}
      >
        Monatsverdienst — {monthName}
      </h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {totalClasses}
          </p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            Kurse
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {totalHours.toFixed(1)}h
          </p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            Unterrichtet
          </p>
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {hourlyRate > 0
              ? totalEarnings.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })
              : "—"}
          </p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            {hourlyRate > 0 ? `@ ${hourlyRate} €/h` : "Kein Stundensatz"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TeacherPortal() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstance, setSelectedInstance] = useState<CalendarInstance | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  const { monday, sunday } = getWeekBounds(weekOffset);

  const { data: instances, isLoading, isError } = trpc.schedule.listInstances.useQuery(
    { from: monday, to: sunday },
    { retry: false }
  );

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Mein Stundenplan
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
          className="rounded-lg px-4 py-3 text-sm mb-5"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Stundenplan konnte nicht geladen werden.
        </div>
      )}

      {/* Weekly calendar — teacher sees only own classes (server filters by teacherId) */}
      <WeeklyCalendar
        instances={instances ?? []}
        onInstanceClick={(inst) => {
          setSelectedInstance(inst);
          setShowParticipants(false);
        }}
        weekStart={monday}
        isLoading={isLoading}
        theme="dark"
      />

      {instances && (
        <p className="text-xs mt-3" style={{ color: "var(--text2)" }}>
          {instances.length} Kurse diese Woche
        </p>
      )}

      {/* Monthly earnings */}
      <EarningsSummary />

      {/* Instance detail */}
      {selectedInstance && !showParticipants && (
        <InstanceDrawer
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
          onViewParticipants={() => setShowParticipants(true)}
        />
      )}

      {/* Participant list modal */}
      {selectedInstance && showParticipants && (
        <ParticipantList
          instanceId={selectedInstance.id}
          instanceTitle={`${selectedInstance.classType.name} · ${formatTime(selectedInstance.startAt)}`}
          onClose={() => {
            setShowParticipants(false);
            setSelectedInstance(null);
          }}
        />
      )}
    </div>
  );
}
