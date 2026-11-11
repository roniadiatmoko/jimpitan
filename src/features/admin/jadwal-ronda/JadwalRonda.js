import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL, homeList } from "../../../shared/config";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Spinner from "../../../shared/components/ui/Spinner";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function JadwalRonda() {
  const [activeHari, setActiveHari] = useState("Senin");
  const [jadwalList, setJadwalList] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal Tambah State
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [selectedHomes, setSelectedHomes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchWarga, setSearchWarga] = useState("");

  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ronda/jadwal`);
      const json = await res.json();
      if (res.ok && json.success) {
        setJadwalList(json.data || []);
      }
    } catch (err) {
      console.error("Gagal load jadwal ronda:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarga = async () => {
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga`);
      const json = await res.json();
      if (res.ok && json.data) {
        setWargaList(json.data);
      } else {
        setWargaList(homeList);
      }
    } catch {
      setWargaList(homeList);
    }
  };

  useEffect(() => {
    fetchJadwal();
    fetchWarga();
  }, []);

  // Filter jadwal hari aktif
  const personilHariAktif = useMemo(() => {
    return jadwalList.filter((j) => j.hari === activeHari);
  }, [jadwalList, activeHari]);

  // Hitung jumlah per hari untuk badge di tab
  const countPerHari = useMemo(() => {
    const counts = {};
    HARI_LIST.forEach((h) => (counts[h] = 0));
    jadwalList.forEach((j) => {
      if (counts[j.hari] !== undefined) counts[j.hari]++;
    });
    return counts;
  }, [jadwalList]);

  // Daftar nomor rumah yang SUDAH masuk jadwal hari aktif
  const existingNomorInActiveHari = useMemo(() => {
    return new Set(personilHariAktif.map((p) => String(p.nomor_rumah)));
  }, [personilHariAktif]);

  // Daftar warga yang tersedia untuk ditambahkan (bisa dicari)
  const availableWarga = useMemo(() => {
    return wargaList.filter((w) => {
      const namaMatch = (w.nama || "").toLowerCase().includes(searchWarga.toLowerCase());
      const noMatch = String(w.nomor).includes(searchWarga);
      return (namaMatch || noMatch) && !existingNomorInActiveHari.has(String(w.nomor));
    });
  }, [wargaList, searchWarga, existingNomorInActiveHari]);

  const toggleSelectHome = (nomor) => {
    setSelectedHomes((prev) =>
      prev.includes(nomor) ? prev.filter((n) => n !== nomor) : [...prev, nomor]
    );
  };

  const handleSimpanJadwal = async () => {
    if (selectedHomes.length === 0) {
      Swal.fire("Perhatian", "Pilih minimal 1 warga untuk ditambahkan.", "warning");
      return;
    }

    setSaving(true);
    try {
      for (const nomor of selectedHomes) {
        const item = wargaList.find((w) => String(w.nomor) === String(nomor));
        await fetch(`${ENDPOINT_BASE_URL}/api/ronda/jadwal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hari: activeHari,
            nomor_rumah: String(nomor),
            nama_penghuni: item?.nama || `Rumah ${nomor}`,
          }),
        });
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `${selectedHomes.length} warga ditambahkan ke jadwal ${activeHari}.`,
        timer: 1500,
        showConfirmButton: false,
      });

      setSelectedHomes([]);
      setShowModalAdd(false);
      setSearchWarga("");
      fetchJadwal();
    } catch (err) {
      console.error("Gagal simpan jadwal:", err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan jadwal.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleHapusPersonil = async (id, nama, nomorRumah) => {
    const konfirm = await Swal.fire({
      title: "Hapus Petugas?",
      text: `Hapus No. ${nomorRumah} (${nama}) dari jadwal ronda ${activeHari}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!konfirm.isConfirmed) return;

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ronda/jadwal/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Terhapus",
          timer: 1200,
          showConfirmButton: false,
        });
        fetchJadwal();
      } else {
        throw new Error("Gagal menghapus");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menghapus dari jadwal.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Jadwal Petugas Ronda
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atur regu ronda mingguan. Personil jadwal ini akan otomatis tercentang di formulir jimpitan.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedHomes([]);
            setSearchWarga("");
            setShowModalAdd(true);
          }}
          className="flex items-center gap-2 self-start sm:self-auto bg-emerald-600 hover:bg-emerald-700"
        >
          <span>➕</span>
          <span>Tambah Petugas {activeHari}</span>
        </Button>
      </div>

      {/* Tab Hari (Senin - Minggu) */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200">
        {HARI_LIST.map((hari) => {
          const isActive = hari === activeHari;
          const count = countPerHari[hari] || 0;
          return (
            <button
              key={hari}
              onClick={() => setActiveHari(hari)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <span>{hari}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabel Personil Hari Terpilih */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Regu Ronda Hari {activeHari}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {personilHariAktif.length} personil terdaftar untuk giliran ronda malam {activeHari}.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : personilHariAktif.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-semibold text-slate-600">
              Belum ada petugas ronda untuk hari {activeHari}.
            </p>
            <p className="text-xs mt-1">
              Klik tombol <b>"+ Tambah Petugas {activeHari}"</b> di atas untuk memasukkan warga.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Rumah</th>
                  <th className="py-3 px-4">Nama Warga</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personilHariAktif.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        No. {item.nomor_rumah}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.nama_penghuni || "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() =>
                          handleHapusPersonil(item.id, item.nama_penghuni, item.nomor_rumah)
                        }
                        title="Hapus dari jadwal"
                        className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah Petugas */}
      {showModalAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Tambah Petugas Ronda {activeHari}
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih warga yang akan dimasukkan ke regu piket {activeHari}.
                </p>
              </div>
              <button
                onClick={() => setShowModalAdd(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Pencarian Warga */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Cari nomor rumah atau nama warga..."
                value={searchWarga}
                onChange={(e) => setSearchWarga(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Checklist Warga */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-1.5 mb-4 max-h-64 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {availableWarga.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  Tidak ada warga yang dapat ditambahkan (semua sudah ada di jadwal atau tidak cocok pencarian).
                </p>
              ) : (
                availableWarga.map((w) => {
                  const isChecked = selectedHomes.includes(w.nomor);
                  return (
                    <label
                      key={w.nomor}
                      onClick={() => toggleSelectHome(w.nomor)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition text-xs sm:text-sm ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // dikontrol oleh label onClick
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
                        />
                        <span>
                          <strong className="text-slate-800">No. {w.nomor}</strong> - {w.nama}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500 font-medium">
                {selectedHomes.length} warga dipilih
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowModalAdd(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSimpanJadwal}
                  disabled={saving || selectedHomes.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? "Menyimpan..." : "Tambahkan"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
