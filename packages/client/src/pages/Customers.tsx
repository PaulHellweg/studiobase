import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import { SkeletonRow } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

// ─── Credit adjustment modal ──────────────────────────────────────────────────

function CreditAdjustModal({
  user,
  onClose,
  onDone,
}: {
  user: UserProfile;
  onClose: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const { showToast } = useToast();

  const mutation = trpc.credit.balance.adjust.useMutation({
    onSuccess: () => {
      showToast("Credits angepasst", "success");
      onDone();
      onClose();
    },
    onError: (e) => showToast(`Fehler: ${e.message}`, "error"),
  });

  const amountNum = parseInt(amount, 10);
  const isValid = !isNaN(amountNum) && amountNum !== 0 && reason.trim().length >= 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl w-full max-w-sm p-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
          Credits anpassen
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--text2)" }}>
          {user.firstName} {user.lastName} · Aktuell: {user.creditBalance?.balance ?? 0} Credits
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Betrag (positiv = hinzufügen, negativ = abziehen)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="z.B. +10 oder -5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
              Grund (mind. 3 Zeichen)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="z.B. Gutschrift für Kursausfall"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        {!isNaN(amountNum) && amountNum !== 0 && (
          <div
            className="mt-3 rounded-lg px-3 py-2 text-xs"
            style={{ background: "var(--surface2)" }}
          >
            <span style={{ color: "var(--text2)" }}>Neues Guthaben: </span>
            <span className="font-semibold" style={{ color: amountNum > 0 ? "#34d399" : "#f87171" }}>
              {(user.creditBalance?.balance ?? 0) + amountNum} Credits
            </span>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg text-sm"
            style={{ color: "var(--text2)", background: "var(--surface2)" }}
          >
            Abbrechen
          </button>
          <button
            onClick={() =>
              mutation.mutate({
                userId: user.id,
                amount: amountNum,
                reason: reason.trim(),
              })
            }
            disabled={!isValid || mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}
          >
            {mutation.isPending ? "Wird gespeichert…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer row ─────────────────────────────────────────────────────────────

function CustomerRow({
  user,
  expanded,
  onToggle,
  onAdjustCredits,
}: {
  user: UserProfile;
  expanded: boolean;
  onToggle: () => void;
  onAdjustCredits: () => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`;
  const balance = user.creditBalance?.balance ?? 0;
  const joinedDate = new Date(user.createdAt).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const bookingsQuery = trpc.booking.list.useQuery(
    { userId: user.id, limit: 10 },
    { enabled: expanded, retry: false }
  );

  const txQuery = trpc.credit.transactions.list.useQuery(
    { userId: user.id, limit: 10 },
    { enabled: expanded, retry: false }
  );

  const bookingStatusLabel: Record<string, string> = {
    confirmed: "Bestätigt",
    attended: "Teilgenommen",
    cancelled: "Storniert",
    waitlisted: "Warteliste",
    no_show: "Nicht erschienen",
  };

  const bookingStatusColor: Record<string, string> = {
    confirmed: "#34d399",
    attended: "#34d399",
    cancelled: "#f87171",
    waitlisted: "#fbbf24",
    no_show: "#f87171",
  };

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
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{fullName}</p>
              <p className="text-xs truncate" style={{ color: "var(--text2)" }}>{user.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: "var(--text2)" }}>
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
            {balance} Credits
          </span>
        </td>
        <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ color: "var(--text2)" }}>
          {joinedDate}
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          {user.teacherProfile && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
            >
              Lehrer/in
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <svg
            className="w-4 h-4 inline-block transition-transform"
            style={{ color: "var(--text2)", transform: expanded ? "rotate(180deg)" : undefined }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
          <td colSpan={6} className="px-6 py-4">
            {/* Credit adjust button */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                Details
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); onAdjustCredits(); }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Credits anpassen
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking history */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text2)" }}>
                  Buchungshistorie
                </h4>
                {bookingsQuery.isLoading && (
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--surface)" }} />
                    ))}
                  </div>
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
                        <span style={{ color: bookingStatusColor[booking.status] ?? "var(--text2)" }}>
                          {bookingStatusLabel[booking.status] ?? booking.status}
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
                  <div className="space-y-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--surface)" }} />
                    ))}
                  </div>
                )}
                {txQuery.isError && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Nicht verfügbar</p>
                )}
                {txQuery.data && txQuery.data.items.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text2)" }}>Keine Transaktionen</p>
                )}
                {txQuery.data && txQuery.data.items.length > 0 && (
                  <div className="space-y-1.5">
                    {txQuery.data.items.map((tx) => {
                      const typeLabel: Record<string, string> = {
                        purchase: "Kauf",
                        deduction: "Abzug",
                        refund: "Erstattung",
                        admin_adjustment: "Admin",
                        expiry: "Ablauf",
                      };
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-xs px-3 py-2 rounded-lg"
                          style={{ background: "var(--surface)" }}
                        >
                          <span style={{ color: "var(--text)" }}>
                            {new Date(tx.createdAt).toLocaleDateString("de-DE")}
                          </span>
                          <span style={{ color: "var(--text2)" }}>
                            {typeLabel[tx.type] ?? tx.type}
                          </span>
                          <span style={{ color: tx.amount > 0 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
                          </span>
                          <span style={{ color: "var(--text2)" }}>→ {tx.balanceAfter}</span>
                        </div>
                      );
                    })}
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Customers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjustUser, setAdjustUser] = useState<UserProfile | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data, isLoading, isError, refetch } = trpc.users.list.useQuery(
    { search: debouncedSearch || undefined, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
    { retry: false }
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Kunden</h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Kundenübersicht und Buchungshistorie
            {data && ` · ${data.total} gesamt`}
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
          className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center justify-between"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          <span>Server nicht erreichbar — Kundenliste kann nicht geladen werden.</span>
          <button
            onClick={() => void refetch()}
            className="text-xs px-3 py-1.5 rounded-md shrink-0 ml-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            Erneut
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                Kunde
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--text2)" }}>
                Telefon
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                Guthaben
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--text2)" }}>
                Beigetreten
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--text2)" }}>
                Rolle
              </th>
              <th className="px-4 py-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} cols={6} />
              ))}

            {data?.items.map((user) => (
              <CustomerRow
                key={user.id}
                user={user}
                expanded={expandedId === user.id}
                onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
                onAdjustCredits={() => setAdjustUser(user)}
              />
            ))}

            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ background: "var(--surface)" }}>
                  <EmptyState
                    title={debouncedSearch ? "Keine Treffer" : "Noch keine Kunden"}
                    description={debouncedSearch ? `Keine Kunden für "${debouncedSearch}" gefunden.` : undefined}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
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

      {/* Credit adjustment modal */}
      {adjustUser && (
        <CreditAdjustModal
          user={adjustUser}
          onClose={() => setAdjustUser(null)}
          onDone={() => void refetch()}
        />
      )}
    </div>
  );
}
