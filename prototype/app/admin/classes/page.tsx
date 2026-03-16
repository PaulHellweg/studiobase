"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockClassTypes } from "@/lib/mock-data";
import Link from "next/link";

export default function ClassManagementPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Class Management</h1>
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
            Create Class Type
          </button>
        </div>

        <DataTable
          columns={[
            { key: "name", label: "Class Name" },
            { key: "durationMinutes", label: "Duration (min)" },
            { key: "capacity", label: "Capacity" },
            {
              key: "id",
              label: "Actions",
              render: (item) => (
                <button className="text-[var(--color-primary)] hover:underline">Edit</button>
              ),
            },
          ]}
          data={mockClassTypes}
          searchPlaceholder="Search classes..."
        />
      </main>
    </div>
  );
}
