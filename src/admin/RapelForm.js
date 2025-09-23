import { useState } from "react";
import Swal from "sweetalert2";

// Komponen terpisah untuk formulir Rapel Jimpitan
export default function RapelForm() {
  const [rapelHouseNumber, setRapelHouseNumber] = useState("");
  const [rapelNominal, setRapelNominal] = useState("");

  const handleRapelSubmit = async () => {
    if (!rapelHouseNumber || !rapelNominal) {
        Swal.fire("Perhatian", "Nomor rumah dan nominal harus diisi.", "warning");
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
        const response = await fetch(
          "https://ee548084-499f-43bb-b451-942060a81754-00-1dz8i3zxrf31f.pike.replit.dev/api/rapel",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              secret_key: "rahasiakita123",
              nomor_rumah: rapelHouseNumber,
              nominal: parseInt(rapelNominal)
            }),
          }
        );
        
        const result = await response.json();

        if (response.ok) {
            Swal.fire("Berhasil!", result.message, "success");
            setRapelHouseNumber("");
            setRapelNominal("");
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
      <h2 className="text-xl font-bold text-center text-yellow-800 mb-4">Formulir Rapel Jimpitan</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-gray-700">Nomor Rumah:</label>
          <input
            type="number"
            value={rapelHouseNumber}
            onChange={(e) => setRapelHouseNumber(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Contoh: 12"
          />
        </div>
        <div className="flex-1">
          <label className="block text-gray-700">Nominal:</label>
          <input
            type="number"
            value={rapelNominal}
            onChange={(e) => setRapelNominal(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Contoh: 7000"
          />
        </div>
      </div>
      <div className="text-center text-gray-600 mb-4">
        Rapel akan mengisi <span className="font-bold">{rapelNominal ? Math.floor(parseInt(rapelNominal) / 500) : 0}</span> hari jimpitan kosong.
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
