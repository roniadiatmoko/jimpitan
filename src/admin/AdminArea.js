import { useEffect, useState } from "react";
import LoginForm from "../LoginForm";
import AdminPanel from "./AdminPanel";
import { useLocation } from "react-router-dom";

export default function AdminArea() {
    const [isLogin, setIsLogin] = useState(false);
    const [ready, setReady] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLogin(!!token);
        setReady(true);
    }, [location.pathname])

    if(!ready) return null;

    return (
        <div>
            {!isLogin ? <LoginForm /> : <AdminPanel />}
        </div>
    )
}