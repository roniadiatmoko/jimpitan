import React, { useState } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL } from "../../shared/config";
import Button from "../../shared/components/ui/Button";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const username = localStorage.getItem("username") || "admin";
  const fullname = localStorage.getItem("fullname") || username;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Masukkan kata sandi saat ini.");
      return;
    }
    if (newPassword.length < 4) {
      setError("Kata sandi baru minimal 4 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "OK") {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: "Kata sandi Anda berhasil diperbarui di database.",
          confirmButtonColor: "#0284c7",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      } else {
        setError(data.message || "Gagal mengubah kata sandi.");
      }
    } catch (err) {
      console.error("Gagal change password:", err);
      setError("Gagal terhubung ke server. Periksa koneksi backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line">
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Ganti Kata Sandi</h3>
            <p className="text-xs text-muted">
              Akun: <span className="font-semibold text-accent">{fullname}</span> ({username})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              placeholder="Masukkan kata sandi lama"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-line p-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              placeholder="Minimal 4 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-line p-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-line p-2 text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="bg-accent hover:bg-accent/90"
            >
              {loading ? "Menyimpan..." : "Simpan Kata Sandi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
