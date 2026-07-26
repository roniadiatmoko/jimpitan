import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import DatePicker from "react-datepicker";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Button from "../../../shared/components/ui/Button";
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

  const inputClass =
    "mt-1 block w-full rounded-lg border border-line p-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div>
      <h1 className="text-center text-lg font-bold text-ink">
        Tambah Data Pengeluaran
      </h1>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-left text-xs font-medium text-muted">Tanggal</p>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="dd MMMM yyyy"
            wrapperClassName="w-full"
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-left text-xs font-medium text-muted">Nominal</p>
          <CurrencyInput
            id="nominal"
            name="nominal"
            placeholder="Masukkan Nominal (Rp)"
            defaultValue={0}
            decimalsLimit={0}
            groupSeparator="."
            decimalSeparator=","
            prefix="Rp "
            className={inputClass}
            onValueChange={(value, name, values) => {
              setNominal(value);
            }}
          />
        </div>

        <div>
          <p className="text-left text-xs font-medium text-muted">Keterangan</p>
          <textarea
            id="keterangan"
            name="keterangan"
            rows={4}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Tulis keterangan pengeluaran di sini..."
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-left text-xs font-medium text-muted">
            Penanggung Jawab/Diserahkan ke
          </p>
          <input
            id="penanggung_jawab"
            name="penanggung_jawab"
            value={penanggungJawab}
            onChange={(e) => setPenanggungJawab(e.target.value)}
            placeholder="Contoh: Budi (No. 10)"
            className={inputClass}
          />
        </div>

        <div>
          <p className="text-left text-xs font-medium text-muted">Bukti Opsional</p>
          <input
            id="bukti_foto"
            name="bukti_foto"
            value={buktiFoto}
            onChange={(e) => setBuktiFoto(e.target.value)}
            placeholder="Sementara berikan link hasil unggahan"
            className={inputClass}
          />
        </div>

        <Button className="w-full" onClick={handleSubmit}>
          Simpan
        </Button>
      </div>
    </div>
  );
}
