import { trpc } from "../lib/trpc";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
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

function TodaysClasses() {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const { data, isLoading, isError } = trpc.schedule.listInstances.useQuery(
    { from: todayStart, to: todayEnd },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg animate-pulse"
            style={{ background: "var(--surface2)" }}
          />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg px-4 py-6 text-center" style={{ background: "var(--surface2)" }}>
        <p className="text-sm" style={{ color: "var(--text2)" }}>
          Keine Verbindung zum Server
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg px-4 py-6 text-center" style={{ background: "var(--surface2)" }}>
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
        const pct = Math.round((booked / instance.maxCapacity) * 100);

        return (
          <div
            key={instance.id}
            className="flex items-center gap-4 rounded-lg px-4 py-3"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ background: instance.classType.color ?? "var(--accent)" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                {instance.classType.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>
                {start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}–
                {end.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} · {instance.room.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
                {booked}/{instance.maxCapacity}
              </p>
              <p className="text-xs" style={{ color: pct >= 80 ? "#f87171" : "var(--text2)" }}>
                {pct}%
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const instancesQuery = trpc.schedule.listInstances.useQuery(
    { from: todayStart, to: todayEnd },
    { retry: false }
  );

  const serverOnline = !instancesQuery.isError;

  const todayBookings = 0; // Would come from booking query
  const monthRevenue = "—";

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--text2)" }}>
          {today.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {!serverOnline && <ServerOfflineBanner />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Kurse heute"
          value={instancesQuery.data?.length ?? "—"}
          sub={serverOnline ? "geplant" : "nicht verfügbar"}
        />
        <StatCard
          label="Buchungen heute"
          value={serverOnline ? todayBookings : "—"}
          sub={serverOnline ? "bestätigt" : "nicht verfügbar"}
        />
        <StatCard
          label="Umsatz (Monat)"
          value={serverOnline ? monthRevenue : "—"}
          sub={monthStart.toLocaleDateString("de-DE", { month: "long" })}
        />
        <StatCard
          label="Aktive Kunden"
          value="—"
          sub="letzten 30 Tage"
        />
      </div>

      {/* Today's schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Heutige Kurse
            </h2>
            <TodaysClasses />
          </div>
        </div>

        {/* Activity feed placeholder */}
        <div>
          <div
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: "var(--text2)" }}>
              Letzte Aktivität
            </h2>
            <div className="space-y-3">
              {[
                { text: "Anna Schmidt hat Yoga Flow gebucht", time: "vor 12 Min." },
                { text: "Lisa Bauer hat 20er Karte gekauft", time: "vor 1 Std." },
                { text: "Tom Klein: Pilates Mat storniert", time: "vor 2 Std." },
                { text: "Neuer Kurs: Sound Healing angelegt", time: "gestern" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text)" }}>{item.text}</p>
                    <p className="text-xs" style={{ color: "var(--text2)" }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            {!serverOnline && (
              <p className="text-xs mt-4 pt-3" style={{ color: "var(--text2)", borderTop: "1px solid var(--border)" }}>
                Echtzeitdaten nicht verfügbar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
