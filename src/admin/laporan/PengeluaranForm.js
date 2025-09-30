import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import DatePicker from "react-datepicker";
import { ENDPOINT_BASE_URL } from "../../config";
import Swal from "sweetalert2";

export default function PengeluaranForm({onSuccess}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [buktiFoto, setBuktiFoto] = useState(null);

  const handleSubmit = async () => {
    // Handle form submission
    if (!selectedDate || !nominal || !penanggungJawab || !keterangan) {
        Swal.fire("Isi semua Formulir!", '', "error");
      return;
    }


    try {
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/pengeluaran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: selectedDate, 
          nominal: nominal, 
          penanggung_jawab: penanggungJawab, 
          keterangan: keterangan, 
          bukti_foto: buktiFoto
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire("Berhasil disimpan!", 'Pengeluaran berhasil ditambahkan',  "success");
        onSuccess?.();
      } else {
        throw new Error(result.message || "Gagal mencatat pengeluaran");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal disimpan!", err.message, "error");
    }
  };

  return (
    <div className="m-8">
      <h1 className="text-center text-red-700 font-bold text-xl">
        Tambah Data Pengeluaran
      </h1>

      <div className="py-16">
        <p className="text-left">Tanggal</p>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          dateFormat="dd MMMM yyyy"
          wrapperClassName="w-full"
          className="bg-red-100 rounded-lg p-2 w-full"
        />

        <p className="text-left mt-5">Nominal</p>
        <CurrencyInput
          id="nominal"
          name="nominal"
          placeholder="Masukkan Nominal (Rp)"
          defaultValue={0}
          decimalsLimit={0}
          groupSeparator="."
          decimalSeparator=","
          prefix="Rp "
          className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 bg-red-100 focus:ring-blue-500 p-2"
          onValueChange={(value, name, values) => {
            setNominal(value);
          }}
        />

        <p className="text-left mt-5">Keterangan</p>
        <textarea
          id="keterangan"
          name="keterangan"
          rows={4}
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Tulis keterangan pengeluaran di sini..."
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 bg-red-100 focus:ring-blue-200 p-3 text-sm"
        />

        <p className="text-left mt-5">Penanggung Jawab/Diserahkan ke</p>
        <input
          id="penanggung_jawab"
          name="penanggung_jawab"
          value={penanggungJawab}
          onChange={(e) => setPenanggungJawab(e.target.value)}
          placeholder="Contoh: Budi (No. 10)"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 bg-red-100 focus:ring-blue-200 p-3 text-sm"
        />

        <p className="text-left mt-5">Bukti Opsional</p>
        <input
          id="bukti_foto"
          name="bukti_foto"
          value={buktiFoto}
          onChange={(e) => setBuktiFoto(e.target.value)}
          placeholder="Sementara berikan link hasil unggahan"
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 bg-red-100 focus:ring-blue-200 p-3 text-sm"
        />

        <button
          className="p-4 mt-10 float-right rounded-2xl w-full text-white font-bold bg-red-600 hover:bg-red-700"
          onClick={handleSubmit}
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
