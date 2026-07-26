import { useState } from "react";
import DatePicker from "react-datepicker";
import PengeluaranBulanan from "./PengeluaranBulanan";
import Card from "../../../shared/components/ui/Card";
import { months } from "../../../shared/config";


export default function Pengeluaran() {
    const [selectedMonth, setSelectedMonth] = useState(new Date());

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">Pengeluaran</h1>

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
          <span className="text-sm text-muted">Menampilkan laporan</span>
          <div className="text-lg font-bold text-ink">
            {months.find((m) => m.value === selectedMonth.getMonth() + 1).label}{" "}
            {" " + selectedMonth.getFullYear()}
          </div>
        </div>
      </Card>

      <PengeluaranBulanan
        period={
          selectedMonth.getFullYear() +
          "-" +
          (selectedMonth.getMonth() + 1).toString().padStart(2, "0")
        }
      />
    </div>
  );
}
