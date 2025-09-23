import {useState } from "react"
import { ENDPOINTS, userAccount } from "./config";

export default function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = () => {
        let usernameCheck = username;
        let passwordCheck = password;
        userAccount.forEach((user) => {
            if (user.username == usernameCheck && user.password == passwordCheck) {
                localStorage.setItem('token', 'true');
                console.log('logged')
                window.location.href = ENDPOINTS.admin;
            }
        })
    }

    return (
        <div>
            <form
                onSubmit={handleSubmit}
                className="w-full h-screen p-4 pt-20 rounded-lg bg-gray-300"
            >
                <h1 className="text-blue-900 text-center text-2xl font-bold mb-1">Login Sek Bro</h1>

                Username
                <input
                    className="w-full p-2 mb-2 rounded-lg bg-white"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autocus="true"
                />

                Password
                <input 
                    type="password"
                    className="w-full p-2 mb-2 rounded-lg bg-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    type="submit"
                    className="w-full p-2 mb-2 rounded-lg bg-blue-900 text-white"
                >
                    Login
                </button> 
            </form>
        </div>
    )
}   