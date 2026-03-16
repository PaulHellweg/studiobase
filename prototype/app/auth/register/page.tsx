"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pass: "",
    confirmPass: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.pass) newErrors.pass = "Password is required";
    if (formData.pass !== formData.confirmPass) {
      newErrors.confirmPass = "Passwords do not match";
    }

    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-md mx-auto px-6 py-12 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8 text-center">Create Account</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
          <FormField
            label="Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
          />
          <FormField
            label="Password"
            type="password"
            value={formData.pass}
            onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
            error={errors.pass}
          />
          <FormField
            label="Confirm Password"
            type="password"
            value={formData.confirmPass}
            onChange={(e) => setFormData({ ...formData, confirmPass: e.target.value })}
            error={errors.confirmPass}
          />

          <button
            type="submit"
            className="w-full px-4 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250 mb-4"
          >
            Create Account
          </button>

          <div className="text-center text-sm">
            <span className="text-[var(--color-text-muted)]">Already have an account? </span>
            <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline">
              Login
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
