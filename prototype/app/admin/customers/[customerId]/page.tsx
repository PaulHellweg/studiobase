"use client";

import { TopNav } from "@/components/TopNav";
import { getCustomer, getCreditBalance, mockBookings, getScheduleEntry, getClassType } from "@/lib/mock-data";
import { useParams } from "next/navigation";

export default function CustomerDetailPage() {
  const params = useParams();
  const customer = getCustomer(params.customerId as string);
  const balance = customer ? getCreditBalance(customer.id) : 0;
  const customerBookings = customer ? mockBookings.filter(b => b.customerId === customer.id) : [];

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">{customer.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[var(--color-border)] p-6">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Email</div>
            <div className="font-600">{customer.email}</div>
          </div>
          <div className="bg-white border border-[var(--color-border)] p-6">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Phone</div>
            <div className="font-600">{customer.phone}</div>
          </div>
          <div className="bg-white border border-[var(--color-border)] p-6">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Credit Balance</div>
            <div className="text-2xl font-heading font-700 text-[var(--color-primary)]">{balance}</div>
          </div>
        </div>

        <div className="bg-white border border-[var(--color-border)]">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Booking History</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {customerBookings.map((booking) => {
              const scheduleEntry = getScheduleEntry(booking.scheduleEntryId);
              const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
              const startTime = scheduleEntry ? new Date(scheduleEntry.startTime) : null;

              return (
                <div key={booking.id} className="px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-600 mb-1">{classType?.name}</div>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {startTime?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 text-xs text-white ${
                        booking.status === "confirmed"
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--color-text-muted)]"
                      }`}
                    >
                      {booking.status}
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
