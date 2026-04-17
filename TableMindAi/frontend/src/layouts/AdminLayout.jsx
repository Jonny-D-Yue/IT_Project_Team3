import { Outlet } from "react-router-dom";

import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100 md:grid md:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
