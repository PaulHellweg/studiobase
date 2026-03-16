"use client";

import { getClassType, getTeacher, type ScheduleEntry } from "@/lib/mock-data";
import Link from "next/link";
import { useState } from "react";
import { Modal } from "./Modal";
import { Toast } from "./Toast";

type ClassCardProps = {
  scheduleEntry: ScheduleEntry;
  showBookButton?: boolean;
  compact?: boolean;
};

export function ClassCard({ scheduleEntry, showBookButton = true, compact = false }: ClassCardProps) {
  const classType = getClassType(scheduleEntry.classTypeId);
  const teacher = getTeacher(scheduleEntry.teacherId);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!classType || !teacher) return null;

  const spotsLeft = scheduleEntry.capacity - scheduleEntry.bookedCount;
  const isFull = spotsLeft <= 0;

  const startTime = new Date(scheduleEntry.startTime);
  const endTime = new Date(scheduleEntry.endTime);

  const handleBook = () => {
    setShowBookModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      <div className={`bg-white border border-[var(--color-border)] p-4 hover:shadow-md transition-shadow duration-250 ${compact ? "" : "p-6"}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-heading font-600 text-lg text-[var(--color-text)] mb-1">
              {classType.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <div className="w-6 h-6 bg-[var(--color-primary-light)] text-white text-xs flex items-center justify-center font-heading">
                {teacher.initials}
              </div>
              <span>{teacher.name}</span>
            </div>
          </div>
          <div className={`px-2 py-1 text-xs font-600 ${
            isFull
              ? "bg-[var(--color-danger)] text-white"
              : spotsLeft <= 3
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-success)] text-white"
          }`}>
            {isFull ? "Full" : `${spotsLeft} spots left`}
          </div>
        </div>

        <div className="text-sm text-[var(--color-text-muted)] mb-4">
          <div>{startTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
          <div>
            {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div>{scheduleEntry.location}</div>
        </div>

        {showBookButton && (
          <div className="flex gap-2">
            {isFull ? (
              <button className="flex-1 px-4 py-2 bg-[var(--color-text-muted)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250">
                Join Waitlist
              </button>
            ) : (
              <button
                onClick={() => setShowBookModal(true)}
                className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
              >
                Book Class
              </button>
            )}
            <Link
              href={`/zen-flow/class/${scheduleEntry.id}`}
              className="px-4 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Details
            </Link>
          </div>
        )}
      </div>

      {showBookModal && (
        <Modal onClose={() => setShowBookModal(false)} title="Confirm Booking">
          <p className="mb-4">
            Book {classType.name} with {teacher.name}?
          </p>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            This will use 1 credit from your balance.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowBookModal(false)}
              className="px-4 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors duration-250"
            >
              Cancel
            </button>
            <button
              onClick={handleBook}
              className="px-4 py-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
            >
              Confirm Booking
            </button>
          </div>
        </Modal>
      )}

      {showToast && <Toast message="Class booked successfully!" type="success" />}
    </>
  );
}
