import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import Select from "react-select";
import { ENDPOINT_BASE_URL, months } from "../../../shared/config";
import Badge from "../../../shared/components/ui/Badge";
import Spinner from "../../../shared/components/ui/Spinner";
import Button from "../../../shared/components/ui/Button";

export default function ModalStatusRumah({
  nomorRumah: initialNomorRumah,
  namaWarga: initialNamaWarga,
  period,
  wargaList = [],
  onClose,
}) {
  const [selectedHouse, setSelectedHouse] = useState(
    initialNomorRumah ? String(initialNomorRumah) : ""
  );
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [currentNamaWarga, setCurrentNamaWarga] = useState(initialNamaWarga || "");

  const [year, month] = period.split("-").map(Number);
  const namaBulan = months.find((m) => m.value === month)?.label || month;

  // Opsi rumah dari ref_warga
  const houseOptions = wargaList.map((h) => ({
    value: String(h.nomor),
    label: `No. ${h.nomor} — ${h.nama}`,
    nama: h.nama,
  }));

  const fetchStatusRumah = async (nomor) => {
    if (!nomor) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/jimpitan/status-rumah/${nomor}/${period}`
      );
      const json = await res.json();
      if (json.status === "OK") {
        setRiwayat(json.riwayat || []);
        if (json.riwayat && json.riwayat.length > 0 && json.riwayat[0].nama_warga) {
          setCurrentNamaWarga(json.riwayat[0].nama_warga);
        } else {
          const match = houseOptions.find((opt) => opt.value === String(nomor));
          if (match) setCurrentNamaWarga(match.nama);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil status jimpitan rumah:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHouse) {
      fetchStatusRumah(selectedHouse);
    }
  }, [selectedHouse, period]);

  // Hitung ringkasan
  const totalRonda = riwayat.length;
  const totalTerisi = riwayat.filter((r) => r.jumlah > 0).length;
  const totalRapel = riwayat.filter((r) => r.jumlah === 0 && r.is_rapel > 0).length;
  const totalKosong = riwayat.filter((r) => r.jumlah === 0 && r.is_rapel === 0).length;

  return (
    <div>
      {/* Header Modal */}
      <div className="border-b border-line pb-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <span>🏠</span> Status Jimpitan Harian Rumah No. {selectedHouse}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Warga: <span className="font-semibold text-ink">{currentNamaWarga || "-"}</span> • Periode: <span className="font-semibold text-ink">{namaBulan} {year}</span>
            </p>
          </div>

          {/* Pemilih Rumah Cepat di Dalam Modal */}
          {houseOptions.length > 0 && (
            <div className="w-full sm:w-64">
              <label className="block text-[11px] font-medium text-muted mb-1">
                Ganti Rumah:
              </label>
              <Select
                options={houseOptions}
                value={houseOptions.find((opt) => opt.value === String(selectedHouse)) || null}
                onChange={(selected) => {
                  if (selected) {
                    setSelectedHouse(selected.value);
                    setCurrentNamaWarga(selected.nama);
                  }
                }}
                className="text-xs"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "34px",
                    borderRadius: "0.5rem",
                  }),
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan Statistik Hari yang Diinput Petugas Ronda */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="rounded-xl border border-line bg-surface p-3 text-center">
          <p className="text-[11px] font-semibold text-muted uppercase">Hari Diinput Ronda</p>
          <p className="text-xl font-bold text-ink mt-0.5">{totalRonda} <span className="text-xs font-normal text-muted">hari</span></p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Isi (Ronda)</p>
          <p className="text-xl font-bold text-emerald-800 mt-0.5">{totalTerisi} <span className="text-xs font-normal text-emerald-700">hari</span></p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-center">
          <p className="text-[11px] font-semibold text-sky-700 uppercase">Isi (Rapel)</p>
          <p className="text-xl font-bold text-sky-800 mt-0.5">{totalRapel} <span className="text-xs font-normal text-sky-700">hari</span></p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-center">
          <p className="text-[11px] font-semibold text-red-700 uppercase">Tidak Isi (Kosong)</p>
          <p className="text-xl font-bold text-red-800 mt-0.5">{totalKosong} <span className="text-xs font-normal text-red-700">hari</span></p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-2.5 text-xs text-blue-900 mb-4 flex items-center justify-between">
        <span>
          ℹ️ Daftar di bawah <b>hanya menampilkan tanggal yang sudah diisikan petugas ronda</b> pada bulan {namaBulan} {year}.
        </span>
      </div>

      {loading ? (
        <Spinner label="Memuat status jimpitan..." />
      ) : riwayat.length === 0 ? (
        <div className="text-center py-8 text-muted border border-dashed border-line rounded-xl">
          <p className="font-semibold text-ink">Belum Ada Data Petugas Ronda</p>
          <p className="text-xs mt-1">Belum ada tanggal ronda yang diinputkan untuk bulan {namaBulan} {year}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface sticky top-0 text-muted font-semibold uppercase border-b border-line text-center">
              <tr>
                <th className="px-3 py-2.5 w-10">No</th>
                <th className="px-3 py-2.5 text-left">Tanggal Ronda</th>
                <th className="px-3 py-2.5">Status Pengisian</th>
                <th className="px-3 py-2.5 text-left">Petugas Ronda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {riwayat.map((item, idx) => {
                const dateObj = parseISO(item.tanggal);
                const isTerisiRonda = item.jumlah > 0;
                const isTerisiRapel = item.jumlah === 0 && item.is_rapel > 0;

                return (
                  <tr
                    key={item.tanggal}
                    className={`odd:bg-white even:bg-surface/50 hover:bg-slate-50 transition`}
                  >
                    <td className="px-3 py-2 text-center text-muted font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">
                      {format(dateObj, "EEEE, dd MMMM yyyy", { locale: id })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isTerisiRonda ? (
                        <Badge tone="success" className="font-semibold">
                          ✅ Isi (Ronda)
                        </Badge>
                      ) : isTerisiRapel ? (
                        <Badge tone="info" className="font-semibold">
                          ✅ Isi (Rapel)
                        </Badge>
                      ) : (
                        <Badge tone="danger" className="font-semibold">
                          ❌ Tidak Isi (Kosong)
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted text-[11px]">
                      {item.diambil_oleh || "Petugas Ronda"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tombol Tutup */}
      <div className="mt-5 pt-3 border-t border-line flex justify-end">
        <Button variant="secondary" onClick={onClose} className="!px-5 !py-2 text-xs">
          Tutup
        </Button>
      </div>
    </div>
  );
}
