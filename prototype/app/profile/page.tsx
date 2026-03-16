"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import { Toast } from "@/components/Toast";
import Link from "next/link";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: "Demo User",
    email: "demo@example.com",
    phone: "+49 176 12345678",
    locale: "en",
  });
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8 mb-4">
          <FormField
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <FormField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="mb-4">
            <label className="block text-sm font-600 text-[var(--color-text)] mb-2">
              Language
            </label>
            <select
              value={formData.locale}
              onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
          >
            Save Changes
          </button>
        </form>

        <div className="flex gap-4">
          <Link
            href="/profile/export"
            className="flex-1 px-6 py-3 border border-[var(--color-border)] text-center hover:bg-[var(--color-surface)] transition-colors duration-250"
          >
            Export My Data
          </Link>
          <Link
            href="/profile/delete"
            className="flex-1 px-6 py-3 border border-[var(--color-danger)] text-[var(--color-danger)] text-center hover:bg-[var(--color-danger)] hover:text-white transition-colors duration-250"
          >
            Delete Account
          </Link>
        </div>
      </main>

      {showToast && <Toast message="Profile updated successfully" type="success" />}
    </div>
  );
}
