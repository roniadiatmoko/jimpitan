import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Badge from "../../../shared/components/ui/Badge";
import Spinner from "../../../shared/components/ui/Spinner";
import Button from "../../../shared/components/ui/Button";

export default function ModalLihatTanggal({ tanggal, wargaList = [], onClose, onLihatRumah }) {
  const [loading, setLoading] = useState(true);
  const [dataLaporan, setDataLaporan] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // all | Terisi | Rapel | Kosong

  useEffect(() => {
    const fetchLaporan = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${ENDPOINT_BASE_URL}/api/laporan/${tanggal}`);
        if (res.ok) {
          const json = await res.json();
          setDataLaporan(json.data);
        } else {
          setDataLaporan(null);
        }
      } catch (err) {
        console.error("Gagal mengambil laporan harian:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tanggal) fetchLaporan();
  }, [tanggal]);

  const dateObj = tanggal ? parseISO(tanggal) : new Date();
  const formattedDate = format(dateObj, "EEEE, dd MMMM yyyy", { locale: id });

  const laporanList = dataLaporan?.laporan || [];

  const filteredList = laporanList.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status_terisi === filterStatus;
  });

  const getNamaWarga = (nomor) => {
    const found = wargaList.find((h) => Number(h.nomor) === Number(nomor));
    return found?.nama || "-";
  };

  return (
    <div>
      <div className="border-b border-line pb-4 mb-4">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
          <span>📋</span> Rincian Jimpitan Ronda Tanggal: {formattedDate}
        </h2>
        <p className="text-xs text-muted mt-1">
          Status pengisian jimpitan seluruh rumah oleh petugas ronda pada tanggal ini.
        </p>
      </div>

      {loading ? (
        <Spinner label="Memuat rincian tanggal..." />
      ) : !dataLaporan ? (
        <div className="text-center py-8 text-muted border border-dashed border-line rounded-xl">
          <p className="font-semibold text-ink">Belum Ada Data</p>
          <p className="text-xs mt-1">Petugas ronda belum mengisi catatan jimpitan untuk tanggal {formattedDate}.</p>
        </div>
      ) : (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <div className="rounded-xl border border-line bg-surface p-3 text-center">
              <p className="text-[11px] font-semibold text-muted uppercase">Total Terisi</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{dataLaporan.totalTerisi} <span className="text-xs font-normal text-muted">rumah</span></p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 text-center">
              <p className="text-[11px] font-semibold text-sky-700 uppercase">Rapel</p>
              <p className="text-xl font-bold text-sky-800 mt-0.5">{dataLaporan.totalRapel} <span className="text-xs font-normal text-sky-700">rumah</span></p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-center">
              <p className="text-[11px] font-semibold text-red-700 uppercase">Tidak Isi (Kosong)</p>
              <p className="text-xl font-bold text-red-800 mt-0.5">{dataLaporan.totalTidakTerisi} <span className="text-xs font-normal text-red-700">rumah</span></p>
            </div>
            <div className="rounded-xl border border-line bg-surface p-3 text-center">
              <p className="text-[11px] font-semibold text-muted uppercase">Total Uang Ronda</p>
              <p className="text-xl font-bold text-ink mt-0.5">Rp {Number(dataLaporan.totalUang || 0).toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* Filter Tab */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex gap-1.5 bg-surface p-1 rounded-lg border border-line text-xs">
              <button
                type="button"
                className={`px-3 py-1 rounded-md font-medium transition ${filterStatus === "all" ? "bg-white shadow-sm font-semibold text-ink" : "text-muted hover:text-ink"}`}
                onClick={() => setFilterStatus("all")}
              >
                Semua ({laporanList.length})
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md font-medium transition ${filterStatus === "Terisi" ? "bg-emerald-600 text-white font-semibold" : "text-muted hover:text-ink"}`}
                onClick={() => setFilterStatus("Terisi")}
              >
                Terisi ({dataLaporan.totalTerisi})
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md font-medium transition ${filterStatus === "Rapel" ? "bg-sky-600 text-white font-semibold" : "text-muted hover:text-ink"}`}
                onClick={() => setFilterStatus("Rapel")}
              >
                Rapel ({dataLaporan.totalRapel})
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md font-medium transition ${filterStatus === "Kosong" ? "bg-red-600 text-white font-semibold" : "text-muted hover:text-ink"}`}
                onClick={() => setFilterStatus("Kosong")}
              >
                Kosong ({dataLaporan.totalTidakTerisi})
              </button>
            </div>

            <span className="text-[11px] text-muted">
              Menampilkan {filteredList.length} rumah
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-line max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface sticky top-0 text-muted font-semibold uppercase border-b border-line text-center">
                <tr>
                  <th className="px-3 py-2 w-12">No. Rumah</th>
                  <th className="px-3 py-2 text-left">Nama Warga</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredList.map((item) => {
                  const nama = getNamaWarga(item.nomor_rumah);
                  return (
                    <tr key={item.nomor_rumah} className="odd:bg-white even:bg-surface/50 hover:bg-slate-50 transition">
                      <td className="px-3 py-2 text-center font-bold text-ink">
                        {item.nomor_rumah}
                      </td>
                      <td className="px-3 py-2 font-medium text-ink">
                        {nama !== "-" ? nama : item.nama_pengisi}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.status_terisi === "Terisi" ? (
                          <Badge tone="success">✅ Terisi</Badge>
                        ) : item.status_terisi === "Rapel" ? (
                          <Badge tone="info">✅ Rapel</Badge>
                        ) : (
                          <Badge tone="danger">❌ Kosong</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {onLihatRumah && (
                          <button
                            type="button"
                            className="text-[11px] text-accent font-semibold hover:underline"
                            onClick={() => onLihatRumah(item.nomor_rumah, nama !== "-" ? nama : item.nama_pengisi)}
                          >
                            Lihat Rumah ↗
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-5 pt-3 border-t border-line flex justify-end">
        <Button variant="secondary" onClick={onClose} className="!px-5 !py-2 text-xs">
          Tutup
        </Button>
      </div>
    </div>
  );
}
