import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconRapel,
  IconHitungUlang,
  IconPengeluaran,
  IconLaporan,
  IconRekap,
  IconKekurangan,
  IconWarga,
  IconKalender,
  IconBroadcast,
  IconChevron,
  IconMenu,
  IconClose,
  IconLogout,
} from "./icons";

const navItems = [
  { to: "rapel-list", label: "Daftar Rapel", icon: IconRapel },
  { to: "detail-harian", label: "Hitung Ulang Harian", icon: IconHitungUlang },
  { to: "pengeluaran", label: "Pengeluaran", icon: IconPengeluaran },
  { to: "laporan-bulanan", label: "Rekap Bulanan", icon: IconLaporan },
  { to: "daftar-rekap", label: "Daftar Rekap", icon: IconRekap },
  { to: "kekurangan-bayar", label: "Kekurangan Bayar", icon: IconKekurangan },
];

const dataItems = [
  { to: "list-warga", label: "Warga", icon: IconWarga },
  { to: "tanggal-putih", label: "Tanggal Putih", icon: IconKalender },
  { to: "template-broadcast", label: "Template Broadcast", icon: IconBroadcast },
];

function LogoMark({ size = 36 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-lg bg-accent font-bold text-white"
    >
      J
    </div>
  );
}

function NavLink({ to, label, icon: Icon, active, onClick, collapsed }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition ${
        collapsed ? "justify-center px-0" : "gap-3 px-3.5"
      } ${
        active
          ? "bg-accent text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) {
  const [dataOpen, setDataOpen] = useState(
    dataItems.some((item) => pathname.endsWith(item.to))
  );
  const [flyoutPos, setFlyoutPos] = useState(null);

  const isActive = (slug) => pathname.endsWith(`/${slug}`);
  const dataActive = dataItems.some((item) => isActive(item.to));

  const closeDataMenu = () => {
    onNavigate?.();
    setDataOpen(false);
  };

  const toggleDataMenu = (e) => {
    if (collapsed && !dataOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyoutPos({ top: rect.top, left: rect.right + 8 });
    }
    setDataOpen((prev) => !prev);
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center gap-2 pb-6 pt-6 ${
          collapsed ? "justify-center px-3" : "px-5"
        }`}
      >
        <LogoMark />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold leading-tight text-white">
              Jimpitan
            </div>
            <div className="truncate text-xs font-medium text-slate-400">
              GBK Tempel 2
            </div>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <IconChevron
              className={`transition-transform ${
                collapsed ? "-rotate-90" : "rotate-90"
              }`}
            />
          </button>
        )}
      </div>

      <nav
        className={`flex-1 space-y-1 overflow-y-auto ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            {...item}
            active={isActive(item.to)}
            onClick={onNavigate}
            collapsed={collapsed}
          />
        ))}

        <div className="relative pt-2">
          <button
            type="button"
            onClick={toggleDataMenu}
            aria-expanded={dataOpen}
            title={collapsed ? "Data" : undefined}
            className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition hover:bg-white/5 hover:text-white ${
              collapsed ? "justify-center px-0" : "justify-between px-3.5"
            } ${dataActive ? "text-white" : "text-slate-300"}`}
          >
            <span
              className={`flex items-center ${collapsed ? "" : "gap-3"}`}
            >
              <IconWarga className="shrink-0" />
              {!collapsed && "Data"}
            </span>
            {!collapsed && (
              <IconChevron
                className={`transition-transform ${
                  dataOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {dataOpen && !collapsed && (
            <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-3">
              {dataItems.map((item) => (
                <NavLink
                  key={item.to}
                  {...item}
                  active={isActive(item.to)}
                  onClick={closeDataMenu}
                  collapsed={false}
                />
              ))}
            </div>
          )}

          {dataOpen && collapsed && flyoutPos && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDataOpen(false)}
              />
              <div
                className="fixed z-50 w-48 rounded-lg border border-white/10 bg-ink py-2 shadow-2xl"
                style={{ top: flyoutPos.top, left: flyoutPos.left }}
              >
                {dataItems.map((item) => (
                  <NavLink
                    key={item.to}
                    {...item}
                    active={isActive(item.to)}
                    onClick={closeDataMenu}
                    collapsed={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      <div
        className={`border-t border-white/10 py-4 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Keluar" : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white ${
            collapsed ? "justify-center px-0" : "gap-3 px-3.5"
          }`}
        >
          <IconLogout />
          {!collapsed && "Keluar"}
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ onLogout, collapsed, onToggleCollapse }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-ink px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <LogoMark size={28} />
          <span className="text-base font-bold text-white">Jimpitan</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="text-slate-300"
        >
          <IconMenu />
        </button>
      </div>

      {/* Mobile drawer (always full-width, never collapsed) */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-ink shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-3 text-slate-300"
            >
              <IconClose />
            </button>
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setOpen(false)}
              onLogout={onLogout}
            />
          </div>
        </div>
      )}

      {/* Tablet & desktop sidebar, collapsible */}
      <aside
        className={`hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:bg-ink md:transition-[width] md:duration-200 ${
          collapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>
    </>
  );
}
