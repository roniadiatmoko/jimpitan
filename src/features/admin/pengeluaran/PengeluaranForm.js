import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import DatePicker from "react-datepicker";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Button from "../../../shared/components/ui/Button";
import Swal from "sweetalert2";

export default function PengeluaranForm({
  onSuccess,
  initialData = null,
  onCancel,
  onClose,
}) {
  const isEdit = Boolean(initialData);

  const [selectedDate, setSelectedDate] = useState(() => {
    if (!initialData?.tanggal) return new Date();
    const d = new Date(initialData.tanggal);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  const [nominal, setNominal] = useState(
    initialData?.nominal !== undefined && initialData?.nominal !== null
      ? String(initialData.nominal)
      : ""
  );
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");
  const [penanggungJawab, setPenanggungJawab] = useState(
    initialData?.penanggung_jawab || ""
  );
  const [buktiFoto, setBuktiFoto] = useState(initialData?.bukti_foto || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !selectedDate ||
      !nominal ||
      Number(nominal) <= 0 ||
      !penanggungJawab.trim() ||
      !keterangan.trim()
    ) {
      Swal.fire(
        "Lengkapi Formulir!",
        "Tanggal, nominal (harus lebih dari 0), penanggung jawab, dan keterangan wajib diisi.",
        "warning"
      );
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `${ENDPOINT_BASE_URL}/api/pengeluaran/${initialData.id}`
        : `${ENDPOINT_BASE_URL}/api/pengeluaran`;
      const method = isEdit ? "PUT" : "POST";

      const formattedDate =
        selectedDate instanceof Date
          ? selectedDate.toISOString()
          : new Date(selectedDate).toISOString();

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal: formattedDate,
          nominal: String(nominal),
          penanggung_jawab: penanggungJawab.trim(),
          keterangan: keterangan.trim(),
          bukti_foto: buktiFoto ? buktiFoto.trim() : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire(
          "Berhasil!",
          isEdit
            ? "Data pengeluaran berhasil diperbarui"
            : "Pengeluaran berhasil ditambahkan",
          "success"
        );
        onSuccess?.();
      } else {
        throw new Error(result.message || "Gagal menyimpan pengeluaran");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal disimpan!", err.message || "Terjadi kesalahan.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 block w-full rounded-lg border border-line p-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  const handleClose = onCancel || onClose;

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-ink">
          {isEdit ? "Edit Data Pengeluaran" : "Tambah Data Pengeluaran"}
        </h1>
        <p className="mt-1 text-xs text-muted">
          {isEdit
            ? "Perbarui rincian data pengeluaran kas jimpitan"
            : "Catat pengeluaran kas jimpitan secara transparan"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-left text-xs font-semibold text-muted block mb-1">
              Tanggal Pengeluaran <span className="text-red-500">*</span>
            </label>
            <DatePicker
              customInput={
                <input
                  inputMode="none"
                  onKeyDown={(e) => e.preventDefault()}
                  autoComplete="off"
                />
              }
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="dd MMMM yyyy"
              wrapperClassName="w-full"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-left text-xs font-semibold text-muted block mb-1">
              Nominal Pengeluaran <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              id="nominal"
              name="nominal"
              placeholder="Contoh: 50.000"
              value={nominal}
              decimalsLimit={0}
              groupSeparator="."
              decimalSeparator=","
              prefix="Rp "
              className={inputClass}
              onValueChange={(value) => {
                setNominal(value || "");
              }}
            />
          </div>
        </div>

        <div>
          <label className="text-left text-xs font-semibold text-muted block mb-1">
            Penanggung Jawab / Diserahkan Kepada <span className="text-red-500">*</span>
          </label>
          <input
            id="penanggung_jawab"
            name="penanggung_jawab"
            value={penanggungJawab}
            onChange={(e) => setPenanggungJawab(e.target.value)}
            placeholder="Contoh: Anwar (No. 53)"
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-left text-xs font-semibold text-muted block mb-1">
            Keterangan Pengeluaran <span className="text-red-500">*</span>
          </label>
          <textarea
            id="keterangan"
            name="keterangan"
            rows={3}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Tulis keterangan peruntukan pengeluaran di sini..."
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-left text-xs font-semibold text-muted block mb-1">
            Bukti Foto / Nota (Opsional)
          </label>
          <input
            id="bukti_foto"
            name="bukti_foto"
            value={buktiFoto}
            onChange={(e) => setBuktiFoto(e.target.value)}
            placeholder="Link foto/nota (contoh: https://...)"
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-line">
          {handleClose && (
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={submitting}
            >
              Batal
            </Button>
          )}
          <Button
            type="button"
            className="flex-1"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan Pengeluaran"}
          </Button>
        </div>
      </div>
    </div>
  );
}
