"use client";

import { TopNav } from "@/components/TopNav";
import { mockBookings, getScheduleEntry, getClassType, getTeacher } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";

export default function BookingDetailPage() {
  const params = useParams();
  const booking = mockBookings.find(b => b.id === params.bookingId);
  const scheduleEntry = booking ? getScheduleEntry(booking.scheduleEntryId) : null;
  const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
  const teacher = scheduleEntry ? getTeacher(scheduleEntry.teacherId) : null;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!booking || !scheduleEntry || !classType || !teacher) {
    return <div>Booking not found</div>;
  }

  const startTime = new Date(scheduleEntry.startTime);
  const endTime = new Date(scheduleEntry.endTime);
  const canCancel = booking.status === "confirmed" && startTime > new Date();

  const handleCancel = () => {
    setShowCancelModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Booking Details</h1>

        <div className="bg-white border border-[var(--color-border)] p-8 mb-6">
          <h2 className="font-heading font-600 text-2xl mb-4">{classType.name}</h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Instructor</span>
              <span className="font-600">{teacher.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Date</span>
              <span className="font-600">
                {startTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Time</span>
              <span className="font-600">
                {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} –{" "}
                {endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Location</span>
              <span className="font-600">{scheduleEntry.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Status</span>
              <span
                className={`px-2 py-1 text-xs text-white ${
                  booking.status === "confirmed" ? "bg-[var(--color-success)]" : "bg-[var(--color-text-muted)]"
                }`}
              >
                {booking.status}
              </span>
            </div>
            {booking.creditsUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Credits Used</span>
                <span className="font-600">{booking.creditsUsed}</span>
              </div>
            )}
          </div>

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full px-4 py-3 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors duration-250"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </main>

      {showCancelModal && (
        <Modal onClose={() => setShowCancelModal(false)} title="Cancel Booking">
          <p className="mb-4">Are you sure you want to cancel this booking?</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Your credit will be refunded to your account.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Keep Booking
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity duration-250"
            >
              Cancel Booking
            </button>
          </div>
        </Modal>
      )}

      {showToast && <Toast message="Booking cancelled. Credit refunded." type="success" />}
    </div>
  );
}
