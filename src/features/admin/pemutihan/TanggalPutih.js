import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import DatePicker from "react-datepicker";
import { format, compareAsc, addDays, setYear as setDateYear } from "date-fns";
import { id } from "date-fns/locale";
import { ENDPOINT_BASE_URL } from "../../../shared/config";

export default function TanggalPutih() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [tanggalPemutihan, setTanggalPemutihan] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTanggalPemutihan(year);
  }, [year]);

  const fetchTanggalPemutihan = async (fetchYear) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/tanggal-pemutihan?tahun=${fetchYear}`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat tanggal pemutihan");
      }
      setTanggalPemutihan(result.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Gagal",
        err.message || "Tidak bisa memuat data tanggal putih.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const getAllDatesInRange = (start, end) => {
    const dates = [];
    let current = new Date(start);

    while (compareAsc(current, end) <= 0) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  };

  const handleAddRange = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      Swal.fire("Perhatian", "Pilih tanggal mulai dan selesai.", "warning");
      return;
    }

    if (
      selectedStartDate.getFullYear() !== year ||
      selectedEndDate.getFullYear() !== year
    ) {
      Swal.fire("Perhatian", "Pilih tanggal dalam tahun terpilih.", "warning");
      return;
    }

    if (compareAsc(selectedStartDate, selectedEndDate) > 0) {
      Swal.fire(
        "Perhatian",
        "Tanggal selesai harus sama atau setelah tanggal mulai.",
        "warning",
      );
      return;
    }

    if (!description.trim()) {
      Swal.fire("Perhatian", "Keterangan harus diisi.", "warning");
      return;
    }

    const rowsToSave = getAllDatesInRange(
      selectedStartDate,
      selectedEndDate,
    ).map((date) => ({
      tanggal: format(date, "yyyy-MM-dd"),
      keterangan: description.trim(),
    }));

    Swal.fire({
      title: "Menyimpan...",
      text: "Mengirim tanggal putih ke server.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/tanggal-pemutihan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret_key: "rahasiakita123",
            rowsToSave,
          }),
        },
      );

      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "Gagal menyimpan tanggal putih");
      }

      await fetchTanggalPemutihan(year);
      setDescription("");
      Swal.fire(
        "Berhasil",
        result.message || "Tanggal putih tersimpan.",
        "success",
      );
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Gagal",
        err.message || "Gagal menyimpan tanggal putih.",
        "error",
      );
    }
  };

  const handleDeleteTanggal = async (id) => {
    if (!id) return;

    const confirm = await Swal.fire({
      title: "Hapus tanggal putih?",
      text: "Tanggal pemutihan ini akan dihapus.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/tanggal-pemutihan/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret_key: "rahasiakita123" }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus tanggal putih");
      }
      await fetchTanggalPemutihan(year);
      Swal.fire(
        "Terhapus",
        result.message || "Tanggal putih berhasil dihapus.",
        "success",
      );
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", err.message, "error");
    }
  };

  const visibleDates = useMemo(
    () =>
      tanggalPemutihan
        .filter((item) => new Date(item.tanggal).getFullYear() === year)
        .sort((a, b) => compareAsc(new Date(a.tanggal), new Date(b.tanggal))),
    [tanggalPemutihan, year],
  );

  const handleYearChange = (direction) => {
    const nextYear = year + direction;
    setYear(nextYear);
    setSelectedStartDate((prev) => setDateYear(prev, nextYear));
    setSelectedEndDate((prev) => setDateYear(prev, nextYear));
  };

  return (
    <div className="p-6">
      <div className="mb-6 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tanggal Putih</h1>
            <p className="mt-2 text-sm text-slate-600">
              Kelola tanggal exception dalam setahun yang tidak dihitung sebagai
              kekurangan bayar jimpitan.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <button
              type="button"
              onClick={() => handleYearChange(-1)}
              className="rounded-full bg-white px-3 py-1 shadow-sm hover:bg-slate-100"
            >
              ‹
            </button>
            <span className="font-semibold">{year}</span>
            <button
              type="button"
              onClick={() => handleYearChange(1)}
              className="rounded-full bg-white px-3 py-1 shadow-sm hover:bg-slate-100"
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(260px,1fr)_auto]">
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Mulai
              </label>
              <DatePicker
                selected={selectedStartDate}
                onChange={(date) => date && setSelectedStartDate(date)}
                dateFormat="dd MMMM yyyy"
                locale={id}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tanggal Selesai
              </label>
              <DatePicker
                selected={selectedEndDate}
                onChange={(date) => date && setSelectedEndDate(date)}
                dateFormat="dd MMMM yyyy"
                locale={id}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Keterangan
              </label>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contoh: Libur nasional"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm"
              />
            </div>
            <p className="text-xs text-slate-500">
              Hanya rentang tanggal dalam tahun {year} yang dapat ditambahkan.
            </p>
            <button
              type="button"
              onClick={handleAddRange}
              className="h-14 rounded-2xl bg-blue-700 px-6 text-white shadow hover:bg-blue-800"
            >
              Tambah Rentang
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Daftar Tanggal Putih
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tanggal exception yang akan dikecualikan dari perhitungan
              kekurangan bayar.
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Total: {visibleDates.length} tanggal
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            Memuat tanggal putih...
          </div>
        ) : visibleDates.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
            Belum ada tanggal putih untuk tahun {year}.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {visibleDates.map((item) => (
              <div
                key={item.id || item.tanggal}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-800">
                    {format(new Date(item.tanggal), "EEEE, d MMMM yyyy", {
                      locale: id,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTanggal(item.id)}
                    className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    Hapus
                  </button>
                </div>
                {item.keterangan && (
                  <p className="text-sm text-slate-600">
                    Keterangan: {item.keterangan}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
