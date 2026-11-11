import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL } from "../config";

export default function EnvBadge({ isMobile = false }) {
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const [envMode, setEnvMode] = useState(isLocalHost ? "dev" : "prod");

  useEffect(() => {
    let cancelled = false;
    const fetchEnv = async () => {
      try {
        const res = await fetch(
          `${ENDPOINT_BASE_URL}/api/whatsapp/status?auto_start=false`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.data?.env && !cancelled) {
            const raw = String(json.data.env).toLowerCase();
            setEnvMode(raw.includes("prod") ? "prod" : "dev");
          }
        }
      } catch (e) {
        // Fallback ke deteksi host browser
      }
    };

    fetchEnv();
    const timer = setInterval(fetchEnv, 30000); // Polling setiap 30 detik
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const isProd = envMode === "prod";

  if (isMobile) {
    return (
      <span
        title={`Environment: Mode ${
          isProd ? "Produksi (Live / Online)" : "Pengembangan (Dev / Lokal)"
        }`}
        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
          isProd
            ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
            : "border border-amber-500/40 bg-amber-500/20 text-amber-300"
        }`}
      >
        {isProd ? "PROD" : "DEV"}
      </span>
    );
  }

  // Tampilan Header Desktop
  return (
    <div
      title={`Server Environment: Mode ${
        isProd ? "Produksi (Live / Online)" : "Pengembangan (Dev / Lokal)"
      }`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide transition ${
        isProd
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isProd ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
        }`}
      />
      <span>{isProd ? "MODE: PROD" : "MODE: DEV"}</span>
    </div>
  );
}
