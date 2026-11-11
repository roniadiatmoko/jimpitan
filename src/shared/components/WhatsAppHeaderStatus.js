import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ENDPOINT_BASE_URL } from "../config";
import { IconWhatsApp } from "./icons";

export default function WhatsAppHeaderStatus({ isMobile = false }) {
  const [status, setStatus] = useState({
    connected: false,
    starting: false,
    loading: true,
  });

  const checkStatus = async () => {
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/whatsapp/status?auto_start=false`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.status === "OK" && json.data) {
          setStatus({
            connected: Boolean(json.data.connected),
            starting: Boolean(json.data.starting),
            loading: false,
          });
          return;
        }
      }
    } catch (err) {
      // Backend offline atau jaringan terputus
    }
    setStatus((prev) => ({ ...prev, connected: false, loading: false }));
  };

  useEffect(() => {
    checkStatus();
    // Polling setiap 15 detik agar status selalu real-time
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <Link
        to="/admin/status-whatsapp"
        title={
          status.connected
            ? "WhatsApp Terhubung"
            : "WhatsApp Terputus (Klik untuk Scan QR)"
        }
        className="relative flex items-center justify-center rounded-lg p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        <IconWhatsApp className="h-5 w-5" />
        <span
          className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-ink ${
            status.loading
              ? "bg-amber-400 animate-pulse"
              : status.connected
              ? "bg-emerald-500"
              : "bg-rose-500"
          }`}
        />
      </Link>
    );
  }

  // Tampilan Desktop Header
  return (
    <Link
      to="/admin/status-whatsapp"
      title="Klik untuk melihat status koneksi atau scan QR WhatsApp"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        status.loading
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          : status.connected
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
      }`}
    >
      <IconWhatsApp
        className={`h-3.5 w-3.5 ${
          status.connected
            ? "text-emerald-600"
            : status.loading
            ? "text-amber-600"
            : "text-rose-600"
        }`}
      />
      <span className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            status.loading
              ? "bg-amber-500 animate-pulse"
              : status.connected
              ? "bg-emerald-500 animate-pulse"
              : "bg-rose-500"
          }`}
        />
        {status.loading
          ? "Memeriksa WA..."
          : status.connected
          ? "WhatsApp Terhubung"
          : "WhatsApp Terputus"}
      </span>
    </Link>
  );
}
