"use client";

import { TopNav } from "@/components/TopNav";
import { getClassType, getTeacher, mockScheduleEntries } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Toast } from "@/components/Toast";

export default function ClassDetailPage() {
  const params = useParams();
  const scheduleEntry = mockScheduleEntries.find(e => e.id === params.classId);
  const classType = scheduleEntry ? getClassType(scheduleEntry.classTypeId) : null;
  const teacher = scheduleEntry ? getTeacher(scheduleEntry.teacherId) : null;
  const [showBookModal, setShowBookModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!scheduleEntry || !classType || !teacher) {
    return <div>Class not found</div>;
  }

  const startTime = new Date(scheduleEntry.startTime);
  const endTime = new Date(scheduleEntry.endTime);
  const spotsLeft = scheduleEntry.capacity - scheduleEntry.bookedCount;

  const handleBook = () => {
    setShowBookModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <h1 className="font-heading font-700 text-4xl mb-4">{classType.name}</h1>
            <p className="text-lg text-[var(--color-text-muted)] mb-8">
              {classType.description}
            </p>

            <h2 className="font-heading font-600 text-xl mb-4">Class Details</h2>
            <div className="bg-white border border-[var(--color-border)] p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[var(--color-text-muted)] mb-1">Duration</div>
                  <div className="font-600">{classType.durationMinutes} minutes</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-muted)] mb-1">Capacity</div>
                  <div className="font-600">{classType.capacity} students</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-muted)] mb-1">Location</div>
                  <div className="font-600">{scheduleEntry.location}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-muted)] mb-1">Level</div>
                  <div className="font-600">All levels welcome</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white border border-[var(--color-border)] p-6 mb-4">
              <h3 className="font-heading font-600 text-lg mb-4">Schedule</h3>
              <div className="text-sm mb-4">
                <div className="text-[var(--color-text-muted)] mb-1">Date</div>
                <div className="font-600 mb-3">
                  {startTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <div className="text-[var(--color-text-muted)] mb-1">Time</div>
                <div className="font-600 mb-3">
                  {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} –{" "}
                  {endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[var(--color-text-muted)] mb-1">Availability</div>
                <div className="font-600">{spotsLeft} spots remaining</div>
              </div>

              <button
                onClick={() => setShowBookModal(true)}
                className="w-full px-4 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
              >
                Book This Class
              </button>
            </div>

            <div className="bg-white border border-[var(--color-border)] p-6">
              <h3 className="font-heading font-600 text-lg mb-4">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--color-primary-light)] text-white text-lg flex items-center justify-center font-heading">
                  {teacher.initials}
                </div>
                <div>
                  <div className="font-600">{teacher.name}</div>
                  <div className="text-sm text-[var(--color-text-muted)]">Instructor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
}
