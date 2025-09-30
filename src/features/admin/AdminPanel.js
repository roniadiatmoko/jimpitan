import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MyNavbar from "../../shared/components/MyNavbar";

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
      <MyNavbar />
      <Outlet />
    </div>
  );
}
