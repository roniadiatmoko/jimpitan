import { useEffect, useMemo, useRef, useState } from "react";
import { ENDPOINT_BASE_URL, homeList } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";
import html2canvas from "html2canvas";
import RapelForm from "../../rapel/RapelForm";
import Card from "../../../../shared/components/ui/Card";
import Button from "../../../../shared/components/ui/Button";
import Badge from "../../../../shared/components/ui/Badge";

export default function KekuranganBayar({
  period = new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all"); // all | menghuni | belum
  const [exporting, setExporting] = useState(false);
  const [selectedNomorRumah, setSelectedNomorRumah] = useState(null);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const tableRef = useRef(null);

  const handleExportImage = async () => {
    if (!tableRef.current) return;

    setExporting(true);

    const node = tableRef.current;
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: node.scrollWidth,
        windowHeight: node.scrollHeight,
      });

      const dataURL = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      const stamp = period.replace(/:/g, "-");
      link.download = `Laporan_Kekurangan_Bayar_${stamp}.png`;
      link.href = dataURL;
      link.click();
    } catch (err) {
      console.error("Error exporting image:", err);
    } finally {
      setExporting(false);
    }
  };

  const getKekuranganBayar = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/laporan-kekurangan/${period}`
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json?.message || "Gagal mengambil data kekurangan bayar"
        );
      }
      setData(json.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getKekuranganBayar();
  }, [period, reloadFlag]);

  // Optimasi: nomor -> data rumah
  const homeMap = useMemo(() => {
    const map = {};
    for (const h of homeList) map[Number(h.nomor)] = h;
    return map;
  }, [homeList]);

  // Terapkan filter status
  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return (data || []).filter((item) => {
      const homeData = homeMap[Number(item.nomor_rumah)];
      if (!homeData) return false;
      const isMenghuni = homeData.sudah_menghuni === 1;
      return statusFilter === "menghuni" ? isMenghuni : !isMenghuni;
    });
  }, [data, homeMap, statusFilter]);

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink mr-2">Filter Status:</span>
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "all" ? "bg-accent text-white border-accent" : "bg-white text-ink border-line hover:bg-surface"}`}>
            <input
              type="radio"
              name="statusFilter"
              value="all"
              checked={statusFilter === "all"}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sr-only"
            />
            Semua
          </label>
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "menghuni" ? "bg-accent text-white border-accent" : "bg-white text-ink border-line hover:bg-surface"}`}>
            <input
              type="radio"
              name="statusFilter"
              value="menghuni"
              checked={statusFilter === "menghuni"}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sr-only"
            />
            Menghuni
          </label>
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "belum" ? "bg-accent text-white border-accent" : "bg-white text-ink border-line hover:bg-surface"}`}>
            <input
              type="radio"
              name="statusFilter"
              value="belum"
              checked={statusFilter === "belum"}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sr-only"
            />
            Belum Dihuni
          </label>
        </div>

        <Button
          className="ml-auto"
          onClick={handleExportImage}
          disabled={exporting}
        >
          {exporting ? "Mengekspor..." : "Ekspor sebagai Gambar"}
        </Button>
      </div>

      {loading && (
        <div className="text-center text-muted mb-2">Memuat data...</div>
      )}
      <div ref={tableRef}>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Nomor Rumah</th>
                  <th className="px-4 py-3">Penghuni</th>
                  <th className="px-4 py-3">Status Dihuni</th>
                  <th className="px-4 py-3">Tanggal Kosong</th>
                  <th className="px-4 py-3">Jumlah Kekurangan Hari</th>
                  <th className="px-4 py-3">Kekurangan Bayar</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Kirim Notifikasi ke WA</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item, index) => {
                    const homeData = homeMap[Number(item.nomor_rumah)];
                    const isMenghuni = homeData?.sudah_menghuni === 1;

                    return (
                      <tr
                        key={item.id ?? `${item.nomor_rumah}-${index}`}
                        className="border-t border-line odd:bg-white even:bg-surface"
                      >
                        <td className="px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.nomor_rumah}
                        </td>
                        <td className="px-4 py-2 text-left">
                          {homeData?.nama ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Badge tone={isMenghuni ? "success" : "danger"}>
                            {isMenghuni ? "Menghuni" : "Belum"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          {(item.tanggal_kurang || [])
                            .map((t) => new Date(t).getDate())
                            .join(", ")}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {item.kekurangan_hari} hari
                        </td>
                        <td className="px-4 py-2 text-right font-bold">
                          {rupiahFormat(item.kekurangan_hari * 500)}
                        </td>
                        <td className="px-4 py-2">
                          <Button
                            className="!px-3 !py-1"
                            onClick={() => {
                              setSelectedNomorRumah(item.nomor_rumah);
                              setOpenModalAdd(true);
                            }}
                          >
                            Lunasi
                          </Button>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Button
                            variant="success"
                            className="!px-3 !py-1"
                            onClick={() => {
                              // TODO: implement WhatsApp notification logic
                              console.log(`Kirim notifikasi WA ke rumah ${item.nomor_rumah}`);
                            }}
                          >
                            Kirim WA
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    {/* colSpan menyesuaikan jumlah kolom */}
                    <td className="px-4 py-6 text-center text-muted" colSpan={9}>
                      Tidak ada data kekurangan bayar.
                    </td>
                  </tr>
                )}
                <tr className="border-t border-line bg-red-50 font-bold text-red-900">
                  <td className="px-4 py-2 text-right" colSpan={7}>
                    Total Kekurangan Bayar
                  </td>
                  <td className="px-4 py-2 text-right">
                    {rupiahFormat(
                      filteredData.reduce(
                        (sum, item) => sum + item.kekurangan_hari * 500,
                        0
                      )
                    )}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {
          /* Modal Add Rapel */
          openModalAdd ? (
            <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
              <div className="fixed top-1/2 left-1/2 w-[90%] max-w-lg transform -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
                <RapelForm
                  onSuccess={() => getKekuranganBayar()}
                  nomorRumah={selectedNomorRumah}
                  initialPeriod={period}
                />
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => {
                    setOpenModalAdd(false);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            ""
          )
        }
      </div>
    </div>
  );
}
