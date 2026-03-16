"use client";

import { TopNav } from "@/components/TopNav";
import { getScheduleEntry, getClassType, mockBookings, getCustomer } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function ClassSessionPage() {
  const params = useParams();
  const scheduleEntry = getScheduleEntry(params.sessionId as string);
  const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [showToast, setShowToast] = useState(false);

  if (!scheduleEntry || !classType) {
    return <div>Session not found</div>;
  }

  const bookings = mockBookings.filter(
    b => b.scheduleEntryId === scheduleEntry.id && b.status === "confirmed"
  );

  const toggleAttendance = (bookingId: string) => {
    setAttendance(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const startTime = new Date(scheduleEntry.startTime);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-2">{classType.name}</h1>
        <div className="text-[var(--color-text-muted)] mb-8">
          {startTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at{" "}
          {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </div>

        {/* Attendance List */}
        <div className="bg-white border border-[var(--color-border)] mb-8">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Attendance</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {bookings.map((booking) => {
              const customer = getCustomer(booking.customerId);
              if (!customer) return null;

              return (
                <div key={booking.id} className="px-6 py-4 flex justify-between items-center">
                  <div className="font-600">{customer.name}</div>
                  <button
                    onClick={() => toggleAttendance(booking.id)}
                    className={`px-4 py-2 transition-colors duration-250 ${
                      attendance[booking.id]
                        ? "bg-[var(--color-success)] text-white"
                        : "border border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {attendance[booking.id] ? "Present" : "Mark Present"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Notes */}
        <div className="bg-white border border-[var(--color-border)] mb-8">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h2 className="font-heading font-600 text-xl">Session Notes</h2>
          </div>
          <div className="p-6">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Add notes about this session..."
              className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-8 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
        >
          Save Attendance & Notes
        </button>
      </main>

      {showToast && <Toast message="Attendance and notes saved" type="success" />}
    </div>
  );
}
