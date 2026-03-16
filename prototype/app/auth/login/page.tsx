"use client";

import { TopNav } from "@/components/TopNav";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errors, setErrors] = useState<{ email?: string; pass?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = "Email is required";
    if (!pass) newErrors.pass = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    login(email, pass);
    router.push("/zen-flow/schedule");
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="max-w-md mx-auto px-6 py-12 fade-in-up">
        <h1 className="font-heading font-700 text-3xl mb-8 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="bg-white border border-[var(--color-border)] p-8">
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            error={errors.pass}
          />

          <button
            type="submit"
            className="w-full px-4 py-3 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250 mb-4"
          >
            Login
          </button>

          <div className="text-center text-sm">
            <Link href="/auth/forgot-password" className="text-[var(--color-primary)] hover:underline">
              Forgot password?
            </Link>
            <span className="text-[var(--color-text-muted)]"> · </span>
            <Link href="/auth/register" className="text-[var(--color-primary)] hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
