"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-md mx-auto px-6 py-12 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8 text-center">Reset Password</h1>
        {submitted ? (
          <div className="bg-white border border-[var(--color-border)] p-8 text-center">
            <p className="mb-4">Check your email for a password reset link.</p>
            <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250 mb-4"
            >
              Send Reset Link
            </button>
            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
