import { NavLink, Outlet } from "react-router-dom";

import StaffNavbar from "../components/staff/StaffNavbar";

export default function StaffLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <StaffNavbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-3">
          <NavLink
            to="/staff/dashboard"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/staff/kitchen"
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold ${isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`
            }
          >
            Kitchen
          </NavLink>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
