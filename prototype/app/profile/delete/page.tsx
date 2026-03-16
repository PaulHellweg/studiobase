"use client";

import { TopNav } from "@/components/TopNav";
import { useState } from "react";

export default function DeleteAccountPage() {
  const [confirmation, setConfirmation] = useState("");
  const [deleted, setDeleted] = useState(false);

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmation === "DELETE") {
      setDeleted(true);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8 text-[var(--color-danger)]">
          Delete Account
        </h1>

        <div className="bg-white border border-[var(--color-danger)] p-8">
          {deleted ? (
            <div>
              <p className="mb-4">Your account deletion request has been received.</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                All your personal data will be permanently deleted within 30 days.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[var(--color-danger)] font-600">
                This action cannot be undone.
              </p>
              <p className="mb-6">
                Deleting your account will permanently remove all your data including bookings, credits, and profile information.
              </p>

              <form onSubmit={handleDelete}>
                <div className="mb-6">
                  <label className="block text-sm font-600 text-[var(--color-text)] mb-2">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-danger)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={confirmation !== "DELETE"}
                  className="w-full px-6 py-3 bg-[var(--color-danger)] text-white hover:opacity-90 transition-opacity duration-250 disabled:opacity-50"
                >
                  Delete My Account
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
