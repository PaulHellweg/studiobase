"use client";

import { TopNav } from "@/components/TopNav";
import { mockScheduleEntries, getClassType, getTeacher } from "@/lib/mock-data";

export default function ScheduleManagementPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading font-700 text-3xl">Schedule Management</h1>
          <button className="px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
            Create Entry
          </button>
        </div>

        {/* Week View */}
        <div className="bg-white border border-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="font-heading font-600 text-xl">This Week</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-[var(--color-border)] hover:bg-[var(--color-surface)]">Prev</button>
                <button className="px-3 py-1 border border-[var(--color-border)] hover:bg-[var(--color-surface)]">Next</button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-[var(--color-border)]">
            {mockScheduleEntries.map((entry) => {
              const classType = getClassType(entry.classTypeId);
              const teacher = getTeacher(entry.teacherId);
              const startTime = new Date(entry.startTime);

              return (
                <div key={entry.id} className="px-6 py-4 hover:bg-[var(--color-surface)] transition-colors duration-250">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-heading font-600">{classType?.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs ${
                            entry.status === "published"
                              ? "bg-[var(--color-success)] text-white"
                              : "bg-[var(--color-text-muted)] text-white"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {teacher?.name} · {startTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                        {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-text-muted)]">Booked</div>
                        <div className="font-mono">{entry.bookedCount}/{entry.capacity}</div>
                      </div>
                      <button className="text-[var(--color-primary)] hover:underline">Edit</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
