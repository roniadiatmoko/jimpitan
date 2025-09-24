import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useState } from "react";

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("fullname");

    navigate("/admin", { replace: true });
  };

  return (
    <div>
      <nav className="p-1 bg-blue-400 m-5 rounded-full">
        <div className="flex justify-between items-center bg-blue-300 p-1 rounded-full gap-5 w-full font-semibold">
          <div className="p-2 rounded-full items-center w-full text-center">
            <Link
              to="rapel-list"
              relative="route"
              className={
                currentPath.endsWith("/rapel-list") || currentPath === "/admin"
                  ? "bg-blue-900 rounded-full p-3 text-white font-bold"
                  : "hover:bg-blue-900 rounded-full p-3 hover:text-white"
              }
            >
              Daftar Rapel
            </Link>
            <Link
              to="detail-harian"
              relative="route"
              className={
                currentPath.endsWith("detail-harian")
                  ? "bg-blue-900 rounded-full p-3 text-white font-bold"
                  : "hover:bg-blue-900 rounded-full p-3 hover:text-white"
              }
            >
              Detail Harian
            </Link>
          </div>
          <div className="p-1 rounded-full font-semibold">
            <button
              type="button"
              className="bg-red-700 rounded-full p-3 text-white font-bold hover:bg-red-900 hover:rounded-full hover:p-3 hover:text-white"
              onClick={() => handleLogout()}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
