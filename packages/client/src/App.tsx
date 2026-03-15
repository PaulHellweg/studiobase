import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AdminStudios from "./pages/AdminStudios";
import AdminClasses from "./pages/AdminClasses";
import AdminSchedule from "./pages/AdminSchedule";
import AdminCustomers from "./pages/AdminCustomers";
import TeacherPortal from "./pages/TeacherPortal";
import PublicBooking from "./pages/PublicBooking";
import Settings from "./pages/Settings";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/admin/studios", label: "Studios" },
  { to: "/admin/classes", label: "Classes" },
  { to: "/admin/schedule", label: "Schedule" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/teacher", label: "Teacher" },
  { to: "/settings", label: "Settings" },
];

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-1 shrink-0">
          <div className="mb-6">
            <span className="text-indigo-400 font-bold text-lg tracking-tight">StudioBase</span>
          </div>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin/studios" element={<AdminStudios />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/teacher" element={<TeacherPortal />} />
            <Route path="/:slug/book" element={<PublicBooking />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
