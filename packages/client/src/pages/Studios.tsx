import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import { SkeletonBox } from "../components/Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Schemas ──────────────────────────────────────────────────────────────────

const studioSchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").max(100, "Maximal 100 Zeichen"),
  address: z.string().min(5, "Mindestens 5 Zeichen").max(200, "Maximal 200 Zeichen"),
  timezone: z.string().min(1, "Zeitzone erforderlich"),
});

type StudioFormData = z.infer<typeof studioSchema>;

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs mt-1" style={{ color: "#f87171" }}>{message}</p>;
}

// ─── Input style helper ───────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  color: "var(--text)",
};

const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1px solid #f87171",
};

// ─── Studio form ──────────────────────────────────────────────────────────────

function StudioForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<Studio>;
  onSubmit: (data: StudioFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<StudioFormData>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      name: initial?.name ?? "",
      address: initial?.address ?? "",
      timezone: initial?.timezone ?? "Europe/Berlin",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>Name</label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={errors.name ? inputError : inputBase}
          placeholder="z.B. Studio Mitte"
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>Adresse</label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={errors.address ? inputError : inputBase}
          placeholder="Straße, PLZ Stadt"
          {...register("address")}
        />
        <FieldError message={errors.address?.message} />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>Zeitzone</label>
        <select className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputBase} {...register("timezone")}>
          <option value="Europe/Berlin">Europe/Berlin</option>
          <option value="Europe/Vienna">Europe/Vienna</option>
          <option value="Europe/Zurich">Europe/Zurich</option>
        </select>
        <FieldError message={errors.timezone?.message} />
      </div>
      <div className="flex gap-2 pt-1">
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

// ─── Room list (read-only display) ───────────────────────────────────────────

function RoomList({ rooms }: { rooms: Room[] }) {
  const activeRooms = rooms.filter((r) => r.isActive);

  return (
    <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text2)" }}>
        Räume ({activeRooms.length})
      </p>
      <div className="space-y-2">
        {activeRooms.length === 0 && (
          <p className="text-xs py-2" style={{ color: "var(--text2)" }}>
            Keine aktiven Räume — ein Standard-Raum wird beim Anlegen automatisch erstellt
          </p>
        )}
        {activeRooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ background: "var(--surface2)" }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--text2)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>{room.name}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--surface)", color: "var(--text2)" }}>
              {room.capacity} Plätze
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Studio card ──────────────────────────────────────────────────────────────

function StudioCard({
  studio,
  onEdit,
  onDelete,
}: {
  studio: Studio;
  onEdit: (s: Studio) => void;
  onDelete: (s: Studio) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", opacity: studio.isActive ? 1 : 0.6 }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: "var(--accent)" }}
              >
                {studio.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                {studio.name}
              </h3>
              {!studio.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "var(--surface2)", color: "var(--text2)" }}>
                  Inaktiv
                </span>
              )}
            </div>
            <p className="text-xs truncate" style={{ color: "var(--text2)", marginLeft: "2.5rem" }}>
              {studio.address}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text2)", marginLeft: "2.5rem" }}>
              {studio.rooms.filter((r) => r.isActive).length} Räume · {studio.timezone}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              {expanded ? "Schließen" : "Räume"}
            </button>
            <button
              onClick={() => onEdit(studio)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "var(--text2)", background: "var(--surface2)" }}
            >
              Bearbeiten
            </button>
            <button
              onClick={() => onDelete(studio)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "#f87171", background: "var(--surface2)" }}
            >
              Löschen
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5">
          <RoomList rooms={studio.rooms} />
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Studios() {
  const [showForm, setShowForm] = useState(false);
  const [editStudio, setEditStudio] = useState<Studio | null>(null);
  const [deleteStudio, setDeleteStudio] = useState<Studio | null>(null);
  const { showToast } = useToast();

  const { data, isLoading, isError, refetch } = trpc.studio.list.useQuery(
    { includeDeleted: false },
    { retry: false }
  );

  const createMutation = trpc.studio.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      void refetch();
      showToast("Studio erfolgreich angelegt", "success");
    },
    onError: (err) => showToast(`Fehler: ${err.message}`, "error"),
  });

  const updateMutation = trpc.studio.update.useMutation({
    onSuccess: () => {
      setEditStudio(null);
      void refetch();
      showToast("Studio aktualisiert", "success");
    },
    onError: (err) => showToast(`Fehler: ${err.message}`, "error"),
  });

  const softDeleteMutation = trpc.studio.delete.useMutation({
    onSuccess: () => {
      setDeleteStudio(null);
      void refetch();
      showToast("Studio deaktiviert", "success");
    },
    onError: (err) => showToast(`Fehler: ${err.message}`, "error"),
  });

  const studios = data?.items ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Studios</h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>Standorte und Räume verwalten</p>
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
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6 flex items-center gap-2"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Server nicht erreichbar — Studios können nicht geladen werden.
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Neues Studio</h2>
          <StudioForm
            onSubmit={(d) => createMutation.mutate(d)}
            onCancel={() => setShowForm(false)}
            loading={createMutation.isPending}
          />
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
            onSubmit={(d) => updateMutation.mutate({ studioId: editStudio.id, data: d })}
            onCancel={() => setEditStudio(null)}
            loading={updateMutation.isPending}
          />
        </div>
      )}

      {/* Studio list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <SkeletonBox key={i} height="6rem" rounded="xl" className="w-full" />
          ))}
        </div>
      )}

      {!isLoading && !isError && studios.length === 0 && !showForm && (
        <div
          className="rounded-xl"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <EmptyState
            title="Noch keine Studios angelegt"
            description="Füge deinen ersten Standort hinzu, um zu starten."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
              </svg>
            }
            action={{ label: "Studio hinzufügen", onClick: () => setShowForm(true) }}
          />
        </div>
      )}

      <div className="space-y-3">
        {studios.map((studio) => (
          <StudioCard
            key={studio.id}
            studio={studio}
            onEdit={(s) => { setEditStudio(s); setShowForm(false); }}
            onDelete={setDeleteStudio}
          />
        ))}
      </div>

      {/* Confirm delete dialog */}
      {deleteStudio && (
        <ConfirmDialog
          title="Studio deaktivieren"
          message={`Möchtest du "${deleteStudio.name}" wirklich deaktivieren? Das Studio wird nicht gelöscht, aber aus der aktiven Ansicht entfernt.`}
          confirmLabel="Deaktivieren"
          variant="danger"
          loading={softDeleteMutation.isPending}
          onConfirm={() => softDeleteMutation.mutate({ studioId: deleteStudio.id })}
          onCancel={() => setDeleteStudio(null)}
        />
      )}
    </div>
  );
}
