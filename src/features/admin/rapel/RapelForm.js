import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import { getDaysInMonth } from "../../../shared/helpers/DateHelper";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import DatePicker from "react-datepicker";

// Komponen terpisah untuk formulir Rapel Jimpitan
const parsePeriodToDate = (period) => {
  if (!period) return null;
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
};

export default function RapelForm({ onSuccess, nomorRumah = null, initialPeriod }) {
  const [rapelNominal, setRapelNominal] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    parsePeriodToDate(initialPeriod) || new Date()
  );
  const [selectedHouse, setSelectedHouse] = useState("");

  const houseOptions = homeList.map((h) => ({
    value: h.nomor,
    label: `${h.nomor} - ${h.nama}`,
  }));

  useEffect(() => {
    if (nomorRumah) {
      const match = houseOptions.find(
        (opt) => opt.value === Number(nomorRumah),
      );
      if (match) setSelectedHouse(match.value);
    }
  }, [nomorRumah, houseOptions]);

  useEffect(() => {
    const parsed = parsePeriodToDate(initialPeriod);
    if (parsed) {
      setSelectedMonth(parsed);
    }
  }, [initialPeriod]);

  const handleRapelSubmit = async () => {
    if (!selectedHouse) {
      Swal.fire("Perhatian", "Nomor rumah harus diisi.", "warning");
      return;
    }

    if (!rapelNominal) {
      Swal.fire("Perhatian", "Nominal harus diisi.", "warning");
      return;
    }

    Swal.fire({
      title: "Menyimpan...",
      text: "Mencatat rapel, mohon tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const monthToSearch = selectedMonth.getFullYear() + "-" + (selectedMonth.getMonth() + 1).toString().padStart(2, "0");

      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rapel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: "rahasiakita123",
          nomor_rumah: selectedHouse,
          nominal: parseInt(rapelNominal),
          bulan: monthToSearch,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire("Berhasil!", result.message, "success");
        setSelectedHouse("");
        setRapelNominal("");
        onSuccess?.();
      } else {
        throw new Error(result.message || "Gagal mencatat rapel");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", err.message, "error");
    }
  };

  return (
    <div className="m-8 p-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-center text-yellow-800 mb-4">
        Formulir Rapel Jimpitan
      </h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-gray-700">Nomor Rumah</label>

          <Select
            options={houseOptions}
            value={houseOptions.find(
              (o) => String(o.value) === String(nomorRumah),
            )}
            defaultValue={houseOptions.find(
              (o) => o.value === Number(nomorRumah),
            )}
            onChange={(opt) => setSelectedHouse(opt.value)}
            isSearchable
            placeholder="Pilih Rumah ..."
            menuPlacement="auto" // drop-up
            menuPortalTarget={document.body} // render di body -> tidak ketutup taskbar
            styles={{
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              container: (base) => ({ ...base, width: "300px" }), // sesuaikan
            }}
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700">Nominal</label>
          <input
            type="number"
            value={rapelNominal}
            onChange={(e) => setRapelNominal(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Contoh: 7000"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700">Bulan</label>
          {/* <select
            className="w-full p-2 border border-gray-300 bg-white rounded"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => {
              return (
                <option value={month.value} key={month.value}>
                  {month.label}
                </option>
              );
            })}
          </select> */}

          <DatePicker
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker // hanya bulan & tahun
            wrapperClassName="w-full"
            className="bg-gray-200 rounded-md p-2 w-full"
          />
        </div>
      </div>
      <div className="text-center text-gray-600 mb-4">
        Bulan {months.find((m) => m.value === Number((selectedMonth.getMonth() + 1).toString().padStart(2, "0"))).label}{" "}
        terdapat {getDaysInMonth((selectedMonth.getMonth() + 1).toString().padStart(2, "0"), new Date().getFullYear())} hari
        (
        {rupiahFormat(
          getDaysInMonth((selectedMonth.getMonth() + 1).toString().padStart(2, "0"), new Date().getFullYear()) * 500,
        )}
        ).
        <br />
        Nominal rapel akan mengisi{" "}
        <span className="font-bold">
          {rapelNominal ? Math.floor(parseInt(rapelNominal) / 500) : 0}
        </span>{" "}
        hari jimpitan kosong.
      </div>
      <button
        onClick={handleRapelSubmit}
        className="w-full bg-yellow-600 text-white font-bold p-2 rounded-lg hover:bg-yellow-700 transition"
      >
        Simpan Rapel
      </button>
    </div>
  );
}
