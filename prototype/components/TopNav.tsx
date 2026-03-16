"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useState } from "react";

export function TopNav() {
  const { user, currentRole, setCurrentRole, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const getNavLinks = () => {
    if (!currentRole) return [];

    switch (currentRole) {
      case "customer":
        return [
          { href: "/zen-flow/schedule", label: "Schedule" },
          { href: "/bookings", label: "My Bookings" },
          { href: "/credits", label: "Credits" },
        ];
      case "teacher":
        return [{ href: "/teacher/schedule", label: "My Schedule" }];
      case "tenant_admin":
        return [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/schedule", label: "Schedule" },
          { href: "/admin/classes", label: "Classes" },
          { href: "/admin/customers", label: "Customers" },
          { href: "/admin/pricing/packs", label: "Pricing" },
          { href: "/admin/reports", label: "Reports" },
          { href: "/admin/settings", label: "Settings" },
        ];
      case "super_admin":
        return [
          { href: "/super/tenants", label: "Tenants" },
          { href: "/super/settings", label: "Settings" },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="border-b border-[var(--color-border)] bg-white">
      <div className="max-w-[72rem] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={isAuthenticated ? "/" : "/zen-flow"} className="text-xl font-heading font-bold text-[var(--color-primary)]">
          StudioBase
        </Link>

        {/* Nav Links */}
        <div className="flex gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors duration-250"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors duration-250">
            DE | EN
          </button>

          {/* User Menu or Login */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface)] transition-colors duration-250"
              >
                <div className="w-8 h-8 bg-[var(--color-primary)] text-white flex items-center justify-center font-heading font-600">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="text-sm">{user.name}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[var(--color-border)] shadow-lg z-50">
                  {/* Role Switcher */}
                  <div className="border-b border-[var(--color-border)] p-2">
                    <div className="text-xs text-[var(--color-text-muted)] mb-1">Switch Role (Demo)</div>
                    {user.roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setCurrentRole(role);
                          setShowUserMenu(false);
                        }}
                        className={`block w-full text-left px-2 py-1 text-sm hover:bg-[var(--color-surface)] ${
                          currentRole === role ? "bg-[var(--color-surface)] font-600" : ""
                        }`}
                      >
                        {role.replace("_", " ")}
                      </button>
                    ))}
                  </div>

                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)] transition-colors duration-250"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
