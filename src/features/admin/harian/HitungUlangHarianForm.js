import { useState } from "react";
import { ENDPOINT_BASE_URL } from "../../../shared/config";

export default function HitungULangHarianForm({ tanggal, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [nominal, setNominal] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    // Handle form submission
    if (!tanggal) {
      alert("Tanggal harus diisi");
      return;
    }

    if (nominal === "" || isNaN(Number(nominal))) {
      alert("Nominal harus diisi angka");
      return;
    }

    const nominalNum = Math.trunc(Number(nominal));
    if (nominalNum <= 0) {
      alert("Nominal harus lebih dari 0");
      return;
    }

    try {
      // Contoh panggil API (POST) ke endpoint-mu
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/jimpitan/hitung-ulang-harian/${tanggal}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominal: nominalNum }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Gagal menghitung ulang");
      }

      alert(
        `Data harian untuk tanggal ${tanggal} telah dihitung ulang dengan nominal ${nominalNum.toLocaleString(
          "id-ID"
        )}.`
      );
      setNominal("");
      onSuccess?.();
    } catch (e) {
      console.error(e);
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div>
      <h1 className="text-center text-xl font-bold text-teal-700">
        Hitung Ulang Harian
      </h1>
      <p className="text-center font-bold">Tanggal: {tanggal}</p>
      <div className="mt-4 text-center">
        <input
          type="number"
          placeholder="Nominal"
          className="bg-gray-200 rounded-md p-2 w-full"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          onKeyDown={onKeyDown}
          min={0}
        />
         {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}
        <button
          className="bg-teal-600 w-full mt-5 text-white font-bold px-4 py-2 rounded-full hover:bg-teal-800"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Menyimpan..." : "Simpan"}
        </button>
        
      </div>
    </div>
  );
}
