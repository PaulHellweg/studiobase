"use client";

import { TopNav } from "@/components/TopNav";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function ExportDataPage() {
  const [requested, setRequested] = useState(false);

  const handleRequest = () => {
    setRequested(true);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Export My Data</h1>

        <div className="bg-white border border-[var(--color-border)] p-8">
          <p className="mb-6">
            Request a copy of all your personal data stored in our system. This includes your profile information, booking history, and payment records.
          </p>

          {requested ? (
            <div className="bg-[var(--color-success)] text-white p-4">
              Your data export request has been received. You'll receive a download link via email within 24 hours.
            </div>
          ) : (
            <button
              onClick={handleRequest}
              className="w-full px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
            >
              Request Data Export
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
