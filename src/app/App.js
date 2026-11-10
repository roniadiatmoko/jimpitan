import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    window.location.replace("https://jimpitan-gbk.roniadiatmoko.my.id");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "20px",
        boxSizing: "border-box",
        textAlign: "center",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          maxWidth: "460px",
          width: "100%",
          padding: "36px 28px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#f8fafc",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "16px" }}>🏮</div>
        <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "10px", color: "#ffffff" }}>
          Aplikasi Jimpitan Telah Berpindah
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" }}>
          Sistem kas jimpitan warga <strong>GBK Tempel 2</strong> telah beralih ke server baru yang lebih cepat dan aman.
        </p>
        <a
          href="https://jimpitan-gbk.roniadiatmoko.my.id"
          style={{
            display: "block",
            background: "#2563eb",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: "10px",
            fontWeight: "600",
            fontSize: "16px",
            textDecoration: "none",
            marginBottom: "20px",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
          }}
        >
          Buka Jimpitan Baru Sekarang ↗
        </a>
        <div style={{ color: "#64748b", fontSize: "13px" }}>
          Sedang mengalihkan Anda secara otomatis...<br />
          Jika tidak beralih, klik tombol di atas atau kunjungi:<br />
          <code
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "4px 8px",
              background: "rgba(15, 23, 42, 0.6)",
              borderRadius: "6px",
              color: "#38bdf8",
              fontFamily: "monospace",
            }}
          >
            https://jimpitan-gbk.roniadiatmoko.my.id
          </code>
        </div>
      </div>
    </div>
  );
}
