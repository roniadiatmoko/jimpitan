import {
  HashRouter as Router,
  Link,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useState } from "react";
import RapelList from "./RapelList";
import RapelForm from "./RapelForm";
import DetailHarian from "./DetailHarian";

export default function AdminPanel() {
  const [activeMenu, setActiveMenu] = useState("rapel-list");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/#/admin";
  }

  return (
    <div>
      <Router>
        <nav className="p-1 bg-blue-400 m-5 rounded-full">
          <div className="flex justify-between items-center bg-blue-300 p-1 rounded-full gap-5 w-full font-semibold">
            <div className="p-2 rounded-full items-center w-full text-center">
              <Link
                to="/admin/rapel-list"
                className={
                  activeMenu == "rapel"
                    ? "bg-blue-900 rounded-full p-3 text-white font-bold"
                    : "hover:bg-blue-900 rounded-full p-3 hover:text-white"
                }
                onClick={() => setActiveMenu("rapel")}
              >
                Daftar Rapel
              </Link>
              <Link
                to="/admin/detail-harian"
                className={
                  activeMenu == "detail-harian"
                    ? "bg-blue-900 rounded-full p-3 text-white font-bold"
                    : "hover:bg-blue-900 rounded-full p-3 hover:text-white"
                }
                onClick={() => setActiveMenu("detail-harian")}
              >
                Detail Harian
              </Link>
            </div>
            <div className="p-1 rounded-full font-semibold">
              <Link
                className="bg-red-700 rounded-full p-3 text-white font-bold hover:bg-red-900 hover:rounded-full hover:p-3 hover:text-white"
                onClick={() => handleLogout()}
              >
                Logout
              </Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route
            path="/admin"
            element={<Navigate to="/admin/rapel-list" replace />}
          />
          <Route path="/admin/rapel-list" element={<RapelList />} />
          <Route path="/admin/rapel-input" element={<RapelForm />} />
          <Route path="/admin/detail-harian" element={<DetailHarian />} />
        </Routes>
      </Router>
    </div>
  );
}
