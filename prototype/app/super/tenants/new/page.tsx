"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/Toast";

export default function CreateTenantPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan: "starter",
    adminEmail: "",
  });
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      router.push("/super/tenants");
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-2xl mx-auto px-6 py-8 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8">Create New Tenant</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
          <FormField
            label="Studio Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormField
            label="Slug (URL identifier)"
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            helpText="Used in public URL: studio.example.com/slug"
            required
          />
          <FormField
            label="Admin Email"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            helpText="Initial admin account will be created"
            required
          />

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
            Create Tenant
          </button>
        </form>
      </main>

      {showToast && <Toast message="Tenant created successfully" type="success" />}
    </div>
  );
}
