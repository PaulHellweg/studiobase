"use client";

import { TopNav } from "@/components/TopNav";
import { mockCreditPacks } from "@/lib/mock-data";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function BuyCreditsPage() {
  const [showToast, setShowToast] = useState(false);

  const handlePurchase = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Buy Credit Packs</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockCreditPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white border-2 border-[var(--color-border)] p-8 hover:border-[var(--color-primary)] transition-colors duration-250"
            >
              <h3 className="font-heading font-600 text-2xl mb-2">{pack.name}</h3>
              <div className="text-4xl font-heading font-700 text-[var(--color-primary)] mb-4">
                €{pack.priceEur}
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mb-6">
                <div>{pack.credits} credits</div>
                <div>Expires in {pack.expiryDays} days</div>
              </div>
              <button
                onClick={handlePurchase}
                className="w-full px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </main>

      {showToast && <Toast message="Redirecting to Stripe Checkout..." type="info" />}
    </div>
  );
}
