import { trpc } from "../lib/trpc";

type ParticipantListProps = {
  instanceId: string;
  instanceTitle?: string;
  onClose: () => void;
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Bestätigt",
  attended: "Anwesend",
  no_show: "Nicht erschienen",
  waitlisted: "Warteliste",
  cancelled: "Storniert",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#34d399",
  attended: "#34d399",
  no_show: "#f87171",
  waitlisted: "#fbbf24",
  cancelled: "#6b7280",
};

export default function ParticipantList({
  instanceId,
  instanceTitle,
  onClose,
}: ParticipantListProps) {
  const { data, isLoading, refetch } = trpc.booking.list.useQuery(
    { scheduleInstanceId: instanceId, limit: 100, offset: 0 },
    { retry: false }
  );

  const markAttendance = trpc.booking.markAttendance.useMutation({
    onSuccess: () => void refetch(),
  });

  const activeBookings = data?.items.filter(
    (b) => b.status !== "cancelled"
  ) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="rounded-xl w-full max-w-md max-h-[85vh] flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              Teilnehmerliste
            </h2>
            {instanceTitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                {instanceTitle}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: "var(--text2)" }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg animate-pulse"
                  style={{ background: "var(--surface2)" }}
                />
              ))}
            </div>
          )}

          {!isLoading && activeBookings.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "var(--text2)" }}>
                Keine Buchungen für diese Klasse
              </p>
            </div>
          )}

          {!isLoading && activeBookings.length > 0 && (
            <div className="p-3 space-y-1">
              {activeBookings.map((booking) => {
                const name = booking.user
                  ? `${booking.user.firstName} ${booking.user.lastName}`
                  : "Unbekannt";
                const email = booking.user?.email ?? "";
                const statusColor = STATUS_COLORS[booking.status] ?? "#6b7280";
                const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;
                return (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "var(--surface2)" }}
                  >
                    {/* Avatar placeholder */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 text-white"
                      style={{ background: "#6366f1" }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text2)" }}>
                        {email}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ color: statusColor, background: `${statusColor}20` }}
                    >
                      {statusLabel}
                    </span>

                    {/* Attendance toggle buttons (only for confirmed/attended/no_show) */}
                    {(booking.status === "confirmed" ||
                      booking.status === "attended" ||
                      booking.status === "no_show") && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          title="Anwesend"
                          disabled={markAttendance.isPending}
                          onClick={() =>
                            markAttendance.mutate({
                              bookingId: booking.id,
                              status: "attended",
                            })
                          }
                          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                          style={{
                            background:
                              booking.status === "attended" ? "#34d39930" : "var(--surface)",
                            border: `1px solid ${booking.status === "attended" ? "#34d399" : "var(--border)"}`,
                          }}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke={booking.status === "attended" ? "#34d399" : "var(--text2)"}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </button>
                        <button
                          title="Nicht erschienen"
                          disabled={markAttendance.isPending}
                          onClick={() =>
                            markAttendance.mutate({
                              bookingId: booking.id,
                              status: "no_show",
                            })
                          }
                          className="w-7 h-7 rounded flex items-center justify-center transition-colors"
                          style={{
                            background:
                              booking.status === "no_show" ? "#f8717130" : "var(--surface)",
                            border: `1px solid ${booking.status === "no_show" ? "#f87171" : "var(--border)"}`,
                          }}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke={booking.status === "no_show" ? "#f87171" : "var(--text2)"}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            {activeBookings.filter((b) => b.status === "confirmed" || b.status === "attended").length} bestätigt
            {activeBookings.some((b) => b.status === "waitlisted") &&
              ` · ${activeBookings.filter((b) => b.status === "waitlisted").length} Warteliste`}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm"
            style={{ background: "var(--surface2)", color: "var(--text2)" }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
