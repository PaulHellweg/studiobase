"use client";

import { TopNav } from "@/components/TopNav";
import { ClassCard } from "@/components/ClassCard";
import { mockScheduleEntries } from "@/lib/mock-data";
import { useState } from "react";

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(0);

  // Get next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  const selectedDate = days[selectedDay];
  const selectedDateStr = selectedDate.toISOString().split('T')[0];

  const classesForDay = mockScheduleEntries
    .filter(e => e.status === 'published')
    .filter(e => e.startTime.startsWith(selectedDateStr));

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Class Schedule</h1>

        {/* Day Selector */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`px-6 py-3 border ${
                  selectedDay === idx
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                } transition-colors duration-250`}
              >
                <div className="text-sm font-600">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-lg font-heading">
                  {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Class List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classesForDay.length > 0 ? (
            classesForDay.map((entry) => (
              <ClassCard key={entry.id} scheduleEntry={entry} />
            ))
          ) : (
            <div className="col-span-2 bg-white border border-[var(--color-border)] p-12 text-center">
              <p className="text-[var(--color-text-muted)]">No classes scheduled for this day.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
