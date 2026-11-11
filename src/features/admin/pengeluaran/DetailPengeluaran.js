import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import Button from "../../../shared/components/ui/Button";

export default function DetailPengeluaran({ pengeluaran, onEdit, onClose }) {
  if (!pengeluaran) return null;

  return (
    <div>
      <div className="border-b border-line pb-3 text-center sm:text-left">
        <h1 className="text-xl font-bold text-ink">Detail Pengeluaran</h1>
        <p className="mt-1 text-xs text-muted">
          Rincian informasi pencatatan kas keluar
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-line bg-surface/50 p-3.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Tanggal Pengeluaran
            </p>
            <p className="mt-1 font-bold text-ink text-base">
              {pengeluaran.tanggal.toString().split("T")[0]}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface/50 p-3.5">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">
              Nominal Pengeluaran
            </p>
            <p className="mt-1 font-bold text-red-600 text-lg">
              {rupiahFormat(pengeluaran.nominal)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface/50 p-3.5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Penanggung Jawab / Penerima
          </p>
          <p className="mt-1 font-bold text-ink">
            {pengeluaran.penanggung_jawab}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface/50 p-3.5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Keterangan
          </p>
          <p className="mt-1 font-medium whitespace-pre-wrap text-ink text-sm">
            {pengeluaran.keterangan || "-"}
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface/50 p-3.5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">
            Bukti Foto / Nota
          </p>
          {pengeluaran.bukti_foto ? (
            <a
              href={pengeluaran.bukti_foto}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-semibold text-accent hover:underline break-all text-sm"
            >
              {pengeluaran.bukti_foto} ↗
            </a>
          ) : (
            <p className="mt-1 font-medium text-muted text-sm">
              Tidak ada lampiran bukti
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          {onClose && (
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
          )}
          {onEdit && (
            <Button onClick={() => onEdit(pengeluaran)}>
              Edit Pengeluaran
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
