"use client";

import { TopNav } from "@/components/TopNav";
import { DataTable } from "@/components/DataTable";
import { mockTeachers } from "@/lib/mock-data";

export default function TeacherManagementPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Teachers</h1>
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
            Invite Teacher
          </button>
        </div>

        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (teacher) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--color-primary-light)] text-white text-xs flex items-center justify-center font-heading">
                    {teacher.initials}
                  </div>
                  <span>{teacher.name}</span>
                </div>
              ),
            },
            { key: "email", label: "Email" },
            {
              key: "id",
              label: "Actions",
              render: (item) => (
                <button className="text-[var(--color-primary)] hover:underline">Manage</button>
              ),
            },
          ]}
          data={mockTeachers}
          searchPlaceholder="Search teachers..."
        />
      </main>
    </div>
  );
}
