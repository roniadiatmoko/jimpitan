import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Spinner from "../../../shared/components/ui/Spinner";

export default function UpdateAplikasi() {
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [logs, setLogs] = useState([]);
  const [countdown, setCountdown] = useState(null);

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/system/info`);
      const data = await res.json();
      if (data.status === "OK") {
        setSystemInfo(data);
      }
    } catch (err) {
      console.error("Gagal memuat status sistem:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      window.location.reload();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleUpdate = async () => {
    const confirm = await Swal.fire({
      title: "Perbarui Aplikasi Sekarang?",
      html: `
        <div class="text-left text-sm space-y-2">
          <p>Sistem akan menjalankan rangkaian proses berikut secara otomatis di server:</p>
          <ol class="list-decimal pl-5 space-y-1 text-gray-700">
            <li>Menarik commit terbaru backend dari GitHub (<code>git pull</code>).</li>
            <li>Memeriksa dependensi backend (<code>npm install</code>).</li>
            <li>Menarik kode frontend terbaru dari GitHub (<code>git pull</code>).</li>
            <li>Memeriksa dependensi frontend & <b>membangun ulang (build)</b>.</li>
            <li>Me-restart server backend dan frontend secara aman.</li>
          </ol>
          <p class="mt-2 text-amber-600 font-semibold text-xs">⚠️ Proses ini memerlukan waktu sekitar 20 - 45 detik. Halaman jangan ditutup selama proses berjalan.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Mulai Update",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
    });

    if (!confirm.isConfirmed) return;

    setUpdating(true);
    setLogs([
      {
        step: 0,
        title: "Memulai proses pembaruan...",
        details: "Menghubungi server untuk eksekusi update",
        timestamp: new Date().toLocaleTimeString("id-ID"),
      },
    ]);

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/system/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
      }

      if (data.status === "OK") {
        Swal.fire({
          title: "Update Berhasil!",
          text: "Semua pembaruan berhasil diterapkan dan server sedang memuat ulang. Halaman akan otomatis di-refresh.",
          icon: "success",
          timer: 5000,
          showConfirmButton: false,
        });
        setCountdown(5);
      } else {
        throw new Error(data.message || data.error || "Gagal melakukan update");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Update Gagal",
        text: err.message || "Terjadi kesalahan saat menjalankan proses update.",
        icon: "error",
      });
      setLogs((prev) => [
        ...prev,
        {
          step: 99,
          title: "Terjadi Kesalahan",
          details: err.message,
          timestamp: new Date().toLocaleTimeString("id-ID"),
        },
      ]);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <span>🚀</span> Update &amp; Pemeliharaan Sistem
            </h1>
            <p className="mt-1 text-xs text-muted">
              Pembaruan otomatis seluruh kode sumber backend, frontend, instalasi dependensi, dan restart server.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="text-xs !py-2 !px-3"
              onClick={fetchSystemInfo}
              disabled={loading || updating}
            >
              🔄 Refresh Info
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Status Server */}
      {loading ? (
        <Card>
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        </Card>
      ) : systemInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Backend */}
          <Card>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-ink text-sm">Server Backend API</h3>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Node {systemInfo.nodeVersion}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Commit Terpasang:</span>
                <span className="font-mono font-bold text-ink">
                  {systemInfo.backend.commit} ({systemInfo.backend.branch})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Pesan Commit:</span>
                <span className="font-medium text-ink truncate max-w-[220px]">
                  {systemInfo.backend.commitMessage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Waktu Commit:</span>
                <span className="text-slate-600">{systemInfo.backend.commitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Sistem Operasi:</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {systemInfo.platform} {systemInfo.isLinux ? "(Linux Mint / Production)" : "(Windows Dev)"}
                </span>
              </div>
            </div>
          </Card>

          {/* Card Frontend */}
          <Card>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-sky-500 animate-pulse"></span>
                <h3 className="font-bold text-ink text-sm">Frontend Web Client</h3>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  systemInfo.buildExists
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {systemInfo.buildExists ? "Build Siap ✅" : "Build Belum Ada ⚠️"}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Commit Terpasang:</span>
                <span className="font-mono font-bold text-ink">
                  {systemInfo.frontend.commit} ({systemInfo.frontend.branch})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Pesan Commit:</span>
                <span className="font-medium text-ink truncate max-w-[220px]">
                  {systemInfo.frontend.commitMessage}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Waktu Commit:</span>
                <span className="text-slate-600">{systemInfo.frontend.commitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status Remote GitHub:</span>
                <span
                  className={`font-semibold ${
                    systemInfo.updateAvailable ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {systemInfo.updateAvailable ? "Tersedia Update ⚠️" : "Sudah Terbaru ✅"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Action Update Card */}
      <Card>
        <div className="p-2 sm:p-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-4 text-2xl">
            🚀
          </div>
          <h2 className="text-lg font-bold text-ink">
            {systemInfo?.updateAvailable
              ? "Tersedia Versi Pembaruan Baru di GitHub!"
              : "Pembaruan & Sinkronisasi Sistem"}
          </h2>
          <p className="mt-1 text-xs text-muted max-w-lg mx-auto">
            Klik tombol di bawah ini untuk menarik pembaruan kode terbaru dari repositori GitHub, menginstall dependensi baru jika ada, membangun ulang file produksi frontend, dan me-restart server secara otomatis.
          </p>

          {countdown !== null && (
            <div className="my-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl max-w-md mx-auto text-emerald-900 font-bold text-sm">
              Server sedang memuat ulang. Halaman akan me-refresh dalam{" "}
              <span className="text-emerald-700 text-lg font-black">{countdown}</span> detik...
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              className="!py-3 !px-8 text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent/20"
              onClick={handleUpdate}
              disabled={updating || countdown !== null}
            >
              {updating ? (
                <>
                  <Spinner size="sm" />
                  <span>Sedang Memproses Update...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Perbarui Aplikasi &amp; Restart Server</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Live Terminal Progress Log */}
        {logs.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <span>💻</span> Log Eksekusi Server
              </span>
              {updating && (
                <span className="text-xs text-accent animate-pulse font-medium">
                  Memproses perintah...
                </span>
              )}
            </div>

            <div className="rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100 max-h-72 overflow-y-auto space-y-1.5 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={
                      log.step === 99
                        ? "text-red-400 font-bold"
                        : log.step === 6
                        ? "text-emerald-400 font-bold"
                        : "text-slate-200"
                    }
                  >
                    {log.title}
                  </span>
                  {log.details && (
                    <span className="text-slate-400 text-[11px] truncate">
                      ({log.details})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Petunjuk Manual Eksekusi di Terminal Linux */}
      <Card>
        <h3 className="font-bold text-ink text-sm flex items-center gap-2 mb-2">
          <span>🐧</span> Alternatif: Jalankan Manual di Terminal Linux Mint
        </h3>
        <p className="text-xs text-muted mb-3">
          Jika sewaktu-waktu Bapak berada langsung di depan laptop Linux Mint di rumah, pembaruan juga bisa dijalankan lewat file script shell yang telah disiapkan di folder project:
        </p>

        <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-400 select-all">
          cd ~/jimpitan/backend && bash update-aplikasi.sh
        </div>
      </Card>
    </div>
  );
}
