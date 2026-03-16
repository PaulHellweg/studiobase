"use client";

import { TopNav } from "@/components/TopNav";
import { mockWaitlistEntries, getCustomer, getScheduleEntry, getClassType } from "@/lib/mock-data";

export default function WaitlistsPage() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Waitlists</h1>

        <div className="bg-white border border-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Active Waitlists</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {mockWaitlistEntries.map((entry) => {
              const customer = getCustomer(entry.customerId);
              const scheduleEntry = getScheduleEntry(entry.scheduleEntryId);
              const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
              const startTime = scheduleEntry ? new Date(scheduleEntry.startTime) : null;

              return (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-600 mb-1">{customer?.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {classType?.name} · {startTime?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[var(--color-text-muted)]">Position</div>
                      <div className="text-xl font-heading font-700">#{entry.position}</div>
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
