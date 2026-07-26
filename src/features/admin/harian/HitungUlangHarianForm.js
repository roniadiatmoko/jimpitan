import { useState } from "react";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Button from "../../../shared/components/ui/Button";
import Swal from "sweetalert2";

export default function HitungULangHarianForm({
  tanggal,
  nominalHarian,
  nominalHitungUlang,
  onSuccess,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [nominal, setNominal] = useState(nominalHarian || "");
  const [valNominalHitungUlang, setValNominalHitungUlang] = useState(
    nominalHitungUlang || "",
  );
  const [isSamaPetugasRonda, setIsSamaPetugasRonda] = useState(false);
  const [error, setError] = useState("");

  // Mengubah angka murni menjadi format Rupiah (contoh: 10000 -> 10.000)
  const formatRupiah = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  // Mengubah format Rupiah menjadi angka murni (contoh: 10.000 -> 10000)
  const unformatRupiah = (value) => {
    return value.replace(/\D/g, ""); // Menghapus semua karakter selain angka
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsSamaPetugasRonda(checked);

    if (checked) {
      // Set nilai input nominal mengikuti nominalHarian
      setValNominalHitungUlang(nominalHarian);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    // Handle form submission
    if (!tanggal) {
      alert("Tanggal harus diisi");
      return;
    }

    if (valNominalHitungUlang === "" || isNaN(Number(valNominalHitungUlang))) {
      alert("Nominal harus diisi angka");
      return;
    }

    const nominalNum = Math.trunc(Number(valNominalHitungUlang));
    // if (nominalNum <= 0) {
    //   alert("Nominal harus lebih dari 0");
    //   return;
    // }

    try {
      // Contoh panggil API (POST) ke endpoint-mu
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/jimpitan/hitung-ulang-harian/${tanggal}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominal: nominalNum }),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Gagal menghitung ulang");
      }

      Swal.fire(
        "Berhasil!",
        `Data harian untuk tanggal ${tanggal} telah dihitung ulang dengan nominal ${nominalNum.toLocaleString(
          "id-ID",
        )}.`,
        "success",
      );
      setValNominalHitungUlang("");
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
      <h1 className="text-center text-lg font-bold text-ink">
        Hitung Ulang Harian
      </h1>
      <p className="mt-2 text-center text-sm font-semibold text-ink">Tanggal: {tanggal}</p>
      <p className="text-center text-sm text-muted">
        Nominal Petugas Ronda:{" "}
        <b className="text-ink">Rp {nominalHarian.toLocaleString("id-ID")}</b>
      </p>
      <div className="mt-4 text-center">
        <label className="flex cursor-pointer items-center justify-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            checked={isSamaPetugasRonda}
            onChange={handleCheckboxChange}
          />
          <span>Isikan sama dengan nominal petugas ronda</span>
        </label>
        <input
          type="text"
          placeholder="Nominal"
          className="mt-3 w-full rounded-lg border border-line p-2.5 text-center text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          value={formatRupiah(valNominalHitungUlang)}
          onChange={(e) => {
            setError("");
            const rawValue = unformatRupiah(e.target.value);
            setValNominalHitungUlang(rawValue);
          }}
          onKeyDown={onKeyDown}
          min={0}
        />
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        <Button
          className="mt-5 w-full"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
