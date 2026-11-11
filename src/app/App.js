import { useState, useEffect, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Swal from "sweetalert2";
import { Routes, Route } from "react-router-dom";

// Mengimpor komponen RapelForm dari file terpisah
import { ENDPOINT_BASE_URL, homeList, API_SECRET_KEY } from "../shared/config.js";
import { rupiahFormat } from "../shared/helpers/MoneyHeper.js";
import AdminArea from "../features/admin/AdminArea.js";
import DetailHarian from "../features/admin/harian/DetailHarian.js";
import AdminHome from "../features/admin/AdminHome.js";
import LaporanBulanan from "../features/admin/laporan/LaporanBulanan.js";
import ServerCheckModal from "../shared/components/ModalServerCheck.js";
import LoginForm from "../features/auth/LoginForm.js";
import RapelForm from "../features/admin/rapel/RapelForm.js";
import RapelList from "../features/admin/rapel/RapelList.js";
import Pengeluaran from "../features/admin/pengeluaran/Pengeluaran.js";
import KekuranganBayar from "../features/admin/laporan/kekurangan-bayar/KekuranganBayar.js";
import KekuranganBayarTahun from "../features/admin/laporan/kekurangan-bayar/KekuranganBayarTahun.js";
import ListWarga from "../features/admin/warga/ListWarga.js";
import RefWarga from "../features/admin/warga/RefWarga.js";
import StatusWhatsApp from "../features/admin/whatsapp/StatusWhatsApp.js";
import SinkronCloud from "../features/admin/cloud-sync/SinkronCloud.js";
import UpdateAplikasi from "../features/admin/system/UpdateAplikasi.js";
import KeuanganRumah from "../features/keuangan-rumah/KeuanganRumah.js";
import TanggalPutih from "../features/admin/pemutihan/TanggalPutih.js";
import RekapList from "../features/admin/rekap/RekapList.js";
import PresensiRonda from "../features/presensi-ronda/PresensiRonda.js";
import JadwalRonda from "../features/admin/jadwal-ronda/JadwalRonda.js";


const isKeuanganSubdomain = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.includes("jimpitan-gbk")) {
    return false;
  }
  const parts = host.split(".");
  const subdomain = parts.length > 2 ? parts[0] : host;
  return (
    subdomain.includes("keuangan") ||
    subdomain.includes("rumah") ||
    subdomain.includes("keluarga") ||
    subdomain.includes("family")
  );
};

const getPageFromPath = (path, pathname = typeof window !== "undefined" ? window.location.pathname : "") => {
  if (isKeuanganSubdomain()) {
    return "keuangan-rumah";
  }

  const combined = `${path || ""} ${pathname || ""}`;

  if (combined.includes("keuangan-rumah")) {
    return "keuangan-rumah";
  }

  if (combined.includes("#/rapel-list") || combined.includes("/rapel-list")) {
    return "rapel-list";
  }

  if (combined.includes("#/rapel") || combined.includes("/rapel")) {
    return "rapel-form";
  }

  if (combined.includes("#/admin") || combined.includes("/admin")) {
    return "admin";
  }

  return "harian";
};

const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
  <button
    type="button"
    onClick={onClick}
    ref={ref}
    className="w-full flex items-center justify-between p-3 sm:p-3.5 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/70 border border-slate-200 rounded-xl text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs group cursor-pointer"
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center text-xl border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
        🗓️
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Tanggal Ronda Terpilih
        </span>
        <span className="block text-sm sm:text-base font-bold text-slate-800 truncate">
          {value || "-"}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200/80 shrink-0 transition">
      <span>Ubah</span>
      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>
));

export default function App() {
  const [currentPage, setCurrentPage] = useState(
    getPageFromPath(window.location.hash)
  );
  const [tanggal, setTanggal] = useState(new Date());
  const [terisi, setTerisi] = useState({});
  const [uangDiambil, setUangDiambil] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [personilRondaTercentang, setPersonilRondaTercentang] = useState([]);

  // State baru untuk menyimpan status rapel harian
  const [rapelHarianStatus, setRapelHarianStatus] = useState([]);

  const [endPoint, setEndPoint] = useState(ENDPOINT_BASE_URL);
  const [rumahList, setRumahList] = useState(homeList);

  useEffect(() => {
    const fetchRefWarga = async () => {
      try {
        const response = await fetch(`${endPoint}/api/ref-warga`);
        if (response.ok) {
          const result = await response.json();
          if (
            result.status === "OK" &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            const sorted = [...result.data].sort(
              (a, b) => Number(a.nomor) - Number(b.nomor)
            );
            setRumahList(sorted);
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil data ref-warga dinamis, menggunakan fallback statis:", err);
      }
    };
    fetchRefWarga();
  }, [endPoint]);
  const [saldoData, setSaldoData] = useState(null);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  const fetchSaldoTerkini = async () => {
    setLoadingSaldo(true);
    try {
      const res = await fetch(`${endPoint}/api/saldo-terkini`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSaldoData(json.data);
          return;
        }
      }
      // Fallback untuk backend lawas
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const fallbackRes = await fetch(`${endPoint}/api/rekap/${currentYear}/${currentMonth}`);
      if (fallbackRes.ok) {
        const fallbackJson = await fallbackRes.json();
        setSaldoData({
          sisa_saldo: fallbackJson.data?.sisa_saldo || 0,
          tanggal_terakhir_diupdate: null,
          bulan: `${currentYear}-${currentMonth}`,
        });
      }
    } catch (err) {
      console.error("Gagal mengambil saldo terkini:", err);
    } finally {
      setLoadingSaldo(false);
    }
  };

  useEffect(() => {
    fetchSaldoTerkini();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endPoint]);

  const formatTanggalTerakhir = (tglStr) => {
    if (!tglStr) return "-";
    try {
      const cleanDate = tglStr.length >= 10 ? tglStr.substring(0, 10) : tglStr;
      const [y, m, d] = cleanDate.split("-");
      if (y && m && d) {
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        return format(dateObj, "EEEE, d MMMM yyyy", { locale: id });
      }
      return tglStr;
    } catch {
      return tglStr;
    }
  };


  useEffect(() => {
    // Jika dibuka lewat subdomain khusus keuangan/rumah tangga
    if (isKeuanganSubdomain()) {
      if (!window.location.hash.includes("keuangan-rumah")) {
        window.location.replace("#/keuangan-rumah");
      }
      setCurrentPage("keuangan-rumah");
    }

    // Redirect otomatis jika pengguna mengakses /keuangan-rumah tanpa tanda pagar hash
    if (
      window.location.pathname.includes("keuangan-rumah") &&
      !window.location.hash.includes("keuangan-rumah")
    ) {
      window.location.replace("/#/keuangan-rumah");
    }

    const handleHashChange = () => {
      setCurrentPage(getPageFromPath(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  // Efek untuk mengambil data rapel harian setiap kali tanggal berubah
  useEffect(() => {
    const fetchRapelHarianStatus = async () => {
      const tanggalFormatted = format(tanggal, "yyyy-MM-dd");
      try {
        const response = await fetch(
          `${endPoint}/api/rapel-harian/${tanggalFormatted}`
        );
        if (response.ok) {
          const data = await response.json();
          // rapelHarianStatus sekarang berupa array nomor_rumah
          // console.log("Status rapel harian:", data.rapelHouses);
          setRapelHarianStatus(data.rapelHouses);
        } else {
          console.error("Gagal mengambil status rapel harian");
          setRapelHarianStatus([]);
        }
      } catch (error) {
        console.error("Error fetching rapel status:", error);
        setRapelHarianStatus([]);
      }
    };
    fetchRapelHarianStatus();
  }, [tanggal, endPoint]);

  const toggleRumah = (nomor) => {
    // MEMO: Logika ini mencegah rumah yang sudah rapel untuk di-centang.
    // Jika nomor rumah ada di daftar rapel, maka fungsi akan berhenti.
    if (rapelHarianStatus.includes(String(nomor))) {
      return;
    }
    setTerisi((prev) => ({ ...prev, [nomor]: !prev[nomor] }));
  };

  const totalSetor = Object.keys(terisi).filter(
    (nomor) => terisi[nomor]
  ).length;
  const totalUang = totalSetor * 500;
  const isSesuai = parseInt(uangDiambil) === totalUang;

  const simpan = async () => {
    if (!isSesuai) {
      Swal.fire("Perhatian", "Jumlah uang diambil tidak sesuai.", "warning");
      return;
    }

    // Perbaikan: Pastikan ada data yang dicentang sebelum mencoba menyimpan
    const terisiRumah = Object.keys(terisi).filter((nomor) => terisi[nomor]);
    if (terisiRumah.length === 0) {
      Swal.fire("Kosong", "Belum ada rumah yang dicentang.", "info");
      return;
    }

    const dataJimpitan = rumahList.map((r) => ({
      nomor: String(r.nomor),
      nama: r.nama,
      // MEMO: Status disimpan berdasarkan state 'terisi'.
      // Karena rumah yang sudah rapel tidak bisa di-centang (berkat logika di toggleRumah),
      // maka statusnya akan otomatis 0 (nol) saat disimpan, sesuai permintaan.
      status: terisi[r.nomor] ? 1 : 0,
    }));

    const personilPayload = (personilRondaTercentang || []).map((p) => ({
      nomor_rumah: String(p.nomor_rumah),
      nama_penghuni: p.nama_penghuni || "",
    }));

    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(`${endPoint}/api/jimpitan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret_key: API_SECRET_KEY,
          tanggal: format(tanggal, "yyyy-MM-dd"),
          diambil_oleh: "Petugas Ronda",
          data: dataJimpitan,
          personil_ronda: personilPayload,
        }),
      });

      if (response.ok) {
        Swal.fire("Berhasil!", "Data jimpitan dan presensi ronda sudah disimpan.", "success");
        setTerisi({});
        setUangDiambil("");
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", "Tidak bisa mengirim data. Periksa koneksi.", "error");
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${currentPage === "harian" ? "pb-96" : "pb-12"}`}>
      <Routes>
        <Route path="/keuangan-rumah" element={<KeuanganRumah />} />
        {/* ADMIN PAGE */}
        <Route path="/admin" element={<AdminArea />}>
          <Route path="login" element={<LoginForm />} />

          <Route>
            <Route index element={<AdminHome />} /> {/*default /admin */}
            <Route path="rapel-list" element={<RapelList />} />
            <Route path="rapel-input" element={<RapelForm />} />
            <Route path="detail-harian" element={<DetailHarian />} />
            <Route path="laporan-bulanan" element={<LaporanBulanan />} />
            <Route path="daftar-rekap" element={<RekapList />} />
            <Route path="pengeluaran" element={<Pengeluaran />} />
            <Route path="kekurangan-bayar" element={<KekuranganBayar />} />
            <Route path="kekurangan-bayar-tahun" element={<KekuranganBayarTahun />} />
            <Route path="tanggal-putih" element={<TanggalPutih />} />
            <Route path="jadwal-ronda" element={<JadwalRonda />} />
            <Route path="list-warga" element={<ListWarga />} />
            <Route path="ref-warga" element={<RefWarga />} />
            <Route path="status-whatsapp" element={<StatusWhatsApp />} />
            <Route path="sinkron-cloud" element={<SinkronCloud />} />
            <Route path="update-aplikasi" element={<UpdateAplikasi />} />
            <Route path="keuangan-rumah" element={<KeuanganRumah />} />
          </Route>
        </Route>
      </Routes>

      <ServerCheckModal onBackendReady={setEndPoint} />
      {currentPage === "harian" && (
        // Tampilan untuk input harian
        <div className="max-w-xl mx-auto px-3 sm:px-4 pt-3 pb-80">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-900/15 mb-4 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium text-emerald-100">
                  <span>🌙</span> Petugas Ronda Malam
                </div>
                <button
                  type="button"
                  onClick={fetchSaldoTerkini}
                  title="Muat ulang informasi saldo terkini"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100 hover:text-white bg-white/15 hover:bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-full transition active:scale-95 border border-white/20 cursor-pointer"
                >
                  <svg
                    className={`w-3 h-3 ${loadingSaldo ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>{loadingSaldo ? "Memuat..." : "Refresh"}</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Nge-Jimpit GBK Tempel 2
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 mb-4">
                Pencatatan jimpitan harian warga secara transparan dan tertib
              </p>

              {/* Saldo Terkini Glassmorphism Card */}
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 text-left shadow-lg">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <span>💰</span> Sisa Saldo Kas Terkini
                  </span>
                  <span className="bg-emerald-400/25 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300/30">
                    Kas Jimpitan
                  </span>
                </div>

                <div className="mt-2 flex items-baseline">
                  {loadingSaldo ? (
                    <div className="h-8 w-44 bg-white/20 rounded animate-pulse my-1"></div>
                  ) : (
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {rupiahFormat(saldoData?.sisa_saldo ?? 0)}
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-1 text-[11px] text-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-300">📅</span>
                    <span>
                      Terakhir diupdate:{" "}
                      <strong className="text-white font-semibold">
                        {saldoData?.tanggal_terakhir_diupdate
                          ? formatTanggalTerakhir(saldoData.tanggal_terakhir_diupdate)
                          : "-"}
                      </strong>
                    </span>
                  </div>
                  {saldoData?.bulan && (
                    <span className="text-emerald-200/80 text-[10px]">
                      Periode {format(new Date(saldoData.bulan + "-01"), "MMMM yyyy", { locale: id })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tanggal Ronda Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5 mb-4">
            <DatePicker
              selected={tanggal}
              onChange={(date) => setTanggal(date)}
              dateFormat="EEEE, d MMMM yyyy"
              locale={id}
              wrapperClassName="w-full block"
              customInput={<CustomDateInput />}
            />

            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-amber-700 font-medium bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200/60 text-center">
              <span>⚠️</span> Pastikan tanggal ronda sudah benar sebelum menyimpan!
            </div>

            {/* Info Jam Server */}
            <div className="mt-2.5 bg-rose-50 border border-rose-200/70 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2.5">
              <span className="text-base leading-none">⏰</span>
              <div className="leading-relaxed">
                <strong className="font-semibold text-rose-950">Perhatian:</strong> Server otomatis ditutup pukul <b>23:59 WIB</b> untuk mencegah salah input tanggal. Hubungi grup WA jika butuh bantuan.
              </div>
            </div>
          </div>

          {/* Komponen Presensi Ronda */}
          <div className="mb-4">
            <PresensiRonda
              tanggal={tanggal}
              onChangePersonil={setPersonilRondaTercentang}
            />
          </div>

          {/* Jimpitan Checklist Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Daftar Jimpitan Rumah
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang kotak bila warga telah mengisi jimpitan
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {totalSetor} Tercentang
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200/60">
                    <th className="py-3 px-3 text-center w-16">No</th>
                    <th className="py-3 px-3">Penghuni Rumah</th>
                    <th className="py-3 px-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rumahList.map((r, index) => {
                    const isRapel = rapelHarianStatus.includes(String(r.nomor));
                    const isChecked = !!terisi[r.nomor];
                    const isStriped = index % 2 !== 0;

                    return (
                      <tr
                        key={r.nomor}
                        className={`transition-colors border-b border-slate-200/60 ${
                          isChecked
                            ? "bg-emerald-100/90 font-medium border-l-4 border-l-emerald-600"
                            : isRapel
                            ? isStriped
                              ? "bg-slate-100/80 text-slate-400"
                              : "bg-slate-50/60 text-slate-400"
                            : isStriped
                            ? "bg-slate-100/80 hover:bg-slate-200/60"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs ${
                              isChecked
                                ? "bg-emerald-700 text-white shadow-sm"
                                : isRapel
                                ? "bg-slate-200 text-slate-500"
                                : isStriped
                                ? "bg-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r.nomor}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm">
                              {r.nama}
                            </span>
                            {r.sudah_menghuni === 1 && (
                              <span
                                title="Rumah sudah dihuni (wajib jimpitan)"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700"
                              >
                                Wajib
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isRapel ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ✓ Rapel
                            </span>
                          ) : (
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  const result = await Swal.fire({
                                    title: checked
                                      ? "Tandai Jimpitan?"
                                      : "Hapus Jimpitan?",
                                    html: checked
                                      ? `Apakah Anda yakin menandai <b>Rumah ${r.nomor} (${r.nama})</b> mengisi jimpitan?`
                                      : `Apakah Anda yakin menghapus tanda jimpitan <b>Rumah ${r.nomor} (${r.nama})</b>?`,
                                    icon: "question",
                                    showCancelButton: true,
                                    confirmButtonText: "Ya, lanjutkan",
                                    cancelButtonText: "Batal",
                                    confirmButtonColor: "#059669",
                                    cancelButtonColor: "#64748b",
                                  });
                                  if (result.isConfirmed) {
                                    toggleRumah(r.nomor);
                                  }
                                }}
                                className="w-6 h-6 rounded-lg text-emerald-600 border-slate-300 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer transition"
                              />
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Keterangan */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                Wajib
              </span>
              <span>= Rumah sudah berpenghuni tetap dan wajib mengisi jimpitan.</span>
            </div>
          </div>

          {/* Sticky Floating Action Bar di Bawah */}
          <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
            <div className="max-w-xl mx-auto px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-auto">
              <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800">
                {/* Ringkasan Setoran */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Total Checklist
                    </span>
                    <div className="text-xs text-slate-300">
                      {totalSetor} rumah × Rp 500
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      Rp {totalUang.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Input Hitungan Uang Fisik */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Uang Fisik yang Diambil:
                    </label>
                    {uangDiambil !== "" && (
                      <span
                        className={`text-[11px] font-semibold ${
                          isSesuai ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isSesuai
                          ? "✅ Nominal Pas"
                          : `⚠️ Selisih: Rp ${Math.abs(
                              parseInt(uangDiambil || 0) - totalUang
                            ).toLocaleString("id-ID")}`}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={uangDiambil}
                      onChange={(e) => setUangDiambil(e.target.value)}
                      onFocus={() => setKeyboardOpen(true)}
                      onBlur={() => setKeyboardOpen(false)}
                      className={`w-full pl-11 pr-4 py-2.5 bg-slate-800 text-white font-mono text-base font-bold rounded-xl border focus:outline-none focus:ring-2 transition ${
                        uangDiambil === ""
                          ? "border-slate-700 focus:ring-emerald-500"
                          : isSesuai
                          ? "border-emerald-500 focus:ring-emerald-500 bg-emerald-950/20 text-emerald-300"
                          : "border-rose-500 focus:ring-rose-500 bg-rose-950/20 text-rose-300"
                      }`}
                      placeholder="Masukkan total uang fisik"
                    />
                  </div>

                  {keyboardOpen && (
                    <div className="mt-2 p-2 rounded-lg bg-slate-800/90 text-[11px] text-amber-300 border border-amber-500/30">
                      * Masukkan angka saja tanpa titik atau koma. Jika uang tidak sesuai checklist, petugas ronda melengkapi kekurangannya.
                    </div>
                  )}
                </div>

                {/* Tombol Simpan */}
                <button
                  onClick={simpan}
                  disabled={!isSesuai || totalSetor === 0}
                  className={`w-full mt-3.5 py-3 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99] ${
                    isSesuai && totalSetor > 0
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/25 cursor-pointer"
                      : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  }`}
                >
                  <span>{isSesuai && totalSetor > 0 ? "💾" : "🔒"}</span>
                  {isSesuai && totalSetor > 0
                    ? "Simpan Jimpitan"
                    : totalSetor === 0
                    ? "Centang Rumah Terlebih Dahulu"
                    : "Jumlah Uang Belum Sesuai"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
