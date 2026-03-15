import { useState } from "react";
import { trpc } from "../lib/trpc";

const ACCENT = "#6366f1";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  attended: "Teilgenommen",
  no_show: "Nicht erschienen",
  waitlisted: "Warteliste",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#16a34a",
  attended: "#16a34a",
  no_show: "#dc2626",
  waitlisted: "#d97706",
  cancelled: "#9ca3af",
};

function formatDateTime(dt: string | Date): string {
  return new Date(dt).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PublicNav() {
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
          SB
        </div>
        <span className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
          Meine Buchungen
        </span>
      </div>
    </header>
  );
}

type BookingItem = {
  id: string;
  status: string;
  creditsUsed: number;
  createdAt: string | Date;
  cancelledAt?: string | Date | null;
  cancelReason?: string | null;
  scheduleInstance: {
    startAt: string | Date;
    endAt: string | Date;
    classType: { name: string; color?: string | null };
    room: { name: string };
  };
  user?: { firstName: string; lastName: string; email: string };
};

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: BookingItem;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const { scheduleInstance: inst } = booking;
  const startAt = new Date(inst.startAt);
  const isPast = startAt < new Date();
  const canCancel =
    !isPast &&
    (booking.status === "confirmed" || booking.status === "waitlisted") &&
    // Only allow cancel if > 2h before
    startAt.getTime() - Date.now() > 2 * 60 * 60 * 1000;

  const accent = inst.classType.color ?? ACCENT;
  const statusColor = STATUS_COLORS[booking.status] ?? "#9ca3af";
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 self-stretch rounded-full shrink-0 min-h-12"
          style={{ background: accent }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
              {inst.classType.name}
            </p>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{ color: statusColor, background: `${statusColor}18` }}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs mb-1" style={{ color: "#666" }}>
            {formatDateTime(inst.startAt)}
          </p>
          <p className="text-xs" style={{ color: "#666" }}>
            {inst.room.name}
            {booking.creditsUsed > 0 && ` · ${booking.creditsUsed} Credits`}
          </p>
        </div>
      </div>

      {canCancel && onCancel && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f3f4f6" }}>
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="text-xs font-medium disabled:opacity-50"
            style={{ color: "#dc2626" }}
          >
            {cancelling ? "Wird storniert…" : "Buchung stornieren"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyBookings() {
  const now = new Date();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const upcomingQuery = trpc.booking.list.useQuery(
    {
      from: now,
      limit: 50,
      offset: 0,
      status: "confirmed",
    },
    { retry: false }
  );

  const pastQuery = trpc.booking.list.useQuery(
    {
      to: now,
      limit: 20,
      offset: 0,
    },
    { retry: false }
  );

  const cancelMutation = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      setCancellingId(null);
      void upcomingQuery.refetch();
      void pastQuery.refetch();
    },
    onError: () => setCancellingId(null),
  });

  function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    cancelMutation.mutate({ bookingId });
  }

  const upcomingItems = upcomingQuery.data?.items ?? [];
  const pastItems = (pastQuery.data?.items ?? []).filter(
    (b) => new Date(b.scheduleInstance.startAt) < now
  );

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <PublicNav />

      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6" style={{ color: "#1a1a1a" }}>
          Meine Buchungen
        </h1>

        {/* Upcoming */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>
            Kommende Kurse
          </h2>

          {upcomingQuery.isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ background: "#e5e7eb" }}
                />
              ))}
            </div>
          )}

          {!upcomingQuery.isLoading && upcomingItems.length === 0 && (
            <div
              className="rounded-xl px-4 py-8 text-center"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              <p className="text-sm" style={{ color: "#666" }}>
                Keine kommenden Buchungen
              </p>
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                Buche deinen nächsten Kurs unter /book
              </p>
            </div>
          )}

          {upcomingItems.length > 0 && (
            <div className="space-y-3">
              {upcomingItems.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking as BookingItem}
                  onCancel={() => handleCancel(booking.id)}
                  cancelling={cancellingId === booking.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#666" }}>
            Vergangene Kurse
          </h2>

          {pastQuery.isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl animate-pulse"
                  style={{ background: "#e5e7eb" }}
                />
              ))}
            </div>
          )}

          {!pastQuery.isLoading && pastItems.length === 0 && (
            <div
              className="rounded-xl px-4 py-6 text-center"
              style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
            >
              <p className="text-sm" style={{ color: "#9ca3af" }}>
                Noch keine vergangenen Buchungen
              </p>
            </div>
          )}

          {pastItems.length > 0 && (
            <div className="space-y-3">
              {pastItems.map((booking) => (
                <BookingCard key={booking.id} booking={booking as BookingItem} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
