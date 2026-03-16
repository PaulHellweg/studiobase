"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function GlobalSettingsPage() {
  const [formData, setFormData] = useState({
    platformName: "StudioBase",
    supportEmail: "support@studiobase.example",
    maxTenantsPerPlan: 100,
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
        <h1 className="font-heading font-700 text-3xl mb-8">Global Settings</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
          <FormField
            label="Platform Name"
            type="text"
            value={formData.platformName}
            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
          />
          <FormField
            label="Support Email"
            type="email"
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
          />
          <FormField
            label="Max Tenants Per Plan"
            type="number"
            value={formData.maxTenantsPerPlan}
            onChange={(e) => setFormData({ ...formData, maxTenantsPerPlan: parseInt(e.target.value) })}
          />

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
          >
            Save Settings
          </button>
        </form>
      </main>

      {showToast && <Toast message="Global settings updated" type="success" />}
    </div>
  );
}
