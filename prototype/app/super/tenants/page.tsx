"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockTenant } from "@/lib/mock-data";
import Link from "next/link";

const tenants = [
  { ...mockTenant, status: "active", plan: "pro", created: "2024-01-15" },
  {
    id: "tenant-2",
    slug: "power-studio",
    name: "Power Studio Hamburg",
    status: "active",
    plan: "starter",
    created: "2024-03-20",
  },
];

export default function TenantsPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Tenants</h1>
          <Link
            href="/super/tenants/new"
            className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
          >
            Create Tenant
          </Link>
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Studio Name" },
            { key: "slug", label: "Slug" },
            {
              key: "status",
              label: "Status",
              render: (tenant) => (
                <span
                  className={`px-2 py-1 text-xs text-white ${
                    tenant.status === "active" ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"
                  }`}
                >
                  {tenant.status}
                </span>
              ),
            },
            { key: "plan", label: "Plan" },
            {
              key: "created",
              label: "Created",
              render: (tenant) =>
                new Date(tenant.created).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            },
            {
              key: "id",
              label: "Actions",
              render: (tenant) => (
                <Link
                  href={`/super/tenants/${tenant.id}`}
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Manage
                </Link>
              ),
            },
          ]}
          data={tenants}
          searchPlaceholder="Search tenants..."
        />
      </main>
    </div>
  );
}
