import { useEffect, useState } from "react";
import LoginForm from "../LoginForm";
import AdminPanel from "./AdminPanel";

export default function AdminArea() {
    const [isLogin, setIsLogin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLogin(true)
        }
    }, [])

    return (
        <div>
            {!isLogin ? <LoginForm /> : <AdminPanel />}
        </div>
    )
}