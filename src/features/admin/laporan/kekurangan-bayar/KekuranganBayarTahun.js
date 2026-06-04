import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";

export default function KekuranganBayarTahun() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);

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

  const totalSum = data.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0
  );

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
              {months.map((month) => (
                <th key={month.value} className="px-3 py-2 border">
                  {month.label}
                </th>
              ))}
              <th className="px-3 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr
                  key={`${item.nomor_rumah}-${index}`}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 border text-center">{item.nomor_rumah}</td>
                  <td className="px-3 py-2 border text-left">
                    {homeMap[item.nomor_rumah]?.nama || "-"}
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
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 border text-center text-gray-500" colSpan={15}>
                  Tidak ada data rekap tahunan.
                </td>
              </tr>
            )}
            {data.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="px-3 py-2 border text-right" colSpan={15}>
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
