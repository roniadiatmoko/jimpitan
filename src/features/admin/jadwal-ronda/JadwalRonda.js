import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL, homeList } from "../../../shared/config";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Spinner from "../../../shared/components/ui/Spinner";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function JadwalRonda() {
  const [activeTab, setActiveTab] = useState("Semua"); // "Semua" atau salah satu hari
  const [jadwalList, setJadwalList] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal Tambah State
  const [showModalAdd, setShowModalAdd] = useState(false);
  const [selectedHomes, setSelectedHomes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchWarga, setSearchWarga] = useState("");
  const [targetHariAdd, setTargetHariAdd] = useState("Senin");

  // Filter pencarian tabel
  const [filterQuery, setFilterQuery] = useState("");

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

  // Hitung jumlah personil per hari
  const countPerHari = useMemo(() => {
    const counts = {};
    HARI_LIST.forEach((h) => (counts[h] = 0));
    jadwalList.forEach((j) => {
      if (counts[j.hari] !== undefined) counts[j.hari]++;
    });
    return counts;
  }, [jadwalList]);

  // Data per hari terkelompok
  const jadwalGrouped = useMemo(() => {
    const grouped = {};
    HARI_LIST.forEach((h) => (grouped[h] = []));
    jadwalList.forEach((j) => {
      if (grouped[j.hari]) {
        grouped[j.hari].push(j);
      }
    });
    return grouped;
  }, [jadwalList]);

  // Personil yang tampil di tab saat ini (dengan filter pencarian)
  const displayedPersonil = useMemo(() => {
    let list = activeTab === "Semua" ? jadwalList : (jadwalGrouped[activeTab] || []);
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.nomor_rumah).includes(q) ||
          (p.nama_penghuni || "").toLowerCase().includes(q) ||
          p.hari.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, jadwalList, jadwalGrouped, filterQuery]);

  // Nomor rumah yang sudah ada di hari target add
  const existingNomorInTarget = useMemo(() => {
    const targetGroup = jadwalGrouped[targetHariAdd] || [];
    return new Set(targetGroup.map((p) => String(p.nomor_rumah)));
  }, [jadwalGrouped, targetHariAdd]);

  // Warga yang tersedia untuk ditambahkan
  const availableWarga = useMemo(() => {
    return wargaList.filter((w) => {
      const namaMatch = (w.nama || "").toLowerCase().includes(searchWarga.toLowerCase());
      const noMatch = String(w.nomor).includes(searchWarga);
      return (namaMatch || noMatch) && !existingNomorInTarget.has(String(w.nomor));
    });
  }, [wargaList, searchWarga, existingNomorInTarget]);

  const toggleSelectHome = (nomor) => {
    const strNomor = String(nomor);
    setSelectedHomes((prev) =>
      prev.some((n) => String(n) === strNomor)
        ? prev.filter((n) => String(n) !== strNomor)
        : [...prev, strNomor]
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
            hari: targetHariAdd,
            nomor_rumah: String(nomor),
            nama_penghuni: item?.nama || `Rumah ${nomor}`,
          }),
        });
      }

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `${selectedHomes.length} warga ditambahkan ke jadwal ${targetHariAdd}.`,
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

  const handleHapusPersonil = async (id, nama, nomorRumah, hari) => {
    const konfirm = await Swal.fire({
      title: "Hapus Petugas?",
      text: `Hapus No. ${nomorRumah} (${nama}) dari jadwal hari ${hari}?`,
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

  // Pindah Hari Petugas
  const handlePindahHari = async (item) => {
    const options = {};
    HARI_LIST.filter((h) => h !== item.hari).forEach((h) => {
      options[h] = h;
    });

    const { value: hariTujuan } = await Swal.fire({
      title: "Pindahkan Hari Ronda",
      text: `Pindahkan No. ${item.nomor_rumah} (${item.nama_penghuni}) dari ${item.hari} ke hari:`,
      input: "select",
      inputOptions: options,
      inputPlaceholder: "Pilih hari tujuan...",
      showCancelButton: true,
      confirmButtonText: "Pindahkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#0284c7",
    });

    if (!hariTujuan) return;

    try {
      // Hapus dari hari lama
      await fetch(`${ENDPOINT_BASE_URL}/api/ronda/jadwal/${item.id}`, {
        method: "DELETE",
      });
      // Tambah ke hari baru
      await fetch(`${ENDPOINT_BASE_URL}/api/ronda/jadwal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hari: hariTujuan,
          nomor_rumah: String(item.nomor_rumah),
          nama_penghuni: item.nama_penghuni,
        }),
      });

      Swal.fire({
        icon: "success",
        title: "Berhasil Dipindahkan!",
        text: `No. ${item.nomor_rumah} sekarang bertugas di hari ${hariTujuan}.`,
        timer: 1500,
        showConfirmButton: false,
      });

      fetchJadwal();
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan saat memindahkan hari.", "error");
    }
  };

  // Salin Teks Format WhatsApp
  const handleSalinJadwalWA = () => {
    let text = `*JADWAL PUNGGAWA RONDA MALAM*\n`;
    text += `*Perumahan Griya Bhina Karya Tempel 2*\n`;
    text += `===============================\n\n`;

    HARI_LIST.forEach((hari) => {
      const list = jadwalGrouped[hari] || [];
      text += `*HARI ${hari.toUpperCase()}* (${list.length} Orang):\n`;
      if (list.length === 0) {
        text += `  _(Belum ada jadwal)_\n`;
      } else {
        list.forEach((p, idx) => {
          text += `  ${idx + 1}. No. ${p.nomor_rumah} - ${p.nama_penghuni}\n`;
        });
      }
      text += `\n`;
    });

    text += `===============================\n`;
    text += `_Mohon hadir tepat waktu demi keamanan lingkungan bersama. Terima kasih._ 🙏🌙`;

    navigator.clipboard.writeText(text);
    Swal.fire({
      icon: "success",
      title: "Jadwal Disalin!",
      text: "Teks jadwal ronda mingguan siap di-paste ke grup WhatsApp warga.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Jadwal Punggawa Ronda
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola regu piket punggawa ronda mingguan warga (Senin s.d. Minggu). Jadwal ini otomatis tampil dan tercentang saat input jimpitan.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <Button
            variant="secondary"
            onClick={handleSalinJadwalWA}
            className="flex items-center gap-1.5 text-xs sm:text-sm !py-2.5 !px-3.5 border border-slate-300"
          >
            <span>📋</span>
            <span>Salin Format WA</span>
          </Button>

          <Button
            onClick={() => {
              setTargetHariAdd(activeTab === "Semua" ? "Senin" : activeTab);
              setSelectedHomes([]);
              setSearchWarga("");
              setShowModalAdd(true);
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm !py-2.5 !px-3.5 bg-emerald-600 hover:bg-emerald-700"
          >
            <span>➕</span>
            <span>Tambah Punggawa</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigasi Hari */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("Semua")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === "Semua"
              ? "bg-slate-800 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>Semua Hari</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
              activeTab === "Semua" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {jadwalList.length}
          </span>
        </button>

        {HARI_LIST.map((hari) => {
          const isActive = hari === activeTab;
          const count = countPerHari[hari] || 0;
          return (
            <button
              key={hari}
              onClick={() => setActiveTab(hari)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{hari}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ringkasan Matriks 7 Hari jika Tab Semua */}
      {activeTab === "Semua" && !filterQuery && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {HARI_LIST.map((hari) => {
            const list = jadwalGrouped[hari] || [];
            return (
              <div
                key={hari}
                onClick={() => setActiveTab(hari)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition">
                    {hari}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {list.length} Warga
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto text-xs">
                  {list.length === 0 ? (
                    <p className="text-slate-400 italic py-2">Belum ada jadwal</p>
                  ) : (
                    list.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-slate-600 py-0.5">
                        <span className="font-mono font-bold text-emerald-700">No. {p.nomor_rumah}</span>
                        <span className="truncate ml-2 text-slate-800">{p.nama_penghuni}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabel Detail Jadwal */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              {activeTab === "Semua" ? "Daftar Seluruh Petugas Ronda" : `Regu Ronda Hari ${activeTab}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Total {displayedPersonil.length} personil terdaftar
              {activeTab !== "Semua" ? ` untuk malam ${activeTab}` : ""}.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari nomor, nama, atau hari..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Spinner />
          </div>
        ) : displayedPersonil.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada punggawa ronda yang ditemukan.
            </p>
            <p className="text-xs mt-1">
              Klik tombol <b>"+ Tambah Punggawa"</b> di atas untuk menambahkan warga ke regu ronda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  {activeTab === "Semua" && <th className="py-3 px-4">Hari</th>}
                  <th className="py-3 px-4">Rumah</th>
                  <th className="py-3 px-4">Nama Warga</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPersonil.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    {activeTab === "Semua" && (
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs bg-slate-100 text-slate-700">
                          {item.hari}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                        No. {item.nomor_rumah}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.nama_penghuni || "-"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handlePindahHari(item)}
                          title="Pindahkan ke hari lain"
                          className="text-slate-400 hover:text-sky-600 transition p-1.5 rounded-lg hover:bg-sky-50"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() =>
                            handleHapusPersonil(
                              item.id,
                              item.nama_penghuni,
                              item.nomor_rumah,
                              item.hari
                            )
                          }
                          title="Hapus dari jadwal"
                          className="text-slate-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50"
                        >
                          🗑️
                        </button>
                      </div>
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
                  Tambah Punggawa Ronda
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih hari giliran piket dan centang warga yang ditugaskan.
                </p>
              </div>
              <button
                onClick={() => setShowModalAdd(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Hari Target */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Hari Ronda:
              </label>
              <select
                value={targetHariAdd}
                onChange={(e) => {
                  setTargetHariAdd(e.target.value);
                  setSelectedHomes([]);
                }}
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {HARI_LIST.map((h) => (
                  <option key={h} value={h}>
                    Hari {h}
                  </option>
                ))}
              </select>
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

            {/* Tombol Pilih Cepat */}
            <div className="flex items-center justify-between text-xs px-1 mb-1.5 text-slate-500">
              <span>Warga Tersedia ({availableWarga.length}):</span>
              {availableWarga.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedHomes(availableWarga.map((w) => String(w.nomor)))
                    }
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedHomes([])}
                    className="text-slate-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Checklist Warga */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-1.5 mb-4 max-h-60 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {availableWarga.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  Tidak ada warga yang tersedia (semua sudah ada di jadwal {targetHariAdd} atau tidak cocok pencarian).
                </p>
              ) : (
                availableWarga.map((w) => {
                  const isChecked = selectedHomes.some(
                    (n) => String(n) === String(w.nomor)
                  );
                  return (
                    <label
                      key={w.nomor}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition text-xs sm:text-sm select-none ${
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectHome(w.nomor)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>
                          <strong className="text-slate-800">No. {w.nomor}</strong> - {w.nama}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {isChecked ? "Terpilih ✓" : "+ Pilih"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500 font-medium">
                {selectedHomes.length} warga dipilih untuk {targetHariAdd}
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
                  {saving ? "Menyimpan..." : `Tambahkan ke ${targetHariAdd}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
