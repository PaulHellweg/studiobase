import { useParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useToast } from "../components/Toast";

const ACCENT = "#6366f1";

function PublicNav({ studioName, slug }: { studioName?: string; slug: string }) {
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
          {(studioName ?? slug).charAt(0).toUpperCase()}
        </div>
        <span className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
          {studioName ?? slug}
        </span>
      </div>
      <a
        href={`/${slug}/book`}
        className="text-xs font-medium px-3 py-1.5 rounded-full"
        style={{ background: "#f3f4f6", color: "#666" }}
      >
        ← Kursplan
      </a>
    </header>
  );
}

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  currency: string;
  validityDays?: number | null;
  stripePriceId?: string | null;
  isActive: boolean;
};

function PackageCard({
  pkg,
  onBuy,
  isBuying,
}: {
  pkg: CreditPackage;
  onBuy: () => void;
  isBuying: boolean;
}) {
  const isSubscription = !!pkg.stripePriceId;
  const price = (pkg.priceCents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: pkg.currency.toUpperCase(),
    minimumFractionDigits: 2,
  });
  const pricePerCredit = pkg.priceCents > 0
    ? ((pkg.priceCents / 100) / pkg.credits).toFixed(2)
    : null;

  return (
    <div
      className="rounded-2xl p-5 relative"
      style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
    >
      {isSubscription && (
        <span
          className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${ACCENT}15`, color: ACCENT }}
        >
          Abo
        </span>
      )}

      <div className="mb-4">
        <h3 className="font-bold text-base mb-0.5" style={{ color: "#1a1a1a" }}>
          {pkg.name}
        </h3>
        {pkg.validityDays && (
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Gültig für {pkg.validityDays} Tage
          </p>
        )}
      </div>

      {/* Credits display */}
      <div className="flex items-end gap-1 mb-4">
        <span className="text-4xl font-black" style={{ color: "#1a1a1a" }}>
          {pkg.credits}
        </span>
        <span className="text-sm font-medium mb-1" style={{ color: "#666" }}>
          Credits
        </span>
      </div>

      {pricePerCredit && (
        <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
          {pricePerCredit} € pro Credit
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xl font-bold" style={{ color: "#1a1a1a" }}>
          {price}
          {isSubscription && (
            <span className="text-sm font-normal ml-1" style={{ color: "#666" }}>
              /Monat
            </span>
          )}
        </span>
        <button
          onClick={onBuy}
          disabled={isBuying}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: ACCENT }}
        >
          {isBuying ? "Weiterleitung…" : "Kaufen"}
        </button>
      </div>
    </div>
  );
}

export default function CreditShop() {
  const { slug } = useParams<{ slug: string }>();
  const { showToast } = useToast();

  const { data: balance } = trpc.credit.balance.get.useQuery(undefined, { retry: false });

  // Credit packages require a tenantId — placeholder returns empty gracefully when unauthenticated
  const PLACEHOLDER_TENANT_ID = "00000000-0000-0000-0000-000000000000";
  const { data: packages, isLoading } = trpc.credit.packages.list.useQuery(
    { tenantId: PLACEHOLDER_TENANT_ID, activeOnly: true },
    { retry: false }
  );

  const checkoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
    onError: (err) => {
      showToast(`Fehler beim Starten des Checkouts: ${err.message}`, "error");
    },
  });

  const subscriptionMutation = trpc.payment.createSubscription.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
    onError: (err) => {
      showToast(`Fehler beim Starten des Abonnements: ${err.message}`, "error");
    },
  });

  const displayName = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Studio";

  const origin = window.location.origin;
  const successUrl = `${origin}/${slug ?? ""}/shop?payment=success`;
  const cancelUrl = `${origin}/${slug ?? ""}/shop`;

  function handleBuy(pkg: CreditPackage) {
    if (pkg.stripePriceId) {
      // Has a Stripe price — determine mode by convention: subscriptions have recurring prices.
      // The server will handle the correct mode. We use createCheckout for one-time,
      // createSubscription for recurring (identified by stripePriceId presence).
      subscriptionMutation.mutate({
        packageId: pkg.id,
        successUrl,
        cancelUrl,
      });
    } else {
      checkoutMutation.mutate({
        packageId: pkg.id,
        successUrl,
        cancelUrl,
      });
    }
  }

  const isBuyingAny = checkoutMutation.isPending || subscriptionMutation.isPending;
  const creditBalance = balance?.balance ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <PublicNav studioName={displayName} slug={slug ?? ""} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header + balance */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "#1a1a1a" }}>
            Credits kaufen
          </h1>
          <p className="text-sm" style={{ color: "#666" }}>
            Kaufe ein Paket und buche direkt Kurse
          </p>
        </div>

        {/* Current balance */}
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center justify-between"
          style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30` }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: ACCENT }}>
              Aktuelles Guthaben
            </p>
            <p className="text-3xl font-black" style={{ color: "#1a1a1a" }}>
              {creditBalance}
              <span className="text-base font-medium ml-1" style={{ color: "#666" }}>
                Credits
              </span>
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: `${ACCENT}20` }}
          >
            <svg className="w-6 h-6" fill="none" stroke={ACCENT} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Packages */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl animate-pulse"
                style={{ background: "#e5e7eb" }}
              />
            ))}
          </div>
        )}

        {!isLoading && (!packages || packages.length === 0) && (
          <div
            className="rounded-2xl px-4 py-10 text-center"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "#f3f4f6" }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
              Keine Pakete verfügbar
            </p>
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
              Der Studio-Administrator hat noch keine Credit-Pakete angelegt.
            </p>
          </div>
        )}

        {packages && packages.length > 0 && (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg as CreditPackage}
                onBuy={() => handleBuy(pkg as CreditPackage)}
                isBuying={isBuyingAny}
              />
            ))}
          </div>
        )}

        {/* Stripe info */}
        <p className="text-xs text-center mt-6" style={{ color: "#9ca3af" }}>
          Sichere Zahlung über Stripe · Keine versteckten Kosten
        </p>
      </div>
    </div>
  );
}
