import { useState } from "react";
import { trpc } from "../lib/trpc";

type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string | Date;
  creditBalance: { balance: number } | null;
  teacherProfile: { id: string } | null;
};

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{ background: "var(--accent)", color: "white" }}
    >
      {initials}
    </div>
  );
}

function CustomerRow({
  user,
  expanded,
  onToggle,
}: {
  user: UserProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const balance = user.creditBalance?.balance ?? 0;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Customer booking history (only loaded when expanded)
  const bookingsQuery = trpc.booking.list.useQuery(
    { userId: user.id, limit: 10 },
    { enabled: expanded, retry: false }
  );

  // Credit transactions (only loaded when expanded)
  const txQuery = trpc.credit.transactions.list.useQuery(
    { userId: user.id, limit: 10 },
    { enabled: expanded, retry: false }
  );

  return (
    <>
      <tr
        className="cursor-pointer transition-colors"
        onClick={onToggle}
        style={{
          background: expanded ? "var(--surface2)" : "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar name={fullName} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {fullName}
              </p>
              <p className="text-xs" style={{ color: "var(--text2)" }}>
                {user.email}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm" style={{ color: "var(--text2)" }}>
          {user.phone ?? "—"}
        </td>
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-md"
            style={{
              background: balance > 0 ? "#34d39920" : "var(--surface2)",
              color: balance > 0 ? "#34d399" : "var(--text2)",
            }}
          >
            {balance} Kredite
          </span>
        </td>
        <td className="px-4 py-3 text-xs" style={{ color: "var(--text2)" }}>
          {joinedDate}
        </td>
        <td className="px-4 py-3">
          {user.teacherProfile && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent)20", color: "var(--accent)" }}
            >
              Lehrer/in
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <svg
            className="w-4 h-4 inline-block transition-transform"
            style={{
              color: "var(--text2)",
              transform: expanded ? "rotate(180deg)" : undefined,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {/* Expanded details */}
      {expanded && (
        <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking history */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text2)" }}>
                  Buchungshistorie
                </h4>
                {bookingsQuery.isLoading && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Wird geladen…</p>
                )}
                {bookingsQuery.isError && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Nicht verfügbar</p>
                )}
                {bookingsQuery.data && bookingsQuery.data.items.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Keine Buchungen</p>
                )}
                {bookingsQuery.data && bookingsQuery.data.items.length > 0 && (
                  <div className="space-y-1.5">
                    {bookingsQuery.data.items.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                        style={{ background: "var(--surface)" }}
                      >
                        <span style={{ color: "var(--text)" }}>
                          {new Date(booking.createdAt).toLocaleDateString("de-DE")}
                        </span>
                        <span
                          style={{
                            color:
                              booking.status === "confirmed" || booking.status === "attended"
                                ? "#34d399"
                                : booking.status === "cancelled"
                                ? "#f87171"
                                : "var(--text2)",
                          }}
                        >
                          {booking.status === "confirmed"
                            ? "Bestätigt"
                            : booking.status === "attended"
                            ? "Teilgenommen"
                            : booking.status === "cancelled"
                            ? "Storniert"
                            : booking.status === "waitlisted"
                            ? "Warteliste"
                            : "Nicht erschienen"}
                        </span>
                        <span style={{ color: "var(--text2)" }}>
                          {booking.creditsUsed} Kredit{booking.creditsUsed !== 1 ? "e" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Credit transactions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text2)" }}>
                  Kredit-Transaktionen
                </h4>
                {txQuery.isLoading && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Wird geladen…</p>
                )}
                {txQuery.isError && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Nicht verfügbar</p>
                )}
                {txQuery.data && txQuery.data.items.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Keine Transaktionen</p>
                )}
                {txQuery.data && txQuery.data.items.length > 0 && (
                  <div className="space-y-1.5">
                    {txQuery.data.items.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                        style={{ background: "var(--surface)" }}
                      >
                        <span style={{ color: "var(--text)" }}>
                          {new Date(tx.createdAt).toLocaleDateString("de-DE")}
                        </span>
                        <span style={{ color: "var(--text2)" }}>
                          {tx.type === "purchase"
                            ? "Kauf"
                            : tx.type === "deduction"
                            ? "Abzug"
                            : tx.type === "refund"
                            ? "Erstattung"
                            : tx.type === "admin_adjustment"
                            ? "Admin"
                            : "Ablauf"}
                        </span>
                        <span
                          style={{ color: tx.amount > 0 ? "#34d399" : "#f87171" }}
                        >
                          {tx.amount > 0 ? "+" : ""}{tx.amount}
                        </span>
                        <span style={{ color: "var(--text2)" }}>
                          → {tx.balanceAfter}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  };

  const { data, isLoading, isError } = trpc.users.list.useQuery(
    {
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    { retry: false }
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Kunden
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Kundenübersicht und Buchungshistorie
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div
          className="flex items-center gap-2 px-3 rounded-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text2)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="flex-1 py-2.5 text-sm bg-transparent outline-none"
            style={{ color: "var(--text)" }}
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => handleSearch("")} style={{ color: "var(--text2)" }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Server nicht erreichbar — Kundenliste kann nicht geladen werden.
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              {["Kunde", "Telefon", "Guthaben", "Beigetreten", "Rolle", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text2)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ background: "var(--surface2)", width: j === 1 ? "60%" : "40%" }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {data?.items.map((user) => (
              <CustomerRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
              />
            ))}

            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "var(--text2)", background: "var(--surface)" }}>
                  Keine Kunden gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} von {data.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}
            >
              Zurück
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= data.total}
              className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text2)" }}
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {data && (
        <p className="text-xs mt-2" style={{ color: "var(--text2)" }}>
          {data.total} Kunden gesamt
        </p>
      )}
    </div>
  );
}
