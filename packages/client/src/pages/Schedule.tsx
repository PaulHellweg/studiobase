import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import WeeklyCalendar, {
  CalendarInstance,
  getWeekBounds,
  formatTime,
  formatDateRange,
} from "../components/WeeklyCalendar";

// ─── Instance detail modal ─────────────────────────────────────────────────────

type InstanceDetailProps = {
  instance: CalendarInstance;
  onClose: () => void;
  onCancelInstance: (id: string) => void;
  cancelling: boolean;
};

function InstanceDetail({ instance, onClose, onCancelInstance, cancelling }: InstanceDetailProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const booked = instance._count?.bookings ?? 0;
  const pct = instance.maxCapacity > 0 ? Math.round((booked / instance.maxCapacity) * 100) : 0;

  // Load participants
  const { data: bookings, isLoading: loadingBookings } = trpc.booking.list.useQuery(
    { scheduleInstanceId: instance.id, limit: 50, offset: 0 },
    { retry: false }
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={onClose}
      >
        <div
          className="rounded-xl w-full max-w-md overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 flex items-start justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: instance.classType.color ?? "var(--accent)" }}
              />
              <div>
                <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                  {instance.classType.name}
                </h2>
                <p className="text-xs" style={{ color: "var(--text2)" }}>
                  {new Date(instance.startAt).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:opacity-70" style={{ color: "var(--text2)" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Details */}
          <div className="px-6 py-4 space-y-3 text-sm" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text2)" }}>Zeit</p>
                <p style={{ color: "var(--text)" }}>
                  {formatTime(instance.startAt)} – {formatTime(instance.endAt)}
                </p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text2)" }}>Raum</p>
                <p style={{ color: "var(--text)" }}>{instance.room.name}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text2)" }}>Lehrer/in</p>
                <p style={{ color: "var(--text)" }}>
                  {instance.teacher.firstName} {instance.teacher.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text2)" }}>Auslastung</p>
                <p style={{ color: pct >= 100 ? "#f87171" : pct >= 80 ? "#fbbf24" : "#34d399" }}>
                  {booked}/{instance.maxCapacity} ({pct}%)
                </p>
              </div>
            </div>
          </div>

          {/* Participant list */}
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)", maxHeight: "200px", overflowY: "auto" }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text2)" }}>
              Teilnehmer ({booked})
            </p>
            {loadingBookings ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--surface2)" }} />
                ))}
              </div>
            ) : bookings && bookings.items.length > 0 ? (
              <div className="space-y-1">
                {bookings.items.map((b) => {
                  const name = b.user
                    ? `${b.user.firstName} ${b.user.lastName}`
                    : "Unbekannt";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const statusColor: Record<string, string> = {
                    confirmed: "#34d399",
                    attended: "#34d399",
                    waitlisted: "#fbbf24",
                    cancelled: "#f87171",
                    no_show: "#f87171",
                  };
                  return (
                    <div key={b.id} className="flex items-center gap-2 py-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ background: "var(--accent)", color: "white" }}
                      >
                        {initials}
                      </div>
                      <span className="text-sm flex-1 truncate" style={{ color: "var(--text)" }}>
                        {name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: statusColor[b.status] ?? "var(--text2)" }}
                      >
                        {b.status === "confirmed" ? "✓" : b.status === "waitlisted" ? "⏳" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs" style={{ color: "var(--text2)" }}>Noch keine Buchungen</p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              Schließen
            </button>
            {((instance as unknown as { status?: string }).status === "scheduled" || !(instance as unknown as { status?: string }).status) && (
              <button
                onClick={() => setConfirmCancel(true)}
                disabled={cancelling}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ color: "#f87171", background: "var(--surface2)" }}
              >
                {cancelling ? "Wird abgesagt…" : "Kurs absagen"}
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title="Kurs absagen"
          message={`Möchtest du "${instance.classType.name}" wirklich absagen? Alle Buchungen werden storniert.`}
          confirmLabel="Ja, absagen"
          variant="danger"
          loading={cancelling}
          onConfirm={() => {
            setConfirmCancel(false);
            onCancelInstance(instance.id);
          }}
          onCancel={() => setConfirmCancel(false)}
        />
      )}
    </>
  );
}

// ─── Create schedule form modal ────────────────────────────────────────────────
// Creates a schedule definition (which auto-generates instances)

function CreateScheduleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState({
    classTypeId: "",
    roomId: "",
    teacherId: "",
    startDate: "",
    startTime: "09:00",
    endTime: "10:00",
    maxCapacity: "15",
    recurrenceType: "none" as "none" | "daily" | "weekly",
  });

  const { data: studiosData } = trpc.studio.list.useQuery({ includeDeleted: false }, { retry: false });
  const { data: teachersData } = trpc.users.list.useQuery({ limit: 100 }, { retry: false });
  const { showToast } = useToast();

  // Flatten rooms from all studios
  const rooms = studiosData?.items.flatMap((s) =>
    s.rooms.filter((r) => r.isActive).map((r) => ({ id: r.id, name: `${r.name} (${s.name})` }))
  ) ?? [];

  const teachers = (teachersData?.items ?? []).filter((u) => u.teacherProfile);

  const createMutation = trpc.schedule.create.useMutation({
    onSuccess: () => {
      showToast("Kurs erfolgreich angelegt", "success");
      onCreated();
      onClose();
    },
    onError: (err) => {
      setFormError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!values.roomId || !values.teacherId || !values.startDate || !values.classTypeId) {
      setFormError("Alle Felder sind erforderlich");
      return;
    }
    const cap = parseInt(values.maxCapacity, 10);
    createMutation.mutate({
      classTypeId: values.classTypeId,
      roomId: values.roomId,
      teacherId: values.teacherId,
      startDate: new Date(values.startDate),
      startTime: values.startTime,
      endTime: values.endTime,
      maxCapacity: cap,
      recurrenceType: values.recurrenceType,
      recurrenceDays: [],
    });
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-md overflow-y-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center justify-between sticky top-0" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
            Neuer Kurs anlegen
          </h2>
          <button onClick={onClose} style={{ color: "var(--text2)" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Kurstyp-ID
            </label>
            <input
              style={inputStyle}
              placeholder="UUID des Kurstyps"
              value={values.classTypeId}
              onChange={(e) => setValues((v) => ({ ...v, classTypeId: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Raum
            </label>
            <select
              style={inputStyle}
              value={values.roomId}
              onChange={(e) => setValues((v) => ({ ...v, roomId: e.target.value }))}
            >
              <option value="">Raum auswählen…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Lehrer/in
            </label>
            <select
              style={inputStyle}
              value={values.teacherId}
              onChange={(e) => setValues((v) => ({ ...v, teacherId: e.target.value }))}
            >
              <option value="">Lehrer auswählen…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Startdatum
            </label>
            <input
              type="date"
              style={inputStyle}
              value={values.startDate}
              onChange={(e) => setValues((v) => ({ ...v, startDate: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
                Beginn
              </label>
              <input
                type="time"
                style={inputStyle}
                value={values.startTime}
                onChange={(e) => setValues((v) => ({ ...v, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
                Ende
              </label>
              <input
                type="time"
                style={inputStyle}
                value={values.endTime}
                onChange={(e) => setValues((v) => ({ ...v, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Wiederholung
            </label>
            <select
              style={inputStyle}
              value={values.recurrenceType}
              onChange={(e) => setValues((v) => ({ ...v, recurrenceType: e.target.value as "none" | "daily" | "weekly" }))}
            >
              <option value="none">Einmalig</option>
              <option value="weekly">Wöchentlich</option>
              <option value="daily">Täglich</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Max. Teilnehmer
            </label>
            <input
              type="number"
              min={1}
              max={999}
              style={inputStyle}
              value={values.maxCapacity}
              onChange={(e) => setValues((v) => ({ ...v, maxCapacity: e.target.value }))}
            />
          </div>

          {formError && (
            <p className="text-xs" style={{ color: "#f87171" }}>{formError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {createMutation.isPending ? "Wird angelegt…" : "Anlegen"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main schedule page ────────────────────────────────────────────────────────

export default function Schedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstance, setSelectedInstance] = useState<CalendarInstance | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();

  const { monday, sunday } = getWeekBounds(weekOffset);

  const { data, isLoading, isError, refetch } = trpc.schedule.listInstances.useQuery(
    { from: monday, to: sunday },
    { retry: false }
  );

  const cancelMutation = trpc.schedule.overrideInstance.useMutation({
    onSuccess: () => {
      setSelectedInstance(null);
      void refetch();
      showToast("Kurs erfolgreich abgesagt", "success");
    },
    onError: (err) => {
      showToast(`Fehler: ${err.message}`, "error");
    },
  });

  return (
    <div className="p-6 lg:p-8">
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
          {/* Week navigation */}
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

          {/* New class button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ml-2"
            style={{ background: "var(--accent)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Neue Klasse</span>
          </button>
        </div>
      </div>

      {isError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center justify-between gap-3"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          <span>Server nicht erreichbar — Stundenplan kann nicht geladen werden.</span>
          <button
            onClick={() => void refetch()}
            className="text-xs px-3 py-1.5 rounded-md shrink-0"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            Erneut
          </button>
        </div>
      )}

      {/* Calendar */}
      <WeeklyCalendar
        instances={data ?? []}
        onInstanceClick={(inst) => setSelectedInstance(inst)}
        weekStart={monday}
        isLoading={isLoading}
        theme="dark"
      />

      {data && (
        <p className="text-xs mt-3" style={{ color: "var(--text2)" }}>
          {data.length} Kurs{data.length !== 1 ? "e" : ""} diese Woche
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

      {/* Create schedule modal */}
      {showCreateModal && (
        <CreateScheduleModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => void refetch()}
        />
      )}
    </div>
  );
}
