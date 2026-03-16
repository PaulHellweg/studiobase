"use client";

import { TopNav } from "@/components/TopNav";
import { mockSubscriptionTiers } from "@/lib/mock-data";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function SubscribePage() {
  const [showToast, setShowToast] = useState(false);

  const handleSubscribe = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Subscription Tiers</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockSubscriptionTiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white border-2 border-[var(--color-border)] p-8 hover:border-[var(--color-accent)] transition-colors duration-250"
            >
              <h3 className="font-heading font-600 text-2xl mb-2">{tier.name}</h3>
              <div className="text-4xl font-heading font-700 text-[var(--color-accent)] mb-4">
                €{tier.priceEur}
                <span className="text-lg text-[var(--color-text-muted)]">
                  /{tier.periodDays === 7 ? "week" : "month"}
                </span>
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mb-6">
                <div>{tier.creditsPerPeriod === 999 ? "Unlimited" : tier.creditsPerPeriod} classes per {tier.periodDays === 7 ? "week" : "month"}</div>
              </div>
              <button
                onClick={handleSubscribe}
                className="w-full px-6 py-3 bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity duration-250"
              >
                Subscribe
              </button>
            </div>
          ))}
        </div>
      </main>

      {showToast && <Toast message="Redirecting to Stripe Checkout..." type="info" />}
    </div>
  );
}
