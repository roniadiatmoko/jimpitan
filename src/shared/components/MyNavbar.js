import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function MyNavbar({ onLogout }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);

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
          <li className="relative">
            <button
              type="button"
              onClick={() => setDataOpen((prev) => !prev)}
              className={`${baseLink} inline-flex items-center gap-2 ${
                isActive("/list-warga") || isActive("/tanggal-putih")
                  ? activeLink
                  : hoverLink
              }`}
              aria-expanded={dataOpen}
            >
              Data
              <span className="text-sm">▾</span>
            </button>
            <div
              className={`absolute left-0 top-full mt-2 min-w-[180px] flex-col rounded-xl border border-blue-200 bg-white shadow-lg ${
                dataOpen ? "flex" : "hidden"
              }`}
            >
              <Link
                to="list-warga"
                className={`${baseLink} block rounded-t-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900`}
                onClick={() => setDataOpen(false)}
              >
                Warga
              </Link>
              <Link
                to="tanggal-putih"
                className={`${baseLink} block text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900`}
                onClick={() => setDataOpen(false)}
              >
                Tanggal Putih
              </Link>
              <Link
                to="template-broadcast"
                className={`${baseLink} block rounded-b-xl text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-900`}
                onClick={() => setDataOpen(false)}
              >
                Template Broadcast
              </Link>
            </div>
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
            <Link
              to="kekurangan-bayar"
              className={`${baseLink} block text-center ${
                isActive("/kekurangan-bayar") ? activeLink : hoverLink
              }`}
            >
              Kekurangan Bayar
            </Link>
          </li>
          <li className="border-t border-blue-200 pt-2">
            <span className="block text-center font-semibold text-blue-900">
              Data
            </span>
            <Link
              to="list-warga"
              className={`${baseLink} block text-center ${
                isActive("/list-warga") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Warga
            </Link>
            <Link
              to="tanggal-putih"
              className={`${baseLink} block text-center ${
                isActive("/tanggal-putih") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Tanggal Putih
            </Link>
            <Link
              to="template-broadcast"
              className={`${baseLink} block text-center ${
                isActive("/template-broadcast") ? activeLink : hoverLink
              }`}
              onClick={() => setOpen(false)}
            >
              Template Broadcast
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
