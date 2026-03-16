"use client";

import { TopNav } from "@/components/TopNav";
import { mockScheduleEntries, getClassType, mockBookings } from "@/lib/mock-data";
import Link from "next/link";

export default function TeacherSchedulePage() {
  // Filter for teacher-1
  const teacherClasses = mockScheduleEntries.filter(e => e.teacherId === "teacher-1");
  const now = new Date();
  const upcoming = teacherClasses.filter(e => new Date(e.startTime) > now);
  const past = teacherClasses.filter(e => new Date(e.startTime) <= now);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">My Schedule</h1>

        <div className="mb-8">
          <h2 className="font-heading font-600 text-xl mb-4">Upcoming Classes</h2>
          <div className="space-y-4">
            {upcoming.map((entry) => {
              const classType = getClassType(entry.classTypeId);
              const startTime = new Date(entry.startTime);
              return (
                <Link
                  key={entry.id}
                  href={`/teacher/class/${entry.id}`}
                  className="block bg-white border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow duration-250"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-600 text-lg mb-2">{classType?.name}</h3>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        <div>{startTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</div>
                        <div>{startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                        <div>{entry.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-[var(--color-text-muted)]">Booked</div>
                      <div className="text-2xl font-heading font-700">{entry.bookedCount}/{entry.capacity}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-heading font-600 text-xl mb-4">Past Classes</h2>
          <div className="space-y-4">
            {past.map((entry) => {
              const classType = getClassType(entry.classTypeId);
              const startTime = new Date(entry.startTime);
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-[var(--color-border)] p-6 opacity-75"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-600 text-lg mb-2">{classType?.name}</h3>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="text-sm text-[var(--color-success)]">Completed</div>
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
