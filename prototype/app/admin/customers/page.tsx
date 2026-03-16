"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockCustomers, getCreditBalance } from "@/lib/mock-data";
import Link from "next/link";

export default function CustomersPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Customers</h1>

        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            {
              key: "id",
              label: "Credits",
              render: (customer) => (
                <span className="font-mono">{getCreditBalance(customer.id)}</span>
              ),
            },
            {
              key: "createdAt",
              label: "Joined",
              render: (customer) => (
                new Date(customer.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              ),
            },
            {
              key: "id",
              label: "Actions",
              render: (customer) => (
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  View
                </Link>
              ),
            },
          ]}
          data={mockCustomers}
          searchPlaceholder="Search customers..."
        />
      </main>
    </div>
  );
}
