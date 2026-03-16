"use client";

import { getClassType, getTeacher, getScheduleEntry, type Booking } from "@/lib/mock-data";
import { useState } from "react";
import { Modal } from "./Modal";
import { Toast } from "./Toast";

type BookingCardProps = {
  booking: Booking;
};

export function BookingCard({ booking }: BookingCardProps) {
  const scheduleEntry = getScheduleEntry(booking.scheduleEntryId);
  const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
  const teacher = scheduleEntry ? getTeacher(scheduleEntry.teacherId) : null;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!scheduleEntry || !classType || !teacher) return null;

  const startTime = new Date(scheduleEntry.startTime);
  const canCancel = booking.status === "confirmed" && startTime > new Date();

  const handleCancel = () => {
    setShowCancelModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const statusColor =
    booking.status === "confirmed"
      ? "var(--color-success)"
      : booking.status === "waitlisted"
      ? "var(--color-accent)"
      : "var(--color-text-muted)";

  return (
    <>
      <div className="bg-white border border-[var(--color-border)] p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-heading font-600 text-lg mb-1">{classType.name}</h3>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <div className="w-6 h-6 bg-[var(--color-primary-light)] text-white text-xs flex items-center justify-center font-heading">
                {teacher.initials}
              </div>
              <span>{teacher.name}</span>
            </div>
          </div>
          <div
            className="px-2 py-1 text-xs font-600 text-white"
            style={{ backgroundColor: statusColor }}
          >
            {booking.status}
          </div>
        </div>

        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <div>{startTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          <div>
            {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          {booking.creditsUsed > 0 && <div className="text-xs mt-1">{booking.creditsUsed} credit used</div>}
        </div>

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full px-4 py-2 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors duration-250"
          >
            Cancel Booking
          </button>
        )}
      </div>

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
    </>
  );
}
