import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard, SkeletonBox } from "../components/Skeleton";

// ─── Greeting helper ──────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  loading?: boolean;
}) {
  if (loading) return <SkeletonCard />;

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text2)" }}>
        {label}
      </p>
      <p className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "var(--text2)" }}>{sub}</p>}
    </div>
  );
}

// ─── Server offline banner ───────────────────────────────────────────────────

function ServerOfflineBanner() {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Server nicht erreichbar — Daten werden angezeigt, sobald der Server verfügbar ist.
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    scheduled: { label: "Geplant", color: "#34d399", bg: "#34d39920" },
    cancelled: { label: "Abgesagt", color: "#f87171", bg: "#f8717120" },
    completed: { label: "Abgeschlossen", color: "#a1a1aa", bg: "#a1a1aa20" },
  };
  const c = config[status] ?? config.scheduled;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </span>
  );
}

// ─── Today's schedule ─────────────────────────────────────────────────────────

function TodaysSchedule() {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data, isLoading, isError, refetch } = trpc.schedule.listInstances.useQuery(
    { from: todayStart, to: todayEnd },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <SkeletonBox key={i} height="3.5rem" rounded="lg" className="w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg px-4 py-6 text-center" style={{ background: "var(--surface2)" }}>
        <p className="text-sm mb-2" style={{ color: "var(--text2)" }}>
          Daten nicht verfügbar
        </p>
        <button
          onClick={() => void refetch()}
          className="text-xs px-3 py-1.5 rounded-md"
          style={{ background: "var(--surface)", color: "var(--text2)", border: "1px solid var(--border)" }}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg px-4 py-8 text-center" style={{ background: "var(--surface2)" }}>
        <p className="text-sm" style={{ color: "var(--text2)" }}>
          Heute keine Kurse geplant
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((instance) => {
        const start = new Date(instance.startAt);
        const end = new Date(instance.endAt);
        const booked = instance._count?.bookings ?? 0;
        const pct = instance.maxCapacity > 0 ? Math.round((booked / instance.maxCapacity) * 100) : 0;
        const isFull = booked >= instance.maxCapacity;

        return (
          <div
            key={instance.id}
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ background: instance.classType.color ?? "var(--accent)", minHeight: "2.5rem" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                {instance.classType.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>
                {start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–
                {end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                {" · "}
                {instance.teacher.firstName} {instance.teacher.lastName}
                {" · "}
                {instance.room.name}
              </p>
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-1">
              <StatusBadge status={instance.status} />
              <p className="text-xs" style={{ color: isFull ? "#f87171" : "var(--text2)" }}>
                {booked}/{instance.maxCapacity} ({pct}%)
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Recent bookings ──────────────────────────────────────────────────────────

type BookingStatus = "confirmed" | "attended" | "cancelled" | "waitlisted" | "no_show";

function RecentBookings() {
  const { data, isLoading } = trpc.booking.list.useQuery(
    { limit: 5, offset: 0 },
    { retry: false }
  );

  const statusLabel: Record<BookingStatus, string> = {
    confirmed: "Bestätigt",
    attended: "Teilgenommen",
    cancelled: "Storniert",
    waitlisted: "Warteliste",
    no_show: "Nicht erschienen",
  };

  const statusColor: Record<BookingStatus, string> = {
    confirmed: "#34d399",
    attended: "#34d399",
    cancelled: "#f87171",
    waitlisted: "#fbbf24",
    no_show: "#f87171",
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBox height="2rem" width="2rem" rounded="full" />
            <div className="flex-1 space-y-1">
              <SkeletonBox height="0.75rem" width="60%" rounded="sm" />
              <SkeletonBox height="0.6rem" width="40%" rounded="sm" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="text-xs py-4" style={{ color: "var(--text2)" }}>
        Noch keine Buchungen vorhanden
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((booking) => {
        const status = booking.status as BookingStatus;
        const name = booking.user
          ? `${booking.user.firstName} ${booking.user.lastName}`
          : "Unbekannt";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div key={booking.id} className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "var(--accent)", color: "white" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
                {name}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text2)" }}>
                {new Date(booking.createdAt).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className="text-xs font-medium shrink-0"
              style={{ color: statusColor[status] ?? "var(--text2)" }}
            >
              {statusLabel[status] ?? status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    {
      label: "Neuen Kurs anlegen",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => navigate("/classes"),
    },
    {
      label: "Stundenplan bearbeiten",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => navigate("/schedule"),
    },
    {
      label: "Pakete verwalten",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      onClick: () => navigate("/plans"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          <span style={{ color: "var(--accent)" }}>{action.icon}</span>
          {action.label}
          <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text2)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Stats queries
  const instancesQuery = trpc.schedule.listInstances.useQuery(
    { from: todayStart, to: todayEnd },
    { retry: false }
  );

  const todayBookingsQuery = trpc.booking.list.useQuery(
    { from: todayStart, to: todayEnd, limit: 1 },
    { retry: false }
  );

  const customersQuery = trpc.users.list.useQuery(
    { limit: 1, offset: 0 },
    { retry: false }
  );

  const serverOnline = !instancesQuery.isError;
  const greeting = getGreeting();
  const firstName = user?.email.split("@")[0] ?? "";

  const todayInstances = instancesQuery.data ?? [];
  const freeSpots = todayInstances.reduce((sum, inst) => {
    const booked = inst._count?.bookings ?? 0;
    return sum + Math.max(0, inst.maxCapacity - booked);
  }, 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header with greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-0.5" style={{ color: "var(--text)" }}>
          {greeting}, {firstName}
        </h1>
        <p className="text-sm" style={{ color: "var(--text2)" }}>
          {today.toLocaleDateString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {!serverOnline && <ServerOfflineBanner />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Buchungen heute"
          value={todayBookingsQuery.data?.total ?? "—"}
          sub="bestätigt"
          loading={todayBookingsQuery.isLoading}
        />
        <StatCard
          label="Umsatz Monat"
          value="—"
          sub={monthStart.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
        />
        <StatCard
          label="Aktive Kunden"
          value={customersQuery.data?.total ?? "—"}
          sub="gesamt registriert"
          loading={customersQuery.isLoading}
        />
        <StatCard
          label="Freie Plätze heute"
          value={serverOnline ? freeSpots : "—"}
          sub={`${todayInstances.length} Kurs${todayInstances.length !== 1 ? "e" : ""} geplant`}
          loading={instancesQuery.isLoading}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's schedule — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Heutiger Stundenplan
            </h2>
            <TodaysSchedule />
          </div>

          {/* Quick actions */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Schnellaktionen
            </h2>
            <QuickActions />
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Recent bookings */}
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Letzte Buchungen
            </h2>
            <RecentBookings />
          </div>
        </div>
      </div>
    </div>
  );
}
