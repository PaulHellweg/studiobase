import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink, useLocation, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Studios from "./pages/Studios";
import ClassTypes from "./pages/ClassTypes";
import Schedule from "./pages/Schedule";
import Customers from "./pages/Customers";
import Plans from "./pages/Plans";
import TeacherPortal from "./pages/TeacherPortal";
import PublicBooking from "./pages/PublicBooking";
import BookingPage from "./pages/BookingPage";
import MyBookings from "./pages/MyBookings";
import CreditShop from "./pages/CreditShop";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// ─── Nav config ────────────────────────────────────────────────────────────────

const mainNavLinks = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/studios",
    label: "Studios",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    to: "/classes",
    label: "Kurstypen",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: "/schedule",
    label: "Stundenplan",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/customers",
    label: "Kunden",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const bottomNavLinks = [
  {
    to: "/plans",
    label: "Pakete",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    to: "/teacher",
    label: "Lehrer-Portal",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Einstellungen",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const roleBadgeLabel: Record<string, string> = {
  tenant_admin: "Admin",
  teacher: "Lehrer",
  customer: "Kunde",
};

// ─── User menu ─────────────────────────────────────────────────────────────────

function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const primaryRole = user.roles[0];
  const badgeLabel = primaryRole ? (roleBadgeLabel[primaryRole] ?? primaryRole) : null;
  const initials = user.email.charAt(0).toUpperCase();

  return (
    <div
      className="px-3 py-3 flex items-center gap-2.5"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
        style={{ background: "var(--accent)" }}
      >
        {initials}
      </div>

      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>
            {user.email}
          </p>
          {badgeLabel && (
            <span
              className="inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none mt-0.5"
              style={{
                background: "color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--accent)",
              }}
            >
              {badgeLabel}
            </span>
          )}
        </div>
      )}

      {!collapsed && (
        <button
          onClick={logout}
          title="Abmelden"
          className="shrink-0 p-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: "var(--text2)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  function NavItem({ to, label, icon, end = false }: { to: string; label: string; icon: React.ReactNode; end?: boolean }) {
    return (
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all ${
            isActive ? "text-white" : "hover:text-white"
          }`
        }
        style={({ isActive }) =>
          isActive
            ? { background: "var(--accent)", color: "white" }
            : { color: "var(--text2)" }
        }
      >
        {icon}
        <span className="truncate">{label}</span>
      </NavLink>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col shrink-0 transition-transform duration-200 lg:static lg:translate-x-0"
        style={{
          width: 240,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          transform: open ? "translateX(0)" : undefined,
        }}
        data-sidebar-open={open}
      >
        {/* Logo */}
        <div className="px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "var(--accent)" }}
            >
              SB
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text)" }}>
              StudioBase
            </span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:opacity-70"
            style={{ color: "var(--text2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section label */}
        <div className="px-4 mb-1">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text2)" }}>
            Admin
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {mainNavLinks.map((link) => (
            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} end={link.to === "/"} />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-2 flex flex-col gap-0.5 pb-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {bottomNavLinks.map((link) => (
            <NavItem key={link.to} to={link.to} label={link.label} icon={link.icon} />
          ))}
        </div>

        {/* User menu */}
        <UserMenu />
      </aside>
    </>
  );
}

// ─── Mobile bottom tab bar ─────────────────────────────────────────────────────

function MobileTabBar() {
  const topFive = mainNavLinks.slice(0, 5);
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden"
      style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}
    >
      {topFive.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-center"
          style={({ isActive }) => ({
            color: isActive ? "var(--accent)" : "var(--text2)",
          })}
        >
          {link.icon}
          <span className="text-[10px] font-medium leading-none">{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// ─── Admin layout ──────────────────────────────────────────────────────────────

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Desktop sidebar always visible; mobile toggleable */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar open={true} onClose={() => undefined} />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header bar */}
        <header
          className="flex items-center gap-3 px-4 py-3 lg:hidden sticky top-0 z-30"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md"
            style={{ color: "var(--text2)" }}
            aria-label="Menü öffnen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: "var(--accent)" }}
            >
              SB
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              StudioBase
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <MobileTabBar />
    </div>
  );
}

// ─── Public nav ────────────────────────────────────────────────────────────────

function PublicTopNav({ backHref, backLabel = "Zurück" }: { backHref?: string; backLabel?: string }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
      style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ background: "#6366f1" }}
        >
          SB
        </div>
        <span className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
          StudioBase
        </span>
      </div>
      {backHref && (
        <Link
          to={backHref}
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: "#f3f4f6", color: "#666" }}
        >
          ← {backLabel}
        </Link>
      )}
    </header>
  );
}

// Wrapper component for public routes that need the nav
function PublicLayout({ children, backHref, backLabel }: { children: React.ReactNode; backHref?: string; backLabel?: string }) {
  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <PublicTopNav backHref={backHref} backLabel={backLabel} />
      {children}
    </div>
  );
}

// ─── Root app ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/login" element={<Login />} />

        {/* ── Public customer-facing pages (no sidebar) ── */}
        <Route path="/:slug/book" element={<BookingPage />} />
        <Route path="/:slug/credits" element={<CreditShop />} />

        {/* ── Customer protected pages ── */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute requiredRole="customer">
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* ── Legacy public booking stub ── */}
        <Route
          path="/:slug/book-legacy"
          element={
            <PublicLayout backLabel="Startseite">
              <PublicBooking />
            </PublicLayout>
          }
        />

        {/* ── Admin / teacher pages (with sidebar) ── */}
        <Route
          path="/*"
          element={
            <AdminLayout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/studios"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Studios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/classes"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <ClassTypes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Schedule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Customers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Plans />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute requiredRole="teacher">
                      <TeacherPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute requiredRole="tenant_admin">
                      <Settings />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
