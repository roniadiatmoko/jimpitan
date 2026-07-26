import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userAccount } from "../../shared/config";

export default function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const account = userAccount.find(
      (user) => user.username === username && user.password === password
    );

    if (!account) {
      setError("Username atau kata sandi salah. Coba lagi.");
      return;
    }

    localStorage.setItem("token", "true");
    localStorage.setItem("username", username);
    localStorage.setItem("fullname", account.fullname);

    navigate("/admin", { replace: true });
    onLoginSuccess?.();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-lg font-bold text-white">
            J
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">Jimpitan</h1>
            <p className="text-sm font-medium text-muted">GBK Tempel 2</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-white p-6 shadow-sm"
        >
          <h2 className="mb-5 text-base font-semibold text-ink">
            Masuk sebagai petugas
          </h2>

          <label className="mb-1 block text-xs font-medium text-muted">
            Username
          </label>
          <input
            className="mb-4 w-full rounded-lg border border-line bg-white p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Masukkan username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />

          <label className="mb-1 block text-xs font-medium text-muted">
            Kata Sandi
          </label>
          <input
            type="password"
            className="mb-2 w-full rounded-lg border border-line bg-white p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="mb-2 text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-accent p-3 font-semibold text-white transition hover:bg-accent/90"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}
