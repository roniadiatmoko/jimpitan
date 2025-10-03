import DatePicker from "react-datepicker";
import { months } from "../../../shared/config";
import { useState } from "react";
import DetailNominalHitungUlangHarian from "./DetailNominalHitungUlangHarian";

export default function DetailHarian() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());


  return (
    <div className="m-8 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-teal-700 mb-10">
        Detail Harian
      </h1>

      <h2>Pilih Bulan</h2>
      <DatePicker
        selected={selectedMonth}
        onChange={(date) => setSelectedMonth(date)}
        dateFormat="MMMM yyyy"
        showMonthYearPicker // hanya bulan & tahun
        wrapperClassName="w-full"
        className="bg-gray-200 rounded-md p-2 w-full"
      />

      <div className="mt-4 text-center">
        <span className="text-sm text-gray-500">
          Menampilkan laporan <br />
        </span>
        <span className="text-xl font-bold text-teal-600">
          {months.find((m) => m.value === selectedMonth.getMonth() + 1).label}{" "}
          {" " + selectedMonth.getFullYear()}
        </span>
      </div>

      <div className="mt-5">
        <DetailNominalHitungUlangHarian
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
