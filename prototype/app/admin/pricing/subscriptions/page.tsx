"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockSubscriptionTiers } from "@/lib/mock-data";

export default function SubscriptionTiersPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Subscription Tiers</h1>
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
            Create Tier
          </button>
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Tier Name" },
            {
              key: "creditsPerPeriod",
              label: "Credits",
              render: (tier) => tier.creditsPerPeriod === 999 ? "Unlimited" : tier.creditsPerPeriod,
            },
            {
              key: "periodDays",
              label: "Period",
              render: (tier) => tier.periodDays === 7 ? "Weekly" : "Monthly",
            },
            {
              key: "priceEur",
              label: "Price",
              render: (tier) => `€${tier.priceEur}`,
            },
            {
              key: "id",
              label: "Actions",
              render: () => <button className="text-[var(--color-primary)] hover:underline">Edit</button>,
            },
          ]}
          data={mockSubscriptionTiers}
        />
      </main>
    </div>
  );
}
