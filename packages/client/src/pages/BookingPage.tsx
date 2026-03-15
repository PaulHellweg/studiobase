import { useState } from "react";
import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import WeeklyCalendar, {
  CalendarInstance,
  getWeekBounds,
  formatTime,
  formatDateRange,
} from "../components/WeeklyCalendar";

const ACCENT = "#6366f1";

// ─── Public top nav (light theme) ─────────────────────────────────────────────
function PublicNav({ studioName, slug }: { studioName?: string; slug: string }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
      style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: ACCENT }}
        >
          {(studioName ?? slug).charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
          {studioName ?? slug}
        </span>
      </div>
      <a
        href={`/${slug}/credits`}
        className="text-xs font-medium px-3 py-1.5 rounded-full"
        style={{ background: `${ACCENT}15`, color: ACCENT }}
      >
        Credits kaufen
      </a>
    </header>
  );
}

// ─── Booking confirmation modal ────────────────────────────────────────────────
function BookingModal({
  instance,
  balance,
  onClose,
  onConfirm,
  isBooking,
  bookingSuccess,
}: {
  instance: CalendarInstance;
  balance: number;
  onClose: () => void;
  onConfirm: () => void;
  isBooking: boolean;
  bookingSuccess: boolean;
}) {
  const creditCost = instance.classType.creditCost ?? 0;
  const canBook = balance >= creditCost;
  const booked = instance._count?.bookings ?? 0;
  const spotsLeft = instance.maxCapacity - booked;
  const accent = instance.classType.color ?? ACCENT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6"
        style={{ background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#dcfce7" }}
            >
              <svg className="w-7 h-7" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#1a1a1a" }}>
              Buchung erfolgreich!
            </h2>
            <p className="text-sm" style={{ color: "#666" }}>
              Du hast <strong>{instance.classType.name}</strong> gebucht.
              {creditCost > 0 && ` ${creditCost} Credits wurden abgezogen.`}
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-xl font-semibold text-white text-sm"
              style={{ background: ACCENT }}
            >
              Schließen
            </button>
          </div>
        ) : (
          <>
            {/* Color dot */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${accent}20` }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: accent }} />
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "#1a1a1a" }}>
              {instance.classType.name}
            </h2>
            <p className="text-sm mb-5" style={{ color: "#666" }}>
              {instance.teacher.firstName} {instance.teacher.lastName} · {instance.room.name}
            </p>

            {/* Details grid */}
            <div
              className="rounded-xl p-4 mb-5 space-y-2 text-sm"
              style={{ background: "#f9fafb" }}
            >
              <div className="flex justify-between">
                <span style={{ color: "#666" }}>Zeit</span>
                <span style={{ color: "#1a1a1a" }}>
                  {formatTime(instance.startAt)} – {formatTime(instance.endAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#666" }}>Freie Plätze</span>
                <span style={{ color: spotsLeft <= 3 ? "#ef4444" : "#1a1a1a" }}>
                  {spotsLeft} von {instance.maxCapacity}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#666" }}>Kosten</span>
                <span style={{ color: "#1a1a1a" }}>
                  {creditCost === 0 ? "Kostenlos" : `${creditCost} Credits`}
                </span>
              </div>
              {creditCost > 0 && (
                <div className="flex justify-between" style={{ borderTop: "1px solid #e5e7eb", paddingTop: "8px", marginTop: "8px" }}>
                  <span style={{ color: "#666" }}>Dein Guthaben</span>
                  <span style={{ color: canBook ? "#16a34a" : "#ef4444", fontWeight: 600 }}>
                    {balance} Credits
                  </span>
                </div>
              )}
            </div>

            {!canBook && creditCost > 0 && (
              <p className="text-xs text-center mb-4" style={{ color: "#ef4444" }}>
                Nicht genug Credits.{" "}
                <a href="#credits" style={{ color: ACCENT, textDecoration: "underline" }}>
                  Credits kaufen →
                </a>
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: "#f3f4f6", color: "#666" }}
              >
                Abbrechen
              </button>
              <button
                onClick={onConfirm}
                disabled={!canBook || isBooking}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {isBooking ? "Wird gebucht…" : "Buchen"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstance, setSelectedInstance] = useState<CalendarInstance | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { monday, sunday } = getWeekBounds(weekOffset);
  const { showToast } = useToast();

  const { data: instances, isLoading, isError, refetch } = trpc.schedule.listInstances.useQuery(
    { from: monday, to: sunday },
    { retry: false }
  );

  const { data: balance } = trpc.credit.balance.get.useQuery(undefined, { retry: false });

  const bookMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      setBookingSuccess(true);
      void refetch();
      showToast("Buchung erfolgreich!", "success");
    },
    onError: (err) => {
      showToast(`Buchung fehlgeschlagen: ${err.message}`, "error");
    },
  });

  function handleBook() {
    if (!selectedInstance) return;
    bookMutation.mutate({ scheduleInstanceId: selectedInstance.id });
  }

  function handleClose() {
    setSelectedInstance(null);
    setBookingSuccess(false);
    bookMutation.reset();
  }

  const creditBalance = balance?.balance ?? 0;
  // Derive a display name from slug (replace dashes with spaces, title case)
  const displayName = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Studio";

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <PublicNav studioName={displayName} slug={slug ?? ""} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a1a" }}>
            Kurse buchen
          </h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            {formatDateRange(monday, sunday)}
          </p>
        </div>

        {/* Credit balance chip */}
        {creditBalance > 0 && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-5"
            style={{ background: `${ACCENT}12`, color: ACCENT }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {creditBalance} Credits verfügbar
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-2 rounded-lg"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#666" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#666" }}
            >
              Diese Woche
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-2 rounded-lg"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb", color: "#666" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {instances && (
            <p className="text-xs" style={{ color: "#666" }}>
              {instances.length} Kurse
            </p>
          )}
        </div>

        {isError && (
          <div
            className="rounded-xl px-4 py-3 text-sm mb-5"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
          >
            Kurse konnten nicht geladen werden. Bitte später erneut versuchen.
          </div>
        )}

        {/* Calendar */}
        <WeeklyCalendar
          instances={instances ?? []}
          onInstanceClick={(inst) => {
            setSelectedInstance(inst);
            setBookingSuccess(false);
          }}
          weekStart={monday}
          isLoading={isLoading}
          theme="light"
        />

        {instances && instances.length === 0 && !isLoading && (
          <p className="text-center text-sm mt-8" style={{ color: "#666" }}>
            Diese Woche sind keine Kurse geplant.
          </p>
        )}
      </div>

      {/* Booking confirmation modal */}
      {selectedInstance && (
        <BookingModal
          instance={selectedInstance}
          balance={creditBalance}
          onClose={handleClose}
          onConfirm={handleBook}
          isBooking={bookMutation.isPending}
          bookingSuccess={bookingSuccess}
        />
      )}
    </div>
  );
}
