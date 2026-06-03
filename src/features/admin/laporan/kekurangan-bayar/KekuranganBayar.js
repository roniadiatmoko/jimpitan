import DatePicker from "react-datepicker";
import { months, ENDPOINT_BASE_URL } from "../../../../shared/config";
import { useState, useEffect } from "react";
import DetailKekuranganBayar from "./DetailKekuranganBayar";

export default function KekuranganBayar() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [pemutihan, setPemutihan] = useState([]);
    const [pemutihanLoading, setPemutihanLoading] = useState(false);
    const [pemutihanError, setPemutihanError] = useState("");

    const handlePrevMonth = () => {
      setSelectedMonth((prev) => {
        const year = prev.getFullYear();
        const month = prev.getMonth();
        return new Date(year, month - 1, 1);
      });
    };

    const handleNextMonth = () => {
      setSelectedMonth((prev) => {
        const year = prev.getFullYear();
        const month = prev.getMonth();
        return new Date(year, month + 1, 1);
      });
    };

    useEffect(() => {
      const fetchPemutihan = async () => {
        const month = (selectedMonth.getMonth() + 1).toString().padStart(2, "0");
        const year = selectedMonth.getFullYear();

        try {
          setPemutihanLoading(true);
          setPemutihanError("");
          const response = await fetch(
            `${ENDPOINT_BASE_URL}/api/tanggal-pemutihan?bulan=${month}&tahun=${year}`
          );
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.message || "Gagal memuat tanggal pemutihan");
          }

          let rows = [];
          if (result && Array.isArray(result.data)) {
            rows = result.data;
          } else if (Array.isArray(result)) {
            rows = result;
          }

          const filteredRows = rows.filter((item) => {
            if (!item || !item.tanggal) return false;
            const date = new Date(item.tanggal);
            return (
              date.getFullYear() === Number(year) &&
              date.getMonth() + 1 === Number(month)
            );
          });

          setPemutihan(filteredRows);
        } catch (err) {
          console.error(err);
          setPemutihanError(err.message || "Gagal memuat tanggal pemutihan");
          setPemutihan([]);
        } finally {
          setPemutihanLoading(false);
        }
      };

      fetchPemutihan();
    }, [selectedMonth]);

    return (
        <div className="m-4 bg-white shadow-md p-4 rounded-xl">
              <h1 className="text-center font-bold text-2xl text-amber-700 mb-10">
                Laporan Kekurangan Bayar
              </h1>
              <h2>Pilih Bulan</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={handlePrevMonth}
                >
                  ◀
                </button>
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker // hanya bulan & tahun
                  wrapperClassName="w-56"
                  className="bg-gray-200 rounded-md p-2 w-full"
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                  onClick={handleNextMonth}
                >
                  ▶
                </button>
              </div>
        
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  Menampilkan laporan kekurangan bayar<br />
                </span>
                <span className="text-xl font-bold text-amber-600">
                  {months.find((m) => m.value === selectedMonth.getMonth() + 1).label}{" "}
                  {" " + selectedMonth.getFullYear()}
                </span>
              </div>

              {pemutihanLoading ? (
                <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
                  Memuat tanggal pemutihan...
                </div>
              ) : pemutihanError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  {pemutihanError}
                </div>
              ) : pemutihan.length > 0 ? (
                <div className="mt-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm text-blue-900">
                  <div className="font-semibold">Tanggal Putih Aktif</div>
                  <div>
                    Terdapat {pemutihan.length} tanggal pemutihan pada bulan ini.
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <DetailKekuranganBayar
                  period={
                    selectedMonth.getFullYear() +
                    "-" +
                    (selectedMonth.getMonth() + 1).toString().padStart(2, "0")
                  }
                />
              </div>
            </div>
    );

}