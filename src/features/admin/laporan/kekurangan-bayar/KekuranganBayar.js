import DatePicker from "react-datepicker";
import { months, ENDPOINT_BASE_URL } from "../../../../shared/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../../shared/components/ui/Card";
import Button from "../../../../shared/components/ui/Button";
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

    const navigate = useNavigate();

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
        <div className="space-y-4">
          <Card>
              <h1 className="text-xl font-bold text-ink">
                Laporan Kekurangan Bayar
              </h1>
              <label className="mt-4 mb-1 block text-xs font-medium text-muted">Pilih Bulan</label>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={handlePrevMonth}>
                  ◀
                </Button>
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => setSelectedMonth(date)}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker // hanya bulan & tahun
                  wrapperClassName="w-56"
                  className="w-full rounded-lg border border-line p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <Button variant="secondary" onClick={handleNextMonth}>
                  ▶
                </Button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <span className="text-sm text-muted">
                    Menampilkan laporan kekurangan bayar
                  </span>
                  <div className="text-lg font-bold text-ink">
                    {months.find((m) => m.value === selectedMonth.getMonth() + 1).label}{" "}
                    {selectedMonth.getFullYear()}
                  </div>
                </div>
                <Button onClick={() => navigate("/admin/kekurangan-bayar-tahun")}>
                  Rekap dalam Tahun
                </Button>
              </div>

              {pemutihanLoading ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Memuat tanggal pemutihan...
                </div>
              ) : pemutihanError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  {pemutihanError}
                </div>
              ) : pemutihan.length > 0 ? (
                <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
                  <div className="font-semibold">Tanggal Putih Aktif</div>
                  <div>
                    Terdapat {pemutihan.length} tanggal pemutihan pada bulan ini.
                  </div>
                </div>
              ) : null}
          </Card>

          <DetailKekuranganBayar
            period={
              selectedMonth.getFullYear() +
              "-" +
              (selectedMonth.getMonth() + 1).toString().padStart(2, "0")
            }
          />
        </div>
    );

}