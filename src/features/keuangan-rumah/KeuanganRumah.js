import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import CurrencyInput from "react-currency-input-field";
import { ENDPOINT_BASE_URL, months } from "../../shared/config";
import { rupiahFormat } from "../../shared/helpers/MoneyHeper";
import Card from "../../shared/components/ui/Card";
import Button from "../../shared/components/ui/Button";
import Spinner from "../../shared/components/ui/Spinner";

const KATEGORI_PENGELUARAN = [
  "Pangan / Dapur",
  "Tagihan & Utilitas",
  "Kebutuhan Rumah",
  "Transportasi & Bensin",
  "Pendidikan & Anak",
  "Kesehatan",
  "Jajan & Hiburan",
  "Lain-lain",
];

const KATEGORI_PEMASUKAN = [
  "Gaji / Pendapatan Pokok",
  "Usaha / Bisnis",
  "Bonus / THR",
  "Transfer Keluarga",
  "Lain-lain",
];

function formatTanggalIndo(dateStr) {
  if (!dateStr) return "-";
  try {
    const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [y, m, d] = raw.split("-");
    if (y && m && d) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];
      const monthIdx = parseInt(m, 10) - 1;
      return `${parseInt(d, 10)} ${monthNames[monthIdx] || m} ${y}`;
    }
    return raw;
  } catch {
    return dateStr;
  }
}

function getTodayLocalDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function KeuanganRumah() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // PIN Lock State
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem("keuangan_rumah_unlocked") === "true"
  );
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Filter State
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Data State
  const [loading, setLoading] = useState(false);
  const [transaksiList, setTransaksiList] = useState([]);
  const [rekap, setRekap] = useState(null);
  const [filterJenis, setFilterJenis] = useState("semua");

  // Modal Input Manual
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [formTanggal, setFormTanggal] = useState(getTodayLocalDateStr());
  const [formJenis, setFormJenis] = useState("pengeluaran");
  const [formKategori, setFormKategori] = useState(KATEGORI_PENGELUARAN[0]);
  const [formNominal, setFormNominal] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formSumberDana, setFormSumberDana] = useState("Cash");
  const [formDicatatOleh, setFormDicatatOleh] = useState("Pak Roni");
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const start = 2025;
    const length = Math.max(currentYear - start + 2, 2);
    return Array.from({ length }, (_, idx) => String(start + idx));
  }, [currentYear]);

  // Handle PIN Unlock via API Backend
  const handleUnlock = async (e) => {
    e?.preventDefault();
    if (!pinInput.trim()) {
      setPinError("Silakan masukkan PIN keamanan.");
      return;
    }
    setVerifyingPin(true);
    setPinError("");
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/keuangan-rumah/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.status === "OK" && data.valid) {
        setIsUnlocked(true);
        sessionStorage.setItem("keuangan_rumah_unlocked", "true");
        setPinError("");
      } else {
        setPinError(data.message || "PIN keamanan tidak tepat. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Gagal verifikasi PIN:", err);
      setPinError("Gagal terhubung ke server untuk verifikasi PIN.");
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("keuangan_rumah_unlocked");
    setPinInput("");
  };

  // Fetch Data
  const fetchData = async () => {
    if (!isUnlocked) return;
    setLoading(true);
    try {
      const [resList, resRekap] = await Promise.all([
        fetch(
          `${ENDPOINT_BASE_URL}/api/keuangan-rumah?bulan=${selectedMonth}&tahun=${selectedYear}`
        ),
        fetch(
          `${ENDPOINT_BASE_URL}/api/keuangan-rumah/rekap?bulan=${selectedMonth}&tahun=${selectedYear}`
        ),
      ]);

      const dataList = await resList.json();
      const dataRekap = await resRekap.json();

      if (dataList.status === "OK") {
        setTransaksiList(dataList.data || []);
      }
      if (dataRekap.status === "OK") {
        setRekap(dataRekap.rekap || null);
      }
    } catch (err) {
      console.error("Gagal memuat data keuangan rumah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchData();
    }
  }, [isUnlocked, selectedMonth, selectedYear]);

  // Simpan Transaksi Manual
  const handleSubmitTransaksi = async (e) => {
    e.preventDefault();
    if (!formNominal || Number(formNominal) <= 0) {
      Swal.fire("Perhatian", "Nominal transaksi harus diisi dengan angka valid.", "warning");
      return;
    }
    if (!formKeterangan.trim()) {
      Swal.fire("Perhatian", "Keterangan belanja/transaksi harus diisi.", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/keuangan-rumah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: formTanggal,
          jenis: formJenis,
          kategori: formKategori,
          nominal: Number(formNominal),
          keterangan: formKeterangan.trim(),
          sumber_dana: formSumberDana,
          dicatat_oleh: formDicatatOleh,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan transaksi");

      setShowModalAdd(false);
      setFormNominal("");
      setFormKeterangan("");
      await fetchData();

      Swal.fire("Tersimpan!", "Transaksi berhasil dicatat ke keuangan rumah.", "success");
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Hapus Transaksi
  const handleDelete = async (id, keterangan, nominal) => {
    const confirm = await Swal.fire({
      title: "Hapus Transaksi Ini?",
      text: `${keterangan} - ${rupiahFormat(nominal)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/keuangan-rumah/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menghapus");

      await fetchData();
      Swal.fire("Terhapus", "Transaksi telah dihapus.", "success");
    } catch (err) {
      Swal.fire("Gagal", err.message, "error");
    }
  };

  // Filter List
  const filteredList = useMemo(() => {
    if (filterJenis === "semua") return transaksiList;
    return transaksiList.filter((t) => t.jenis === filterJenis);
  }, [transaksiList, filterJenis]);

  const isInsideAdmin =
    typeof window !== "undefined" && window.location.hash.includes("/admin");

  // ==========================================
  // RENDER: TAMPILAN TERKUNCI (PIN SCREEN)
  // ==========================================
  if (!isUnlocked) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        {!isInsideAdmin && (
          <div className="mb-4">
            <a
              href="#/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition"
            >
              <span>←</span> Kembali ke Jimpitan Warga
            </a>
          </div>
        )}
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-line text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-3xl text-white shadow-lg shadow-slate-900/20">
            🔐
          </div>
          <h1 className="mt-5 text-xl font-bold text-ink">
            Keuangan Rumah Tangga
          </h1>
          <p className="mt-1.5 text-xs text-muted leading-relaxed">
            Halaman ini khusus untuk pencatatan keuangan pribadi keluarga <b>Pak Roni &amp; Ibu</b>. Terpisah dari kas warga jimpitan.
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-left">
                Masukkan PIN Keamanan:
              </label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                placeholder="••••"
                className="w-full rounded-xl border border-line bg-slate-50 p-3.5 text-center text-xl font-bold tracking-[0.5em] text-ink focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              {pinError && (
                <p className="mt-1.5 text-xs text-red-500 font-medium">
                  {pinError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={verifyingPin}
              className="w-full !py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              {verifyingPin ? (
                <>
                  <Spinner size="sm" /> Memverifikasi PIN...
                </>
              ) : (
                "Buka Catatan Keuangan 🔓"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-line text-[11px] text-muted">
            Lupa PIN? Gunakan 4 digit akhir nomor HP Pak Roni / Ibu.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: TAMPILAN DASHBOARD KEUANGAN RUMAH
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12">
      {!isInsideAdmin && (
        <div className="flex items-center justify-between pb-1">
          <a
            href={
              typeof window !== "undefined" &&
              !window.location.hostname.includes("jimpitan-gbk") &&
              window.location.hostname !== "localhost" &&
              window.location.hostname !== "127.0.0.1"
                ? "https://jimpitan-gbk.roniadiatmoko.my.id"
                : "#/"
            }
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition"
          >
            <span>←</span> Kembali ke Jimpitan Warga
          </a>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            🛡️ Akses Pribadi
          </span>
        </div>
      )}
      {/* HEADER CARD */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm">
                🏠
              </span>
              <h1 className="text-xl font-bold text-ink">
                Keuangan Rumah Tangga
              </h1>
            </div>
            <p className="mt-1 text-xs text-muted">
              Pencatatan belanja &amp; analisis keuangan keluarga (Otomatis tersinkron via WhatsApp AI Nara).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Bulan & Tahun */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <Button
              className="text-xs !py-2 !px-3 font-semibold flex items-center gap-1.5"
              onClick={() => {
                setFormTanggal(getTodayLocalDateStr());
                setShowModalAdd(true);
              }}
            >
              <span>➕</span> Catat Transaksi
            </Button>

            <Button
              variant="secondary"
              className="text-xs !py-2 !px-2.5 text-slate-600 hover:text-red-600"
              onClick={handleLock}
              title="Kunci Layar"
            >
              🔒 Kunci
            </Button>
          </div>
        </div>
      </Card>

      {/* 4 SUMMARY METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengeluaran */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700">
            <span>Total Pengeluaran</span>
            <span>📉</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-rose-900 font-mono">
            {rupiahFormat(rekap?.totalPengeluaran || 0)}
          </p>
          <p className="mt-1 text-[11px] text-rose-600 font-medium">
            {rekap?.totalTransaksi || 0} transaksi tercatat bulan ini
          </p>
        </div>

        {/* Total Pemasukan */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Total Pemasukan</span>
            <span>📈</span>
          </div>
          <p className="mt-2 text-xl font-extrabold text-emerald-900 font-mono">
            {rupiahFormat(rekap?.totalPemasukan || 0)}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            Gaji / usaha / transfer masuk
          </p>
        </div>

        {/* Sisa Saldo / Surplus-Defisit */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Arus Bersih (Saldo)</span>
            <span>💼</span>
          </div>
          <p className={`mt-2 text-xl font-extrabold font-mono ${(rekap?.sisaSaldo || 0) >= 0 ? "text-sky-900" : "text-rose-800"}`}>
            {(rekap?.sisaSaldo || 0) >= 0 ? "+" : ""}{rupiahFormat(rekap?.sisaSaldo || 0)}
          </p>
          <p className="mt-1 text-[11px] text-sky-600 font-medium">
            {(rekap?.sisaSaldo || 0) >= 0 ? "Surplus Keuangan" : "Defisit (Pengeluaran > Pemasukan)"}
          </p>
        </div>

        {/* Kategori Pengeluaran Terbesar */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
            <span>Pengeluaran Terbesar</span>
            <span>🏆</span>
          </div>
          <p className="mt-2 text-base font-bold text-amber-950 truncate">
            {rekap?.topKategori?.kategori || "-"}
          </p>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            {rekap?.topKategori
              ? `${rupiahFormat(rekap.topKategori.total)} (${rekap.topKategori.persentase}% total belanja)`
              : "Belum ada transaksi pengeluaran"}
          </p>
        </div>
      </div>

      {/* DUA KOLOM: BREAKDOWN KATEGORI & TOP 5 PENGELUARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kolom Kiri: Breakdown per Kategori */}
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>📊</span> Pengeluaran per Kategori
            </h3>
            <span className="text-[11px] text-muted">
              Bulan {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </div>

          {rekap?.breakdownKategori?.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted italic">
              Belum ada transaksi pengeluaran di periode ini.
            </p>
          ) : (
            <div className="space-y-3">
              {rekap?.breakdownKategori?.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-ink">{item.kategori}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {rupiahFormat(item.total)} ({item.persentase}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0
                          ? "bg-rose-500"
                          : idx === 1
                          ? "bg-amber-500"
                          : idx === 2
                          ? "bg-sky-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${Math.min(item.persentase, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Kolom Kanan: Top Pengeluaran Satuan Terbesar */}
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>🔥</span> Pengeluaran Terbesar Bulan Ini
            </h3>
            <span className="text-[11px] text-muted">Top 5 Transaksi</span>
          </div>

          {rekap?.topPengeluaran?.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted italic">
              Belum ada data pengeluaran terbesar.
            </p>
          ) : (
            <div className="space-y-2.5">
              {rekap?.topPengeluaran?.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-surface/50 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-ink">{item.keterangan}</p>
                      <p className="text-[10px] text-muted">
                        {formatTanggalIndo(item.tanggal)} • {item.kategori} • Dicatat: {item.dicatat_oleh}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-700 whitespace-nowrap">
                    {rupiahFormat(item.nominal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* TABEL RINCIAN TRANSAKSI */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <span>📋</span> Daftar Transaksi Lengkap
            </h3>
            <p className="text-xs text-muted">
              Menampilkan {filteredList.length} transaksi pada bulan {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterJenis("semua")}
              className={`px-2.5 py-1 rounded-md transition ${filterJenis === "semua" ? "bg-white text-ink font-bold shadow-sm" : "text-muted"}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterJenis("pengeluaran")}
              className={`px-2.5 py-1 rounded-md transition ${filterJenis === "pengeluaran" ? "bg-white text-rose-700 font-bold shadow-sm" : "text-muted"}`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => setFilterJenis("pemasukan")}
              className={`px-2.5 py-1 rounded-md transition ${filterJenis === "pemasukan" ? "bg-white text-emerald-700 font-bold shadow-sm" : "text-muted"}`}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted">
            <p className="text-2xl mb-2">💬</p>
            <p className="font-medium text-ink">Belum ada transaksi yang dicatat.</p>
            <p className="mt-1">
              Bapak / Ibu bisa mencatat belanja langsung lewat WhatsApp Nara, atau klik tombol <b>"+ Catat Transaksi"</b> di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-line text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Nominal</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3 text-center">Dicatat</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredList.map((row) => {
                  const isPengeluaran = row.jenis === "pengeluaran";
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {formatTanggalIndo(row.tanggal)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink">
                        {row.keterangan}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {row.kategori}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap ${isPengeluaran ? "text-rose-700" : "text-emerald-700"}`}>
                        {isPengeluaran ? "-" : "+"} {rupiahFormat(row.nominal)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {row.sumber_dana || "Cash"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.dicatat_oleh === "Ibu" || row.dicatat_oleh === "Ibu Kartini"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {row.dicatat_oleh || "Pak Roni"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(row.id, row.keterangan, row.nominal)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Hapus Transaksi"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL INPUT TRANSAKSI MANUAL */}
      {showModalAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 border border-line">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <span>➕</span> Catat Transaksi Keuangan Rumah
              </h2>
              <button
                onClick={() => setShowModalAdd(false)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTransaksi} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full rounded-lg border border-line p-2 text-ink"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jenis
                  </label>
                  <select
                    value={formJenis}
                    onChange={(e) => {
                      const next = e.target.value;
                      setFormJenis(next);
                      setFormKategori(
                        next === "pengeluaran"
                          ? KATEGORI_PENGELUARAN[0]
                          : KATEGORI_PEMASUKAN[0]
                      );
                    }}
                    className="w-full rounded-lg border border-line p-2 text-ink font-semibold"
                  >
                    <option value="pengeluaran">Pengeluaran 📉</option>
                    <option value="pemasukan">Pemasukan 📈</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full rounded-lg border border-line p-2 text-ink"
                >
                  {(formJenis === "pengeluaran"
                    ? KATEGORI_PENGELUARAN
                    : KATEGORI_PEMASUKAN
                  ).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nominal (Rp)
                </label>
                <CurrencyInput
                  placeholder="Contoh: 50.000"
                  value={formNominal}
                  onValueChange={(val) => setFormNominal(val || "")}
                  prefix="Rp "
                  groupSeparator="."
                  decimalSeparator=","
                  className="w-full rounded-lg border border-line p-2.5 font-mono text-base font-bold text-ink focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Uraian / Keterangan Belanja
                </label>
                <input
                  type="text"
                  placeholder="Misal: Beli token listrik PLN, Beras 5kg, dll."
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full rounded-lg border border-line p-2 text-ink"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sumber Dana
                  </label>
                  <select
                    value={formSumberDana}
                    onChange={(e) => setFormSumberDana(e.target.value)}
                    className="w-full rounded-lg border border-line p-2 text-ink"
                  >
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="Gopay">Gopay</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="DANA">DANA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Dicatat Oleh
                  </label>
                  <select
                    value={formDicatatOleh}
                    onChange={(e) => setFormDicatatOleh(e.target.value)}
                    className="w-full rounded-lg border border-line p-2 text-ink font-semibold"
                  >
                    <option value="Pak Roni">Pak Roni</option>
                    <option value="Ibu Kartini">Ibu Kartini</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModalAdd(false)}
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Menyimpan..." : "Simpan Transaksi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
