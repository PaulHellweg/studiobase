import { useState } from "react";
import { trpc } from "../lib/trpc";

type Room = {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
};

type Studio = {
  id: string;
  name: string;
  address: string;
  timezone: string;
  isActive: boolean;
  rooms: Room[];
};

function ServerError({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {message}
    </div>
  );
}

function StudioForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Studio>;
  onSubmit: (data: { name: string; address: string; timezone: string }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "Europe/Berlin");

  const inputStyle = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, address, timezone });
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Name
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
          style={{ ...inputStyle, outlineColor: "var(--accent)" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Studio Mitte"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Adresse
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-1"
          style={{ ...inputStyle, outlineColor: "var(--accent)" }}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Straße, PLZ Stadt"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Zeitzone
        </label>
        <select
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          <option value="Europe/Berlin">Europe/Berlin</option>
          <option value="Europe/Vienna">Europe/Vienna</option>
          <option value="Europe/Zurich">Europe/Zurich</option>
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ color: "var(--text2)", background: "var(--surface2)" }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

function StudioCard({ studio, onEdit }: { studio: Studio; onEdit: (s: Studio) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {studio.name}
              </h3>
              {!studio.isActive && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--surface2)", color: "var(--text2)" }}
                >
                  Inaktiv
                </span>
              )}
            </div>
            <p className="text-xs mb-1" style={{ color: "var(--text2)" }}>
              {studio.address}
            </p>
            <p className="text-xs" style={{ color: "var(--text2)" }}>
              {studio.rooms.length} Räume · {studio.timezone}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              {expanded ? "Zuklappen" : "Räume"}
            </button>
            <button
              onClick={() => onEdit(studio)}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              Bearbeiten
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="px-5 pb-5 pt-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mt-4 mb-3" style={{ color: "var(--text2)" }}>
            Räume
          </p>
          <div className="space-y-2">
            {studio.rooms.length === 0 && (
              <p className="text-xs" style={{ color: "var(--text2)" }}>Keine Räume angelegt</p>
            )}
            {studio.rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "var(--surface2)" }}
              >
                <span className="text-sm" style={{ color: "var(--text)" }}>
                  {room.name}
                </span>
                <span className="text-xs" style={{ color: "var(--text2)" }}>
                  {room.capacity} Plätze
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Studios() {
  const [showForm, setShowForm] = useState(false);
  const [editStudio, setEditStudio] = useState<Studio | null>(null);

  const { data, isLoading, isError, refetch } = trpc.studio.list.useQuery(
    { includeDeleted: false },
    { retry: false }
  );

  const createMutation = trpc.studio.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      void refetch();
    },
  });

  const updateMutation = trpc.studio.update.useMutation({
    onSuccess: () => {
      setEditStudio(null);
      void refetch();
    },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Studios
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Standorte und Räume verwalten
          </p>
        </div>
        {!showForm && !editStudio && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Studio hinzufügen
          </button>
        )}
      </div>

      {isError && (
        <div className="mb-6">
          <ServerError message="Server nicht erreichbar — Studios können nicht geladen werden." />
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Neues Studio
          </h2>
          <StudioForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            loading={createMutation.isPending}
          />
          {createMutation.isError && (
            <p className="text-xs mt-2" style={{ color: "#f87171" }}>
              Fehler: {createMutation.error.message}
            </p>
          )}
        </div>
      )}

      {/* Edit form */}
      {editStudio && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Studio bearbeiten: {editStudio.name}
          </h2>
          <StudioForm
            initial={editStudio}
            onSubmit={(data) =>
              updateMutation.mutate({ studioId: editStudio.id, data })
            }
            onCancel={() => setEditStudio(null)}
            loading={updateMutation.isPending}
          />
          {updateMutation.isError && (
            <p className="text-xs mt-2" style={{ color: "#f87171" }}>
              Fehler: {updateMutation.error.message}
            </p>
          )}
        </div>
      )}

      {/* Studio list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {data.items.length === 0 && (
            <div
              className="rounded-xl px-5 py-10 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text2)" }}>
                Noch keine Studios angelegt
              </p>
            </div>
          )}
          {data.items.map((studio) => (
            <StudioCard
              key={studio.id}
              studio={studio}
              onEdit={(s) => {
                setEditStudio(s);
                setShowForm(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
