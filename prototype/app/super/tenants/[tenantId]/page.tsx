"use client";

import { TopNav } from "@/components/TopNav";
import { mockTenant } from "@/lib/mock-data";
import { useParams } from "next/navigation";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import { Toast } from "@/components/Toast";

export default function TenantDetailPage() {
  const params = useParams();
  const [formData, setFormData] = useState({
    name: mockTenant.name,
    slug: mockTenant.slug,
    status: "active",
    plan: "pro",
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
        <h1 className="font-heading font-700 text-3xl mb-8">Tenant Configuration</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8 mb-6">
          <FormField
            label="Studio Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <FormField
            label="Slug"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          />

          <div className="mb-4">
            <label className="block text-sm font-600 text-[var(--color-text)] mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-600 text-[var(--color-text)] mb-2">Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)]"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
          >
            Save Changes
          </button>
        </form>

        <button className="w-full px-6 py-3 border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-colors duration-250">
          Suspend Tenant
        </button>
      </main>

      {showToast && <Toast message="Tenant updated successfully" type="success" />}
    </div>
  );
}
