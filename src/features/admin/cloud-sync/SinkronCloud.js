import React, { useEffect, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL } from "../../../shared/config";

export default function SinkronCloud() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [preview, setPreview] = useState(null);
  const [appMode, setAppMode] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatusAndMode = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const [resPreview, resMode] = await Promise.all([
        fetch(`${ENDPOINT_BASE_URL}/api/database/sync-preview`).then((r) => r.json()),
        fetch(`${ENDPOINT_BASE_URL}/api/database/mode`).then((r) => r.json()).catch(() => null),
      ]);

      if (resPreview.status === "OK" && resPreview.data) {
        setPreview(resPreview.data);
      }
      if (resMode && resMode.status === "OK" && resMode.data) {
        setAppMode(resMode.data);
      }
      setLastUpdated(new Date());

      if (showToast) {
        Swal.fire({
          icon: resPreview.data?.connected ? "success" : "warning",
          title: resPreview.data?.connected ? "Data Terhubung" : "Koneksi Bermasalah",
          text: resPreview.data?.message || "Status berhasil diperbarui.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error fetching preview/mode:", err);
      setPreview({
        connected: false,
        status: "ERROR",
        message: "Gagal terhubung ke Cloud PostgreSQL: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusAndMode();
  }, [fetchStatusAndMode]);

  const handleSwitchMode = async (targetMode) => {
    const isToProd = targetMode === "prod";

    if (isToProd) {
      const confirm = await Swal.fire({
        title: "Beralih ke Mode Produksi?",
        html: `
          <div class="text-left text-sm space-y-3">
            <p>Saat masuk ke <b>Mode Produksi (Live)</b>:</p>
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs space-y-1.5">
              <p>✅ <b>Auto-Sync / Mirror PostgreSQL: AKTIF</b><br/>Setiap inputan jimpitan &amp; ronda langsung tersimpan di Cloud PostgreSQL.</p>
              <p>📢 <b>Target WhatsApp Laporan: GRUP UTAMA WARGA</b><br/>Laporan harian otomatis akan terkirim ke nomor/grup resmi warga.</p>
              <p>📥 <b>Auto-Clean:</b> Sistem otomatis menarik data resmi dari Cloud untuk membersihkan sisa data uji coba lokal Anda.</p>
            </div>
            <p class="font-semibold text-gray-700">Lanjutkan beralih ke Mode Produksi?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Masuk Mode Produksi",
        cancelButtonText: "Batal",
      });

      if (!confirm.isConfirmed) return;
    } else {
      const confirm = await Swal.fire({
        title: "Beralih ke Mode Uji Coba?",
        html: `
          <div class="text-left text-sm space-y-3">
            <p>Saat masuk ke <b>Mode Uji Coba (Dev / Testing)</b>:</p>
            <div class="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-1.5">
              <p>🧪 <b>Mirror PostgreSQL: MATI (OFF)</b><br/>Inputan lokal Anda aman dan TIDAK AKAN mengotori database Cloud.</p>
              <p>🛡️ <b>Target WhatsApp Laporan: GRUP TESTING</b><br/>Laporan dan uji coba bot dialihkan ke grup testing khusus.</p>
            </div>
            <p class="font-semibold text-gray-700">Lanjutkan beralih ke Mode Uji Coba?</p>
          </div>
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#d97706",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Masuk Mode Uji Coba",
        cancelButtonText: "Batal",
      });

      if (!confirm.isConfirmed) return;
    }

    setSwitching(true);
    Swal.fire({
      title: isToProd ? "Menyiapkan Mode Produksi..." : "Mengalihkan ke Mode Uji Coba...",
      html: isToProd
        ? "Sedang menyelaraskan data dengan Cloud dan mengaktifkan mirror PostgreSQL.<br/>Mohon tunggu sebentar..."
        : "Sedang mengamankan database Cloud dan mematikan mirror...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/database/switch-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_mode: targetMode, pull_first: true }),
      });
      const json = await res.json();

      if (json.status === "OK") {
        await Swal.fire({
          icon: "success",
          title: isToProd ? "Mode Produksi Aktif! 🟢" : "Mode Uji Coba Aktif! 🧪",
          text: json.message,
          confirmButtonColor: isToProd ? "#059669" : "#d97706",
        });
        fetchStatusAndMode();
      } else {
        throw new Error(json.message || "Gagal mengubah mode.");
      }
    } catch (err) {
      console.error("Error switching mode:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Beralih Mode",
        text: err.message,
      });
    } finally {
      setSwitching(false);
    }
  };

  const handlePullAll = async () => {
    if (!preview || !preview.connected) {
      Swal.fire({
        icon: "error",
        title: "Cloud Belum Terhubung",
        text: "Koneksi ke server PostgreSQL Cloud gagal. Pastikan laptop terhubung ke internet.",
      });
      return;
    }

    const isAhead = preview.is_local_ahead || preview.status === "AHEAD";

    let confirm;
    if (isAhead) {
      confirm = await Swal.fire({
        title: "Tarik Data & Hapus Data Uji Coba?",
        html: `
          <div class="text-left text-sm space-y-3">
            <div class="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs space-y-1.5">
              <p class="font-bold text-sm">⚠️ PERINGATAN: Database Lokal Lebih Baru!</p>
              <p>
                Tanggal terakhir di lokal: <b>${preview.local?.max_tanggal || "-"}</b><br/>
                Tanggal terakhir di Cloud: <b>${preview.cloud?.max_tanggal || "-"}</b>
              </p>
              <p class="text-rose-800 leading-relaxed">
                Tindakan ini akan <b>MENGHAPUS dan MENIMPA seluruh data lokal yang lebih baru</b> dengan data resmi dari Cloud PostgreSQL. Ini sangat cocok jika Anda selesai melakukan uji coba data di lokal dan ingin mereset kembali ke data asli Cloud.
              </p>
            </div>
            <p class="text-xs text-gray-500 italic">
              *Catatan: Jika data lokal ini adalah data ronda asli yang belum terunggah, silakan klik <b>Batal</b> lalu pilih tombol <b>Unggah ke Cloud (Push)</b>.
            </p>
            <p class="font-semibold text-gray-800">Apakah Anda yakin ingin menimpa data lokal dan mengikuti data Cloud?</p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Hapus Data Lokal & Ikuti Cloud",
        cancelButtonText: "Batal",
      });
    } else {
      confirm = await Swal.fire({
        title: "Tarik Semua Data dari Cloud?",
        html: `
          <div class="text-left text-sm space-y-2">
            <p>Tindakan ini akan <b>menarik dan menyelaraskan seluruh tabel SQLite lokal</b> dengan data produksi terbaru dari PostgreSQL Cloud.</p>
            <div class="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg text-xs">
              ⚠️ <b>Tabel yang disinkronkan meliputi:</b><br/>
              - Data Warga (ref_warga)<br/>
              - Seluruh Transaksi Ronda Harian (jimpitan)<br/>
              - Pembayaran Rapel &amp; Pemutihan<br/>
              - Rekap Kas &amp; Pengeluaran
            </div>
            <p class="font-semibold text-gray-700">Apakah Anda yakin ingin melanjutkan?</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Ya, Tarik Semua Data",
        cancelButtonText: "Batal",
      });
    }

    if (!confirm.isConfirmed) return;

    setSyncing(true);
    Swal.fire({
      title: "Menarik Data dari Cloud...",
      html: "Sedang mengunduh dan menyinkronkan seluruh tabel ke SQLite lokal.<br/>Mohon tunggu sebentar...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/database/pull-from-cloud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: isAhead }),
      });
      const json = await res.json();

      if (json.status === "OK") {
        const tableList = json.tables
          ? Object.entries(json.tables)
              .map(([name, count]) => `<li><b>${name}</b>: ${Number(count).toLocaleString()} baris</li>`)
              .join("")
          : "";

        await Swal.fire({
          icon: "success",
          title: "Sinkronisasi Berhasil!",
          html: `
            <div class="text-left text-sm space-y-2">
              <p>Seluruh data dari Cloud PostgreSQL telah sukses tersalin ke SQLite lokal.</p>
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs max-h-48 overflow-y-auto">
                <ul class="list-disc list-inside space-y-1">
                  ${tableList}
                </ul>
              </div>
            </div>
          `,
          confirmButtonColor: "#059669",
        });

        fetchStatusAndMode();
      } else {
        throw new Error(json.message || "Gagal sinkronisasi data");
      }
    } catch (err) {
      console.error("Error pulling data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menarik Data",
        text: err.message,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handlePushAll = async () => {
    if (!preview || !preview.connected) {
      Swal.fire({
        icon: "error",
        title: "Cloud Belum Terhubung",
        text: "Koneksi ke server PostgreSQL Cloud gagal. Pastikan laptop terhubung ke internet.",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Unggah Semua Data Lokal ke Cloud (Push)?",
      html: `
        <div class="text-left text-sm space-y-3">
          <p>Tindakan ini akan <b>mengunggah dan memperbarui seluruh tabel di PostgreSQL Cloud</b> dengan data dari SQLite laptop ini.</p>
          <div class="bg-indigo-50 border border-indigo-200 text-indigo-900 p-2.5 rounded-lg text-xs space-y-1.5">
            <p>💡 <b>Gunakan ini jika:</b></p>
            <p>Database lokal di laptop ini berisi <b>data ronda asli/riil</b> tetapi Cloud sempat tertinggal (misal setelah ronda offline).</p>
            <p>Tanggal ronda lokal: <b>${preview.local?.max_tanggal || "-"}</b> | Total jimpitan: <b>${Number(preview.local?.total_jimpitan || 0).toLocaleString()}</b> baris</p>
          </div>
          <p class="font-semibold text-gray-700">Apakah Anda yakin ingin mengunggah ke Cloud?</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Unggah ke Cloud (Push)",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setPushing(true);
    Swal.fire({
      title: "Mengunggah Data ke Cloud...",
      html: "Sedang menyalin dan memperbarui database PostgreSQL Cloud dengan data lokal.<br/>Mohon tunggu sebentar...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/database/push-to-cloud`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.status === "OK") {
        const tableList = json.tables
          ? Object.entries(json.tables)
              .map(([name, count]) => `<li><b>${name}</b>: ${Number(count).toLocaleString()} baris</li>`)
              .join("")
          : "";

        await Swal.fire({
          icon: "success",
          title: "Unggah ke Cloud Berhasil!",
          html: `
            <div class="text-left text-sm space-y-2">
              <p>Seluruh data lokal SQLite telah berhasil diunggah ke PostgreSQL Cloud.</p>
              <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-lg text-xs max-h-48 overflow-y-auto">
                <ul class="list-disc list-inside space-y-1">
                  ${tableList}
                </ul>
              </div>
            </div>
          `,
          confirmButtonColor: "#059669",
        });

        fetchStatusAndMode();
      } else {
        throw new Error(json.message || "Gagal mengunggah data ke Cloud");
      }
    } catch (err) {
      console.error("Error pushing data:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengunggah ke Cloud",
        text: err.message,
      });
    } finally {
      setPushing(false);
    }
  };


  const handleBackupTelegram = async () => {
    const confirm = await Swal.fire({
      title: "Kirim Backup Database ke Telegram?",
      html: `
        <div class="text-left text-sm space-y-2">
          <p>Sistem akan membuat <b>snapshot aman SQLite (Anti-Corrupt VACUUM)</b>, mengompresinya ke format <b>.sqlite.gz</b> (hemat 80%+ kuota), dan mengirimkannya langsung ke Telegram Anda.</p>
          <div class="bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded-lg text-xs space-y-1">
            <p>💡 <b>Catatan:</b> Backup ini juga <b>otomatis terkirim setiap kali petugas ronda selesai menginput jimpitan harian</b>. Tombol ini disediakan jika Anda ingin backup manual sewaktu-waktu.</p>
          </div>
          <p class="font-semibold text-gray-700">Lanjutkan pengiriman backup?</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Kirim ke Telegram",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setBackingUp(true);
    Swal.fire({
      title: "Membuat Snapshot & Mengirim...",
      html: "Sedang membuat snapshot SQLite dan mengunggah ke Telegram.<br/>Mohon tunggu sebentar...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/database/backup-telegram`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.status === "OK") {
        await Swal.fire({
          icon: "success",
          title: "Backup Terkirim ke Telegram! 📦",
          html: `
            <div class="text-left text-sm space-y-2">
              <p>File database SQLite berhasil di-backup dan dikirim ke Telegram.</p>
              <div class="bg-sky-50 border border-sky-200 text-sky-900 p-2.5 rounded-lg text-xs space-y-1">
                <p>📄 <b>Nama File:</b> <code class="font-mono">${json.filename}</code></p>
                <p>💾 <b>Ukuran:</b> ${(json.gz_size_bytes / 1024).toFixed(0)} KB (Kompresi GZIP)</p>
              </div>
            </div>
          `,
          confirmButtonColor: "#0284c7",
        });
      } else {
        throw new Error(json.message || "Gagal mengirim backup");
      }
    } catch (err) {
      console.error("Error backing up to Telegram:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Backup",
        text: err.message,
      });
    } finally {
      setBackingUp(false);
    }
  };

  const isCurrentProd = appMode?.is_prod;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sinkronisasi Cloud &amp; Mode Server</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola sinkronisasi PostgreSQL, periksa data tertinggal, dan beralih antara Mode Uji Coba dan Mode Produksi.
          </p>
        </div>
        <div className="flex items-center gap-2">
                    <button
            onClick={handleBackupTelegram}
            disabled={backingUp || loading || syncing || pushing || switching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition shadow-sm disabled:opacity-50"
            title="Kirim file snapshot database (.sqlite.gz) ke Telegram"
          >
            {backingUp ? (
              <svg className="w-4 h-4 animate-spin text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.66-2.88 8-3.44 3.81-1.59 4.6-1.87 5.12-1.88.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.2-.04.34z"/>
              </svg>
            )}
            {backingUp ? "Mengirim..." : "Backup ke Telegram"}
          </button>
          <button
            onClick={() => fetchStatusAndMode(true)}
            disabled={loading || syncing || pushing || switching}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Periksa Status Cloud
          </button>
        </div>
      </div>

      {/* SAKELAR MODE BANNER */}
      {appMode && (
        <div
          className={`p-5 rounded-2xl border shadow-sm transition ${
            isCurrentProd
              ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border-emerald-300 text-emerald-950"
              : "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs ${
                    isCurrentProd
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {isCurrentProd ? "🟢 MODE PRODUKSI (LIVE)" : "🧪 MODE UJI COBA (TESTING)"}
                </span>
                <span className="text-xs font-semibold text-gray-600">
                  Target WA: <b>{appMode.target_group_label}</b>
                </span>
              </div>
              <p className="text-sm pt-1">
                {isCurrentProd ? (
                  <span>
                    Server sedang berjalan di <b>Mode Produksi</b>. Setiap inputan otomatis ter-mirror ke PostgreSQL dan laporan terkirim ke <b>Grup Utama Warga</b>.
                  </span>
                ) : (
                  <span>
                    Server sedang berjalan di <b>Mode Uji Coba</b>. Mirror ke PostgreSQL <b>MATI</b> (bebas coba-coba data) dan laporan WhatsApp dialihkan ke <b>Grup Testing</b>.
                  </span>
                )}
              </p>
            </div>

            <div className="shrink-0">
              {isCurrentProd ? (
                <button
                  onClick={() => handleSwitchMode("dev")}
                  disabled={switching || syncing || pushing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  🧪 Beralih ke Mode Uji Coba
                </button>
              ) : (
                <button
                  onClick={() => handleSwitchMode("prod")}
                  disabled={switching || syncing || pushing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50"
                >
                  🚀 Beralih ke Mode Produksi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Box */}
      {loading && !preview ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-sm font-medium text-gray-600">Menghubungi Cloud PostgreSQL (Layerbase)...</p>
        </div>
      ) : preview && !preview.connected ? (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-rose-900">Gagal Terhubung ke Cloud</h3>
              <p className="text-sm text-rose-700 mt-1">{preview.message}</p>
              <p className="text-xs text-rose-600 mt-2">
                Pastikan perangkat ini terhubung ke internet dan database serverless Layerbase sedang aktif.
              </p>
            </div>
          </div>
        </div>
      ) : preview ? (
        <>
          {/* Status Alert Banner */}
          {preview.is_local_ahead || preview.status === "AHEAD" ? (
            <div className="p-5 bg-indigo-50 border-2 border-indigo-300 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shrink-0 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full uppercase tracking-wider">
                      ℹ️ Database Lokal Lebih Baru
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                      Selisih {preview.days_ahead} Hari Inputan
                    </span>
                    <span className="text-xs text-gray-500">
                      (Lokal: {preview.local?.max_tanggal} vs Cloud: {preview.cloud?.max_tanggal || "Belum ada"})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-indigo-950 mt-1.5">
                    Data lokal lebih baru dibanding server Cloud
                  </h3>
                  <p className="text-sm text-indigo-900 mt-1 leading-relaxed">
                    Kondisi ini terjadi jika Anda baru saja melakukan uji coba input di lokal, atau menginput ronda secara offline di pos ronda:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    <div className="p-3 bg-white/90 rounded-xl border border-indigo-200 text-xs text-gray-700 shadow-2xs space-y-1">
                      <p className="font-bold text-rose-700 flex items-center gap-1">
                        🧹 Selesai Uji Coba?
                      </p>
                      <p className="leading-relaxed">
                        Gunakan tombol <b>Tarik &amp; Timpa dari Cloud</b> di bawah untuk menghapus data uji coba dan mengembalikan database lokal ke data resmi Cloud.
                      </p>
                    </div>
                    <div className="p-3 bg-white/90 rounded-xl border border-indigo-200 text-xs text-gray-700 shadow-2xs space-y-1">
                      <p className="font-bold text-indigo-700 flex items-center gap-1">
                        📤 Data Ronda Riil?
                      </p>
                      <p className="leading-relaxed">
                        Gunakan tombol <b>Unggah ke Cloud (Push)</b> jika data lokal adalah data ronda asli agar server Cloud diperbarui menyusul laptop ini.
                      </p>
                    </div>
                  </div>

                  {preview.local_ahead_dates && preview.local_ahead_dates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-xs font-semibold text-indigo-900 mb-1.5">
                        Tanggal ronda di lokal yang belum ada di Cloud:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.local_ahead_dates.map((tgl) => (
                          <span
                            key={tgl}
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-white text-indigo-900 border border-indigo-300 shadow-2xs"
                          >
                            📅 {tgl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : preview.status === "BEHIND" ? (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-200 text-amber-800 rounded-full uppercase tracking-wider">
                      Tertinggal {preview.days_behind} Hari
                    </span>
                    <span className="text-xs text-gray-500">
                      (Inputan Ronda Cloud: {preview.cloud?.max_tanggal} vs Lokal: {preview.local?.max_tanggal || "Belum ada"})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-amber-950 mt-1">
                    Data lokal Anda tertinggal {preview.days_behind} hari inputan petugas ronda!
                  </h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Petugas ronda di lapangan sudah menginputkan data yang belum ada di database laptop ini.
                  </p>

                  {preview.missing_dates && preview.missing_dates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200">
                      <p className="text-xs font-semibold text-amber-900 mb-1.5">
                        Tanggal ronda yang belum ada di lokal:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.missing_dates.map((tgl) => (
                          <span
                            key={tgl}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-white text-amber-900 border border-amber-300 shadow-2xs"
                          >
                            📅 {tgl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-200 text-emerald-800 rounded-full uppercase tracking-wider">
                      Up to Date
                    </span>
                    <span className="text-xs text-emerald-700">Semua inputan ronda sudah sinkron</span>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950 mt-1">
                    Database lokal sudah sama dengan data Cloud!
                  </h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    Tanggal inputan jimpitan terakhir di Cloud maupun Lokal sama-sama berada di tanggal{" "}
                    <b>{preview.cloud?.max_tanggal}</b>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h3 className="font-bold text-gray-900">Database Lokal (SQLite)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                  Offline / Laptop
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Tgl Ronda Terakhir</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {preview.local?.max_tanggal || "Belum Ada"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Total Warga</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {preview.local?.total_warga || 0} Rumah
                  </p>
                </div>
                <div className="col-span-2 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Total Baris Jimpitan</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">
                    {Number(preview.local?.total_jimpitan || 0).toLocaleString()} Baris
                  </p>
                </div>
              </div>
            </div>

            {/* Cloud Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="font-bold text-gray-900">Database Cloud (PostgreSQL)</h3>
                </div>
                <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono">
                  Layerbase Live
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-gray-500">Tgl Ronda Terakhir</p>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">
                    {preview.cloud?.max_tanggal || "Belum Ada"}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-gray-500">Total Warga</p>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">
                    {preview.cloud?.total_warga || 0} Rumah
                  </p>
                </div>
                <div className="col-span-2 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-gray-500">Total Baris Jimpitan</p>
                  <p className="text-base font-bold text-emerald-900 mt-0.5">
                    {Number(preview.cloud?.total_jimpitan || 0).toLocaleString()} Baris
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white p-6 rounded-3xl shadow-xl shadow-slate-950/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    Sinkronisasi Manual
                  </span>
                  {preview.is_local_ahead && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Lokal Lebih Baru
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold">
                  {preview.is_local_ahead
                    ? "Tarik Data Cloud atau Unggah Data Lokal"
                    : "Sinkronkan Seluruh Data"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {preview.is_local_ahead
                    ? "Gunakan 'Tarik & Timpa dari Cloud' untuk membersihkan data uji coba lokal Anda, atau 'Unggah ke Cloud' jika data lokal ini adalah data ronda asli yang belum terunggah."
                    : "Tindakan ini akan menarik seluruh tabel dari PostgreSQL (data warga, jimpitan, rapel, pengeluaran, rekap) ke database lokal SQLite."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Tombol Tarik dari Cloud (Pull) */}
                <button
                  onClick={handlePullAll}
                  disabled={syncing || pushing || switching || !preview.connected}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold rounded-2xl transition shadow-lg disabled:opacity-50 ${
                    preview.is_local_ahead
                      ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30"
                  }`}
                >
                  {syncing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Menyinkronkan...
                    </>
                  ) : preview.is_local_ahead ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      📥 Tarik & Timpa dari Cloud
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      📥 Tarik Semua Data dari Cloud
                    </>
                  )}
                </button>

                {/* Tombol Push ke Cloud */}
                <button
                  onClick={handlePushAll}
                  disabled={pushing || syncing || switching || !preview.connected}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition shadow-lg disabled:opacity-50"
                >
                  {pushing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Mengunggah...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      📤 Unggah ke Cloud (Push)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-gray-800">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Penjelasan Sakelar Mode &amp; Arah Sinkronisasi:
            </div>
            <p>
              • <b>Sinkronisasi Dua Arah Aman</b>: Jika database lokal lebih baru dibanding Cloud (misal selesai uji coba input), Anda tetap dapat menarik data Cloud untuk membersihkan data uji coba lokal dengan konfirmasi peringatan. Tombol <b>Unggah ke Cloud</b> juga selalu tersedia jika data lokal adalah data ronda asli offline.
            </p>
            <p>
              • <b>Mode Uji Coba (Dev)</b>: Mirror PostgreSQL otomatis dimatikan (<code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono">ENABLE_PG_MIRROR=false</code>) dan laporan WhatsApp dikirim ke grup testing.
            </p>
            <p>
              • <b>Backup Otomatis ke Telegram</b>: Setiap kali petugas ronda selesai menginput jimpitan harian, sistem otomatis membuat snapshot database aman (<code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono">.sqlite.gz</code>) dan mengirimkannya ke Telegram bot sebagai proteksi hardware laptop.
            </p>
            <p>
              • <b>Mode Produksi (Prod)</b>: Mirror PostgreSQL diaktifkan (<code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono">ENABLE_PG_MIRROR=true</code>), dan laporan WhatsApp diarahkan ke grup utama warga.
            </p>
            {lastUpdated && (
              <p className="text-gray-400 text-[11px] pt-1">
                Terakhir diperiksa: {lastUpdated.toLocaleTimeString("id-ID")}
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

