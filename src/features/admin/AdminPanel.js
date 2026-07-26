import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import AdminSidebar from "../../shared/components/AdminSidebar";

const SIDEBAR_COLLAPSED_KEY = "adminSidebarCollapsed";

export default function AdminPanel({ onLogout }) {
  const navigate = useNavigate();
  const fullname = localStorage.getItem("fullname");
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1"
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("fullname");

    navigate("/admin", { replace: true });
    onLogout?.();
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-ink">
      <AdminSidebar
        onLogout={handleLogout}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />

      <div
        className={`transition-[padding] duration-200 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <header className="hidden items-center justify-between border-b border-line bg-white px-8 py-4 md:flex">
          <div className="text-sm text-muted">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink">{fullname}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
              {fullname?.charAt(0) ?? "A"}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
