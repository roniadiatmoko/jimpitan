import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";

export default function KekuranganBayarTahun() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEndMonth, setSelectedEndMonth] = useState(12);

  const yearOptions = useMemo(() => {
    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, idx) => String(start + idx));
  }, [currentYear]);

  const homeMap = useMemo(() => {
    const map = {};
    for (const home of homeList) {
      map[String(home.nomor)] = home;
    }
    return map;
  }, []);

  const fetchKekuranganTahun = async (selectedYear) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/laporan-kekurangan-tahun/${selectedYear}`
      );
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Gagal memuat laporan tahunan");
      }
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memuat laporan tahunan");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKekuranganTahun(year);
  }, [year]);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return (data || []).filter((item) => {
      const homeData = homeMap[item.nomor_rumah];
      if (!homeData) return false;
      const isMenghuni = homeData.sudah_menghuni === 1;
      return statusFilter === "menghuni" ? isMenghuni : !isMenghuni;
    });
  }, [data, homeMap, statusFilter]);

  const totalSum = filteredData.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

  const calculateCumulativeTotal = (item) => {
    let cumulative = 0;
    for (let i = 1; i <= selectedEndMonth; i++) {
      const month = months.find((m) => m.value === i);
      if (month) {
        const key = month.label.toLowerCase();
        cumulative += Number(item[key]) || 0;
      }
    }
    return cumulative;
  };

  return (
    <div className="m-4 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-amber-700 mb-6">
        Rekap Kekurangan Bayar per Tahun
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Pilih Tahun</label>
          <select
            className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </div>

        <div className="text-right text-sm text-gray-500">
          Menampilkan data rekap tahunan untuk tahun <span className="font-semibold">{year}</span>.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium mr-2">Filter Status:</span>
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "all" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
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
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "menghuni" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
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
          <label className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${statusFilter === "belum" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}>
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
      </div>

      {loading && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          Memuat data rekap tahunan...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-amber-600 text-white">
            <tr>
              <th className="px-3 py-2 border">Nomor Rumah</th>
              <th className="px-3 py-2 border">Penghuni</th>
              <th className="px-3 py-2 border">Status Dihuni</th>
              <th className="px-3 py-2 border">
                <div className="flex flex-col gap-1">
                  <span>Total sampai bulan</span>
                  <select
                    value={selectedEndMonth}
                    onChange={(e) => setSelectedEndMonth(Number(e.target.value))}
                    className="w-24 rounded border border-white bg-amber-700 px-2 py-1 text-xs text-white"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              </th>
              {months.map((month) => (
                <th key={month.value} className="px-3 py-2 border">
                  {month.label}
                </th>
              ))}
              <th className="px-3 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                const homeData = homeMap[item.nomor_rumah];
                const isMenghuni = homeData?.sudah_menghuni === 1;
                return (
                  <tr
                    key={`${item.nomor_rumah}-${index}`}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-3 py-2 border text-center">{item.nomor_rumah}</td>
                    <td className="px-3 py-2 border text-left">
                      {homeData?.nama || "-"}
                    </td>
                    <td className="px-3 py-2 border">
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
                    <td className="px-3 py-2 border text-center font-semibold">
                      {(() => {
                        const cumulativeDays = calculateCumulativeTotal(item);
                        const cumulativeNominal = cumulativeDays * 500;
                        return `${cumulativeDays} (${rupiahFormat(cumulativeNominal)})`;
                      })()}
                    </td>
                    {months.map((month) => {
                      const key = month.label.toLowerCase();
                      const days = Number(item[key]) || 0;
                      const nominal = days * 500;
                      return (
                        <td key={key} className="px-3 py-2 border text-center">
                          {days} ({rupiahFormat(nominal)})
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border text-center font-semibold">
                      {item.total ?? 0} ({rupiahFormat((Number(item.total) || 0) * 500)})
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-3 py-6 border text-center text-gray-500" colSpan={17}>
                  Tidak ada data rekap tahunan.
                </td>
              </tr>
            )}
            {filteredData.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="px-3 py-2 border" colSpan={3}></td>
                <td className="px-3 py-2 border text-center">
                  {(() => {
                    const cumulativeGrandTotal = filteredData.reduce((sum, item) => {
                      return sum + calculateCumulativeTotal(item);
                    }, 0);
                    const cumulativeNominal = cumulativeGrandTotal * 500;
                    return `${cumulativeGrandTotal} (${rupiahFormat(cumulativeNominal)})`;
                  })()}
                </td>
                <td className="px-3 py-2 border text-right" colSpan={13}>
                  Total Seluruh Kekurangan Bayar: {totalSum} ({rupiahFormat(totalSum * 500)})
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
