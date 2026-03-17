import { NavLink, useNavigate } from "react-router-dom";

import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Menu", to: "/admin/menu" },
  { label: "Categories", to: "/admin/categories" },
  { label: "Tables", to: "/admin/tables" },
  { label: "Analytics", to: "/admin/analytics" },
];

const operationsLinks = [
  { label: "Staff Live Floor", to: "/staff/dashboard" },
  { label: "Kitchen Board", to: "/staff/kitchen" },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside className="border-r border-slate-200 bg-white px-5 py-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">TableMind AI</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Admin Console</h1>
      </div>
      <div className="mt-8 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 font-semibold ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="mt-8">
        <p className="px-4 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Operations</p>
        <div className="mt-3 space-y-2">
          {operationsLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 font-semibold ${isActive ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-amber-50"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="mt-8 rounded-[24px] bg-amber-50 p-4">
        <p className="font-semibold text-slate-900">{user?.name}</p>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{user?.role}</p>
      </div>
      <Button
        variant="secondary"
        className="mt-6 w-full"
        onClick={() => {
          logout();
          navigate("/admin/login");
        }}
      >
        Logout
      </Button>
    </aside>
  );
}
