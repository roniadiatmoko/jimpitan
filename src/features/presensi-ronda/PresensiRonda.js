import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ENDPOINT_BASE_URL, homeList } from "../../shared/config";

export default function PresensiRonda({ tanggal, onChangePersonil }) {
  const [personilList, setPersonilList] = useState([]);
  const [hariName, setHariName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModalTambah, setShowModalTambah] = useState(false);
  const [searchWarga, setSearchWarga] = useState("");

  const tanggalStr = (() => {
    if (!tanggal) return "";
    try {
      return format(
        tanggal instanceof Date ? tanggal : new Date(tanggal),
        "yyyy-MM-dd"
      );
    } catch {
      return String(tanggal).slice(0, 10);
    }
  })();

  const fetchPersonilRonda = async () => {
    if (!tanggalStr) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/ronda/personil/${encodeURIComponent(tanggalStr)}`
      );
      const json = await res.json();

      if (res.ok && json.success) {
        setHariName(json.hari || "");
        const raw = json.data || [];
        // Default: semua terchecklist (checked: true)
        const initialList = raw.map((item) => ({
          ...item,
          nomor_rumah: String(item.nomor_rumah),
          checked: true,
          is_default: Boolean(item.is_default_jadwal || !json.isSaved),
        }));

        setPersonilList(initialList);
        if (onChangePersonil) {
          onChangePersonil(initialList.filter((p) => p.checked));
        }
      }
    } catch (err) {
      console.error("Gagal load personil ronda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonilRonda();
  }, [tanggalStr]);

  // Toggle Centang
  const handleToggleCheck = (nomorRumah) => {
    setPersonilList((prev) => {
      const updated = prev.map((p) =>
        p.nomor_rumah === nomorRumah ? { ...p, checked: !p.checked } : p
      );
      if (onChangePersonil) {
        onChangePersonil(updated.filter((p) => p.checked));
      }
      return updated;
    });
  };

  // Tambah Warga Pengganti / Luar Jadwal
  const handlePilihWargaTambahan = (warga) => {
    setPersonilList((prev) => {
      // Jika sudah ada, cukup buat checked = true
      const exists = prev.find((p) => p.nomor_rumah === String(warga.nomor));
      let updated;
      if (exists) {
        updated = prev.map((p) =>
          p.nomor_rumah === String(warga.nomor) ? { ...p, checked: true } : p
        );
      } else {
        updated = [
          ...prev,
          {
            nomor_rumah: String(warga.nomor),
            nama_penghuni: warga.nama || `Rumah ${warga.nomor}`,
            checked: true,
            is_tambahan: true,
          },
        ];
      }
      if (onChangePersonil) {
        onChangePersonil(updated.filter((p) => p.checked));
      }
      return updated;
    });

    setShowModalTambah(false);
    setSearchWarga("");
  };

  // Hapus Personil Tambahan dari List
  const handleHapusTambahan = (e, nomorRumah) => {
    e.stopPropagation();
    setPersonilList((prev) => {
      const updated = prev.filter((p) => p.nomor_rumah !== nomorRumah);
      if (onChangePersonil) {
        onChangePersonil(updated.filter((p) => p.checked));
      }
      return updated;
    });
  };

  // Daftar nomor yang sudah ada di list saat ini
  const existingNomor = useMemo(() => {
    return new Set(personilList.map((p) => p.nomor_rumah));
  }, [personilList]);

  // Warga yang bisa dipilih untuk pengganti/tambahan
  const wargaTersedia = useMemo(() => {
    return homeList.filter((w) => {
      const namaMatch = (w.nama || "").toLowerCase().includes(searchWarga.toLowerCase());
      const noMatch = String(w.nomor).includes(searchWarga);
      return (namaMatch || noMatch) && !existingNomor.has(String(w.nomor));
    });
  }, [searchWarga, existingNomor]);

  const totalHadir = personilList.filter((p) => p.checked).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5">
      {/* Header Presensi */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Penanggung Jawab Ronda {hariName ? `• Hari ${hariName}` : ""}
          </span>
          <h2 className="text-base font-bold text-slate-800">
            Presensi Petugas Ronda
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hilangkan centang jika tidak hadir. Otomatis tersimpan saat klik tombol Simpan di bawah.
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
          {totalHadir} Hadir
        </span>
      </div>

      {/* Daftar Personil Checklist */}
      <div className="mt-3.5 space-y-2">
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Memuat daftar petugas ronda...
          </div>
        ) : personilList.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4">
            <p className="text-2xl mb-1">📋</p>
            <p className="text-xs font-semibold text-slate-600">
              Belum ada jadwal petugas untuk hari {hariName || "ini"}.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Petugas ronda dapat ditambahkan manual melalui tombol di bawah atau diatur di menu Admin.
            </p>
          </div>
        ) : (
          personilList.map((personil) => {
            const isChecked = personil.checked;
            return (
              <div
                key={personil.nomor_rumah}
                onClick={() => handleToggleCheck(personil.nomor_rumah)}
                className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                  isChecked
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs"
                    : "bg-slate-50/60 border-slate-200/80 text-slate-400 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition shrink-0 ${
                      isChecked
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "border-2 border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                          isChecked
                            ? "bg-emerald-200/70 text-emerald-900"
                            : "bg-slate-200 text-slate-500 line-through"
                        }`}
                      >
                        No. {personil.nomor_rumah}
                      </span>
                      <span
                        className={`text-sm truncate font-semibold ${
                          isChecked
                            ? "text-slate-800"
                            : "text-slate-400 line-through"
                        }`}
                      >
                        {personil.nama_penghuni || "-"}
                      </span>
                      {personil.is_tambahan && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                          Tukar / Pengganti
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isChecked
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isChecked ? "Hadir" : "Tidak Hadir"}
                  </span>
                  {personil.is_tambahan && (
                    <button
                      type="button"
                      onClick={(e) => handleHapusTambahan(e, personil.nomor_rumah)}
                      title="Hapus dari daftar ronda hari ini"
                      className="text-slate-400 hover:text-rose-600 p-1 text-sm rounded transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tombol Tambah Personil di luar Jadwal */}
      <button
        type="button"
        onClick={() => {
          setSearchWarga("");
          setShowModalTambah(true);
        }}
        className="mt-3 w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
      >
        <span>➕</span>
        <span>Tambah Personil Lain / Pengganti</span>
      </button>

      {/* Modal Pilih Warga Tambahan */}
      {showModalTambah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Tambah Personil Ronda
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih warga yang ikut ronda / menggantikan jadwal hari {hariName || "ini"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalTambah(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Ketik nomor rumah atau nama warga..."
                value={searchWarga}
                onChange={(e) => setSearchWarga(e.target.value)}
                autoFocus
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-1.5 max-h-60 pr-1">
              {wargaTersedia.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  Tidak ditemukan warga yang cocok.
                </p>
              ) : (
                wargaTersedia.map((w) => (
                  <button
                    key={w.nomor}
                    type="button"
                    onClick={() => handlePilihWargaTambahan(w)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70 transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-emerald-800 text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 mr-2">
                        No. {w.nomor}
                      </span>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                        {w.nama}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      Pilih +
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModalTambah(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
