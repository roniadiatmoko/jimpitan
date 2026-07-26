import DatePicker from "react-datepicker";
import { months } from "../../../shared/config";
import { useState } from "react";
import Card from "../../../shared/components/ui/Card";
import DetailNominalHitungUlangHarian from "./DetailNominalHitungUlangHarian";

export default function DetailHarian() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());


  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">Detail Harian</h1>

        <label className="mt-4 mb-1 block text-xs font-medium text-muted">Pilih Bulan</label>
        <DatePicker
          selected={selectedMonth}
          onChange={(date) => setSelectedMonth(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker // hanya bulan & tahun
          wrapperClassName="w-full sm:w-64"
          className="w-full rounded-lg border border-line p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <div className="mt-4">
          <span className="text-sm text-muted">
            Menampilkan laporan nominal harian
          </span>
          <div className="text-lg font-bold text-ink">
            {months.find((m) => m.value === selectedMonth.getMonth() + 1).label}{" "}
            {" " + selectedMonth.getFullYear()}
          </div>
        </div>
      </Card>

      <DetailNominalHitungUlangHarian
        period={
          selectedMonth.getFullYear() +
          "-" +
          (selectedMonth.getMonth() + 1).toString().padStart(2, "0")
        }
      />
    </div>
  );
}
