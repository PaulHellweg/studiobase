"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { mockTenant } from "@/lib/mock-data";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function StudioSettingsPage() {
  const [formData, setFormData] = useState({
    name: mockTenant.name,
    description: mockTenant.description,
    location: mockTenant.location,
    cancellationWindowHours: mockTenant.cancellationWindowHours,
    defaultLocale: mockTenant.defaultLocale,
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
        <h1 className="font-heading font-700 text-3xl mb-8">Studio Settings</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
          <FormField
            label="Studio Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="mb-4">
            <label className="block text-sm font-600 text-[var(--color-text)] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <FormField
            label="Location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <FormField
            label="Cancellation Window (hours)"
            type="number"
            value={formData.cancellationWindowHours}
            onChange={(e) => setFormData({ ...formData, cancellationWindowHours: parseInt(e.target.value) })}
          />

          <div className="mb-6">
            <label className="block text-sm font-600 text-[var(--color-text)] mb-2">
              Default Language
            </label>
            <select
              value={formData.defaultLocale}
              onChange={(e) => setFormData({ ...formData, defaultLocale: e.target.value })}
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
            Save Settings
          </button>
        </form>
      </main>

      {showToast && <Toast message="Settings updated successfully" type="success" />}
    </div>
  );
}
