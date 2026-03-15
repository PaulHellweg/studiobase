import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "../lib/trpc";

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
  validityDays: number | null;
  stripePriceId: string | null;
  isActive: boolean;
};

// Hard-coded tenant ID — in production this comes from auth context
const TENANT_ID = "00000000-0000-0000-0000-000000000000";

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const packageSchema = z.object({
  name: z.string().min(2, "Mindestens 2 Zeichen").max(100, "Maximal 100 Zeichen"),
  credits: z.number().int().min(1, "Mindestens 1 Credit").max(9999, "Maximal 9999 Credits"),
  priceEuros: z
    .number()
    .min(0.01, "Preis muss größer als 0 sein")
    .max(9999, "Maximal 9999"),
  currency: z.enum(["EUR", "CHF"]),
  validityDays: z
    .number()
    .int()
    .min(1, "Mindestens 1 Tag")
    .max(3650, "Maximal 3650 Tage")
    .optional(),
  stripePriceId: z.string().max(200).optional(),
});

type PackageFormData = z.infer<typeof packageSchema>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs mt-1" style={{ color: "#f87171" }}>{message}</p>;
}

function PackageForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<CreditPackage>;
  onSubmit: (data: {
    name: string;
    credits: number;
    priceCents: number;
    currency: string;
    validityDays?: number;
    stripePriceId?: string;
  }) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initial?.name ?? "",
      credits: initial?.credits ?? 10,
      priceEuros: initial?.priceCents != null ? initial.priceCents / 100 : 49.0,
      currency: (initial?.currency as "EUR" | "CHF") ?? "EUR",
      validityDays: initial?.validityDays ?? 180,
      stripePriceId: initial?.stripePriceId ?? "",
    },
  });

  const validityDays = watch("validityDays");
  const isSubscription = validityDays === 30;

  const inputStyle = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--text)",
  };

  const errorInputStyle = {
    ...inputStyle,
    border: "1px solid #f87171",
  };

  const handleFormSubmit = (data: PackageFormData) => {
    onSubmit({
      name: data.name,
      credits: data.credits,
      priceCents: Math.round(data.priceEuros * 100),
      currency: data.currency,
      validityDays: data.validityDays,
      stripePriceId: data.stripePriceId || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-2 gap-3"
    >
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Name
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={errors.name ? errorInputStyle : inputStyle}
          placeholder="z.B. 10er Karte"
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Kredite
        </label>
        <input
          type="number"
          min={1}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={errors.credits ? errorInputStyle : inputStyle}
          {...register("credits", { valueAsNumber: true })}
        />
        <FieldError message={errors.credits?.message} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Preis
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0.01}
            step={0.01}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={errors.priceEuros ? errorInputStyle : inputStyle}
            {...register("priceEuros", { valueAsNumber: true })}
          />
          <select
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
            {...register("currency")}
          >
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
        <FieldError message={errors.priceEuros?.message} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Gültigkeitsdauer (Tage)
        </label>
        <input
          type="number"
          min={1}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={errors.validityDays ? errorInputStyle : inputStyle}
          placeholder="z.B. 180"
          {...register("validityDays", { valueAsNumber: true })}
        />
        {isSubscription && (
          <p className="text-xs mt-1" style={{ color: "var(--accent)" }}>
            30 Tage = Monatsabo
          </p>
        )}
        <FieldError message={errors.validityDays?.message} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text2)" }}>
          Stripe Price ID (optional)
        </label>
        <input
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={inputStyle}
          placeholder="price_…"
          {...register("stripePriceId")}
        />
        <FieldError message={errors.stripePriceId?.message} />
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

function PackageCard({
  pkg,
  onEdit,
  onToggle,
  toggling,
}: {
  pkg: CreditPackage;
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const isSubscription = pkg.validityDays === 30;
  const pricePerCredit = pkg.priceCents / pkg.credits / 100;

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        opacity: pkg.isActive ? 1 : 0.6,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {pkg.name}
            </h3>
            {isSubscription && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent)20", color: "var(--accent)" }}
              >
                Abo
              </span>
            )}
            {!pkg.isActive && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--surface2)", color: "var(--text2)" }}
              >
                Inaktiv
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            {isSubscription
              ? `${formatPrice(pkg.priceCents, pkg.currency)} / Monat`
              : formatPrice(pkg.priceCents, pkg.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {pkg.credits === 999 ? "∞" : pkg.credits}
          </p>
          <p className="text-xs" style={{ color: "var(--text2)" }}>
            Kredite
          </p>
        </div>
      </div>

      {/* Details */}
      <div
        className="flex items-center justify-between text-xs pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span style={{ color: "var(--text2)" }}>
          {pkg.validityDays
            ? `Gültig ${pkg.validityDays} Tage`
            : "Keine Befristung"}
        </span>
        {pkg.credits < 999 && (
          <span style={{ color: "var(--text2)" }}>
            {formatPrice(Math.round(pricePerCredit * 100), pkg.currency)} / Kredit
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs"
          style={{ color: "var(--text2)", background: "var(--surface2)" }}
        >
          Bearbeiten
        </button>
        <button
          onClick={onToggle}
          disabled={toggling}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
          style={{
            color: pkg.isActive ? "#f87171" : "#34d399",
            background: "var(--surface2)",
          }}
        >
          {toggling ? "…" : pkg.isActive ? "Deaktivieren" : "Aktivieren"}
        </button>
      </div>
    </div>
  );
}

export default function Plans() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CreditPackage | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = trpc.credit.packages.list.useQuery(
    { tenantId: TENANT_ID, activeOnly: !showInactive },
    { retry: false }
  );

  const createMutation = trpc.credit.packages.create.useMutation({
    onSuccess: () => {
      setShowForm(false);
      void refetch();
    },
  });

  const updateMutation = trpc.credit.packages.update.useMutation({
    onSuccess: () => {
      setEditItem(null);
      setTogglingId(null);
      void refetch();
    },
  });

  const handleToggle = (pkg: CreditPackage) => {
    setTogglingId(pkg.id);
    updateMutation.mutate({
      packageId: pkg.id,
      data: { isActive: !pkg.isActive },
    });
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            Kredit-Pakete
          </h1>
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Tarife und Abonnements verwalten
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
            Paket anlegen
          </button>
        )}
      </div>

      {isError && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-6"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Server nicht erreichbar — Pakete können nicht geladen werden.
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            Neues Paket
          </h2>
          <PackageForm
            onSubmit={(d) => createMutation.mutate(d)}
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
          <PackageForm
            initial={editItem}
            onSubmit={(d) => updateMutation.mutate({ packageId: editItem.id, data: d })}
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

      {/* Filter toggle */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
          style={{
            background: showInactive ? "var(--accent)" : "var(--surface)",
            color: showInactive ? "white" : "var(--text2)",
            border: "1px solid var(--border)",
          }}
        >
          {showInactive ? "Alle anzeigen" : "Inaktive einblenden"}
        </button>
      </div>

      {/* Package grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <div
          className="rounded-xl px-5 py-10 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text2)" }}>
            Noch keine Pakete angelegt
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => {
                setEditItem(pkg);
                setShowForm(false);
              }}
              onToggle={() => handleToggle(pkg)}
              toggling={togglingId === pkg.id && updateMutation.isPending}
            />
          ))}
        </div>
      )}

      {data && (
        <p className="text-xs mt-4" style={{ color: "var(--text2)" }}>
          {data.length} Paket{data.length !== 1 ? "e" : ""} angezeigt
        </p>
      )}
    </div>
  );
}
