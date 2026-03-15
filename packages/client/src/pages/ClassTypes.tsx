import { useState } from "react";
import { trpc } from "../lib/trpc";

type ClassCategory = "yoga" | "pilates" | "dance" | "fitness" | "meditation" | "martial_arts" | "other";

type ClassType = {
  id: string;
  name: string;
  description: string | null;
  category: ClassCategory;
  durationMinutes: number;
  creditCost: number;
  color: string | null;
  isActive: boolean;
};

const CATEGORY_LABELS: Record<ClassCategory, string> = {
  yoga: "Yoga",
  pilates: "Pilates",
  dance: "Tanz",
  fitness: "Fitness",
  meditation: "Meditation",
  martial_arts: "Kampfsport",
  other: "Sonstiges",
};

const CATEGORY_COLORS: Record<ClassCategory, string> = {
  yoga: "#a78bfa",
  pilates: "#34d399",
  dance: "#f472b6",
  fitness: "#fb923c",
  meditation: "#60a5fa",
  martial_arts: "#f87171",
  other: "#94a3b8",
};

// Hard-coded tenant ID — in production this comes from auth context
const TENANT_ID = "00000000-0000-0000-0000-000000000000";

function ClassTypeForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<ClassType>;
  onSubmit: (data: {
    name: string;
    description?: string;
    category: ClassCategory;
    durationMinutes: number;
    creditCost: number;
    color?: string;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ClassCategory>(initial?.category ?? "yoga");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 60);
  const [creditCost, setCreditCost] = useState(initial?.creditCost ?? 2);
  const [color, setColor] = useState(initial?.color ?? "#8b5cf6");

  const inputStyle = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          description: description || undefined,
          category,
          durationMinutes,
          creditCost,
          color,
        });
      }}
      className="grid grid-cols-2 gap-3"
    >
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Name
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Yoga Flow"
          required
        />
      </div>

      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Beschreibung
        </label>
        <textarea
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={inputStyle}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kurze Beschreibung…"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Kategorie
        </label>
        <select
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          value={category}
          onChange={(e) => setCategory(e.target.value as ClassCategory)}
        >
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Farbe
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="w-10 h-9 rounded-lg cursor-pointer"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <input
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            pattern="^#[0-9a-fA-F]{6}$"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Dauer (Minuten)
        </label>
        <input
          type="number"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          min={1}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Kredit-Kosten
        </label>
        <input
          type="number"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          min={0}
          value={creditCost}
          onChange={(e) => setCreditCost(Number(e.target.value))}
          required
        />
      </div>

      <div className="col-span-2 flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ color: "var(--text2)", background: "var(--surface2)" }}
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}

export default function ClassTypes() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ClassType | null>(null);
  const [filterCategory, setFilterCategory] = useState<ClassCategory | "all">("all");

  const { data, isLoading, isError, refetch } = trpc.classType.list.useQuery(
    {
      tenantId: TENANT_ID,
      activeOnly: false,
      category: filterCategory === "all" ? undefined : filterCategory,
    },
    { retry: false }
  );

  const createMutation = trpc.classType.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      void refetch();
    },
  });

  const updateMutation = trpc.classType.update.useMutation({
    onSuccess: () => {
      setEditItem(null);
      void refetch();
    },
  });

  const deactivateMutation = trpc.classType.deactivate.useMutation({
    onSuccess: () => void refetch(),
  });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Kurstypen
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Kursprogramm verwalten
          </p>
        </div>
        {!showForm && !editItem && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Kurstyp anlegen
          </button>
        )}
      </div>

      {isError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Server nicht erreichbar — Kurstypen können nicht geladen werden.
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Neuer Kurstyp
          </h2>
          <ClassTypeForm
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
      {editItem && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Bearbeiten: {editItem.name}
          </h2>
          <ClassTypeForm
            initial={editItem}
            onSubmit={(data) =>
              updateMutation.mutate({ classTypeId: editItem.id, data })
            }
            onCancel={() => setEditItem(null)}
            loading={updateMutation.isPending}
          />
          {updateMutation.isError && (
            <p className="text-xs mt-2" style={{ color: "#f87171" }}>
              Fehler: {updateMutation.error.message}
            </p>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilterCategory("all")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: filterCategory === "all" ? "var(--accent)" : "var(--surface)",
            color: filterCategory === "all" ? "white" : "var(--text2)",
            border: "1px solid var(--border)",
          }}
        >
          Alle
        </button>
        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterCategory(k as ClassCategory)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filterCategory === k ? "var(--accent)" : "var(--surface)",
              color: filterCategory === k ? "white" : "var(--text2)",
              border: "1px solid var(--border)",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Class type list */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      )}

      {data && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {data.items.length === 0 && (
            <div
              className="px-5 py-10 text-center"
              style={{ background: "var(--surface)" }}
            >
              <p className="text-sm" style={{ color: "var(--text2)" }}>
                Keine Kurstypen gefunden
              </p>
            </div>
          )}
          {data.items.map((ct, idx) => (
            <div
              key={ct.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                background: "var(--surface)",
                borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
                opacity: ct.isActive ? 1 : 0.5,
              }}
            >
              {/* Color dot */}
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: ct.color ?? CATEGORY_COLORS[ct.category] }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {ct.name}
                  </span>
                  {!ct.isActive && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--surface2)", color: "var(--text2)" }}
                    >
                      Inaktiv
                    </span>
                  )}
                </div>
                {ct.description && (
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text2)" }}>
                    {ct.description}
                  </p>
                )}
              </div>

              {/* Category badge */}
              <span
                className="text-xs px-2 py-1 rounded-md shrink-0"
                style={{
                  background: `${CATEGORY_COLORS[ct.category]}20`,
                  color: CATEGORY_COLORS[ct.category],
                }}
              >
                {CATEGORY_LABELS[ct.category]}
              </span>

              {/* Duration */}
              <span className="text-xs shrink-0" style={{ color: "var(--text2)" }}>
                {ct.durationMinutes} Min.
              </span>

              {/* Credits */}
              <span
                className="text-xs font-medium px-2 py-1 rounded-md shrink-0"
                style={{ background: "var(--surface2)", color: "var(--text)" }}
              >
                {ct.creditCost} Kredit{ct.creditCost !== 1 ? "e" : ""}
              </span>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditItem(ct);
                    setShowForm(false);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg"
                  style={{ color: "var(--text2)", background: "var(--surface2)" }}
                >
                  Bearbeiten
                </button>
                {ct.isActive && (
                  <button
                    onClick={() => deactivateMutation.mutate({ classTypeId: ct.id })}
                    disabled={deactivateMutation.isPending}
                    className="text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ color: "#f87171", background: "var(--surface2)" }}
                  >
                    Deaktivieren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <p className="text-xs mt-3" style={{ color: "var(--text2)" }}>
          {data.total} Kurstypen gesamt
        </p>
      )}
    </div>
  );
}
