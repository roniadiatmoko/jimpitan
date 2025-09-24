import { useState } from "react";
import Swal from "sweetalert2";
import { ENDPOINT_BASE_URL, homeList, months } from "../config";
import { getDaysInMonth } from "../components/DateHelper";
import { rupiahFormat } from "../components/MoneyHeper";
import Select from "react-select";

// Komponen terpisah untuk formulir Rapel Jimpitan
export default function RapelForm({onSuccess}) {
  const [rapelNominal, setRapelNominal] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedHouse, setSelectedHouse] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const houseOptions = homeList.map((h) => ({
    value: h.nomor,
    label: `${h.nomor} - ${h.nama}`,
  }));

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
      const monthTwoDigit = selectedMonth.toString().padStart(2, "0");
      const monthToSearch = `${year}-${monthTwoDigit}`;

      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/rapel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret_key: "rahasiakita123",
            nomor_rumah: selectedHouse,
            nominal: parseInt(rapelNominal),
            bulan: monthToSearch,
          }),
        }
      );

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
            value={houseOptions.find(opt => opt.value === selectedHouse)}
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
          <select
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
          </select>
        </div>
      </div>
      <div className="text-center text-gray-600 mb-4">
        Bulan {months.find((m) => m.value === Number(selectedMonth)).label}{" "}
        terdapat {getDaysInMonth(selectedMonth, new Date().getFullYear())} hari
        (
        {rupiahFormat(
          getDaysInMonth(selectedMonth, new Date().getFullYear()) * 500
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
