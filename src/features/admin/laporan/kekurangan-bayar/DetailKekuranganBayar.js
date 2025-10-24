import { useEffect, useMemo, useRef, useState } from "react";
import { ENDPOINT_BASE_URL, homeList } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";
import html2canvas from "html2canvas";
import RapelForm from "../../rapel/RapelForm";

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
    <div className="text-gray-800">
      {/* Filter Bar */}
      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm font-medium">Filter Status:</label>
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Semua</option>
          <option value="menghuni">Menghuni</option>
          <option value="belum">Belum Dihuni</option>
        </select>

        <button
          onClick={handleExportImage}
          disabled={exporting}
          className={`ml-auto flex items-center gap-2 px-4 py-2 rounded text-white ${
            exporting ? "bg-gray-400" : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          {exporting ? "Mengekspor..." : "Ekspor sebagai Gambar"}
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-500 mb-2">Memuat data...</div>
      )}
      <div ref={tableRef}>
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-amber-600 text-white">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Nomor Rumah</th>
              <th className="px-4 py-2 border">Penghuni</th>
              <th className="px-4 py-2 border">Status Dihuni</th>
              <th className="px-4 py-2 border">Tanggal Kosong</th>
              <th className="px-4 py-2 border">Jumlah Kekurangan Hari</th>
              <th className="px-4 py-2 border">Kekurangan Bayar</th>
              <th className="px-4 py-2 border">Aksi</th>
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
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
                  >
                    <td className="px-4 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {item.nomor_rumah}
                    </td>
                    <td className="px-4 py-2 border text-left">
                      {homeData?.nama ?? "-"}
                    </td>
                    <td className="px-4 py-2 border">
                      <span
                        className={[
                          "px-2 py-1 text-center font-bold rounded-full inline-block",
                          isMenghuni
                            ? "text-green-700 bg-green-300 border-green-700 w-full block"
                            : "text-red-700 bg-red-300 border-red-700 w-full block",
                        ].join(" ")}
                      >
                        {isMenghuni ? "Menghuni" : "Belum"}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">
                      {(item.tanggal_kurang || [])
                        .map((t) => new Date(t).getDate())
                        .join(", ")}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {item.kekurangan_hari} hari
                    </td>
                    <td className="px-4 py-2 border text-right font-bold">
                      {rupiahFormat(item.kekurangan_hari * 500)}
                    </td>
                    <td className="px-4 py-2 border">
                      <button
                        className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-800"
                        onClick={() => {
                          setSelectedNomorRumah(item.nomor_rumah);
                          setOpenModalAdd(true);
                        }}
                      >
                        Lunasi
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                {/* colSpan menyesuaikan jumlah kolom */}
                <td className="px-4 py-2 border text-center" colSpan={8}>
                  Tidak ada data kekurangan bayar.
                </td>
              </tr>
            )}
            <tr className="bg-red-300">
              <td className="px-4 py-2 border text-right font-bold" colSpan={6}>
                Total Kekurangan Bayar
              </td>
              <td className="px-4 py-2 border text-right font-bold">
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

        {
          /* Modal Add Rapel */
          openModalAdd ? (
            <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
              <div className="fixed top-1/2 left-1/2 w-[90%] transform -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-lg p-5 z-50">
                <RapelForm
                  onSuccess={() => getKekuranganBayar()}
                  nomorRumah={selectedNomorRumah}
                />
                <button
                  className="p-4 mb-5 float-right rounded-xl text-white font-bold bg-gray-600 hover:bg-blue-700"
                  onClick={() => {
                    setOpenModalAdd(false);
                  }}
                >
                  <span>Tutup</span>
                </button>
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
