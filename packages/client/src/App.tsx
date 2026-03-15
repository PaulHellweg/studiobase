import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
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

const navLinks = [
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
  {
    to: "/plans",
    label: "Pakete",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

const bottomLinks = [
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

/** Admin layout with dark sidebar */
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="px-4 py-5 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--accent)" }}
            >
              SB
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text)" }}>
              StudioBase
            </span>
          </div>
        </div>

        {/* Nav section label */}
        <div className="px-4 mb-1">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text2)" }}>
            Admin
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-2 flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "text-white" : "hover:text-white"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "var(--accent)", color: "white" }
                  : { color: "var(--text2)" }
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav */}
        <div
          className="px-2 pb-4 flex flex-col gap-0.5"
          style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "8px" }}
        >
          {bottomLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "text-white" : "hover:text-white"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: "var(--accent)", color: "white" }
                  : { color: "var(--text2)" }
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public customer-facing pages (no sidebar) ── */}
        <Route path="/:slug/book" element={<BookingPage />} />
        <Route path="/:slug/credits" element={<CreditShop />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        {/* ── Legacy public booking stub (keep for backwards compat) ── */}
        <Route path="/:slug/book-legacy" element={<PublicBooking />} />

        {/* ── Admin / teacher pages (with sidebar) ── */}
        <Route
          path="/*"
          element={
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/studios" element={<Studios />} />
                <Route path="/classes" element={<ClassTypes />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/teacher" element={<TeacherPortal />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
