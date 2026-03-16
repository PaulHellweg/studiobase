"use client";

import { TopNav } from "@/components/TopNav";
import { getCreditBalance, mockCreditLedger } from "@/lib/mock-data";
import Link from "next/link";

const CUSTOMER_ID = "customer-1";

export default function CreditsPage() {
  const balance = getCreditBalance(CUSTOMER_ID);
  const ledger = mockCreditLedger.filter(e => e.customerId === CUSTOMER_ID);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Credits & Subscriptions</h1>

        {/* Balance Card */}
        <div className="bg-white border border-[var(--color-border)] p-8 mb-8">
          <div className="text-sm text-[var(--color-text-muted)] mb-2">Current Balance</div>
          <div className="text-5xl font-heading font-700 text-[var(--color-primary)] mb-6">
            {balance} credits
          </div>
          <div className="flex gap-4">
            <Link
              href="/credits/buy"
              className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
            >
              Buy Credits
            </Link>
            <Link
              href="/credits/subscribe"
              className="px-6 py-3 border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Subscribe
            </Link>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white border border-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Transaction History</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {ledger.map((entry) => (
              <div key={entry.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <div className="font-600 mb-1">{entry.reason}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div
                  className={`text-lg font-600 ${
                    entry.amount > 0 ? "text-[var(--color-success)]" : "text-[var(--color-text)]"
                  }`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
