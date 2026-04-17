import { useNavigate } from "react-router-dom";

import Button from "../common/Button";
import { useAuth } from "../../hooks/useAuth";

export default function StaffNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">TableMind AI</p>
          <h1 className="text-xl font-bold text-slate-900">Staff Console</h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === "admin" ? (
            <Button variant="secondary" onClick={() => navigate("/admin/dashboard")}>
              Admin View
            </Button>
          ) : null}
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{user?.role}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              navigate("/staff/login");
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
