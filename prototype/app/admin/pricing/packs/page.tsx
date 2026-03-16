"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockCreditPacks } from "@/lib/mock-data";

export default function CreditPacksPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Credit Packs</h1>
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
            Create Pack
          </button>
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Pack Name" },
            { key: "credits", label: "Credits" },
            {
              key: "priceEur",
              label: "Price",
              render: (pack) => `€${pack.priceEur}`,
            },
            {
              key: "expiryDays",
              label: "Expiry",
              render: (pack) => pack.expiryDays ? `${pack.expiryDays} days` : "Never",
            },
            {
              key: "id",
              label: "Actions",
              render: () => <button className="text-[var(--color-primary)] hover:underline">Edit</button>,
            },
          ]}
          data={mockCreditPacks}
        />
      </main>
    </div>
  );
}
