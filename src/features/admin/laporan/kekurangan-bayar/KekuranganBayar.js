import DatePicker from "react-datepicker";
import { months } from "../../../../shared/config";
import { useState } from "react";
import DetailKekuranganBayar from "./DetailKekuranganBayar";

export default function KekuranganBayar() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());

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