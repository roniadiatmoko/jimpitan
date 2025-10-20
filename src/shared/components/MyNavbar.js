import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function MyNavbar({ onLogout }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const baseLink =
    "rounded-full px-4 py-2 transition font-medium whitespace-nowrap";
  const activeLink = "bg-blue-900 text-white font-bold";
  const hoverLink = "hover:bg-blue-900 hover:text-white";

  const isActive = (slug) => pathname.endsWith(slug);

  return (
    <nav className="m-5 rounded-full shadow-xl">
      <div className="flex justify-between items-center bg-blue-300 rounded-full px-5 py-5">
        {/* Judul / Logo */}
        <div className="font-bold text-lg text-blue-700">Aplikasi Jimpitan</div>

        {/* Toggle Button (mobile) */}
        <button className="md:hidden text-xl" onClick={() => setOpen(!open)}>
          ☰
        </button>

        {/* Menu Desktop */}
        <ul className="hidden md:flex gap-4 items-center">
          <li>
            <Link
              to="rapel-list"
              className={`${baseLink} ${
                isActive("/rapel-list") ? activeLink : hoverLink
              }`}
            >
              Daftar Rapel
            </Link>
          </li>
          <li>
            <Link
              to="detail-harian"
              className={`${baseLink} ${
                isActive("/detail-harian") ? activeLink : hoverLink
              }`}
            >
              Hitung Ulang Harian
            </Link>
          </li>
          <li>
            <Link
              to="pengeluaran"
              className={`${baseLink} block text-center ${
                isActive("/pengeluaran") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Pengeluaran
            </Link>
          </li>
          <li>
            <Link
              to="laporan-bulanan"
              className={`${baseLink} ${
                isActive("/laporan-bulanan") ? activeLink : hoverLink
              }`}
            >
              Rekap Bulanan
            </Link>
          </li>
          <li>
            <Link
              to="kekurangan-bayar"
              className={`${baseLink} ${
                isActive("/kekurangan-bayar") ? activeLink : hoverLink
              }`}
            >
              Kekurangan Bayar
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-700 rounded-full px-4 py-2 text-white font-bold hover:bg-red-900"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>

      {/* Menu Mobile */}
      {open && (
        <ul className="md:hidden flex flex-col gap-2 bg-blue-300 mt-2 rounded-2xl p-3">
          <li>
            <Link
              to="rapel-list"
              className={`${baseLink} block text-center ${
                isActive("/rapel-list") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Daftar Rapel
            </Link>
          </li>
          <li>
            <Link
              to="detail-harian"
              className={`${baseLink} block text-center ${
                isActive("/detail-harian") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Hitung Ulang Harian
            </Link>
          </li>
          <li>
            <Link
              to="laporan-bulanan"
              className={`${baseLink} block text-center ${
                isActive("/laporan-bulanan") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Laporan Bulanan
            </Link>
          </li>
          <li>
            <Link
              to="pengeluaran"
              className={`${baseLink} block text-center ${
                isActive("/pengeluaran") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Pengeluaran
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="bg-red-700 rounded-full px-4 py-2 text-white font-bold hover:bg-red-900 w-full"
            >
              Logout
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
}
