"use client";

import { TopNav } from "@/components/TopNav";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { mockBookings } from "@/lib/mock-data";
import { useState } from "react";

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const now = new Date();
  const upcomingBookings = mockBookings.filter(
    (b) => b.status === "confirmed" || b.status === "waitlisted"
  );
  const pastBookings = mockBookings.filter(
    (b) => b.status === "cancelled"
  );

  const bookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-[72rem] mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">My Bookings</h1>

        {/* Tabs */}
        <div className="border-b border-[var(--color-border)] mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-3 border-b-2 transition-colors duration-250 ${
                activeTab === "upcoming"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-600"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-3 border-b-2 transition-colors duration-250 ${
                activeTab === "past"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-600"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Booking List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="col-span-2">
              <EmptyState
                message="You haven't booked any classes yet"
                ctaText="Browse Schedule"
                ctaHref="/zen-flow/schedule"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
