import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";

export default function DetailPengeluaran({ pengeluaran }) {
  if (!pengeluaran) return null;

  return (
    <div>
      <h1 className="text-lg font-bold text-ink">Detail Pengeluaran</h1>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm text-muted">Tanggal</p>
          <p className="font-semibold text-ink">
            {pengeluaran.tanggal.toString().split("T")[0]}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Nominal Pengeluaran</p>
          <p className="font-semibold text-ink">{rupiahFormat(pengeluaran.nominal)}</p>
        </div>

        <div>
          <p className="text-sm text-muted">Penanggung Jawab</p>
          <p className="font-semibold text-ink">{pengeluaran.penanggung_jawab}</p>
        </div>

        <div>
          <p className="text-sm text-muted">Keterangan</p>
          <p className="font-semibold whitespace-pre-wrap text-ink">
            {pengeluaran.keterangan || "-"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Bukti</p>
          {pengeluaran.bukti_foto ? (
            <a
              href={pengeluaran.bukti_foto}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-accent hover:underline break-all"
            >
              {pengeluaran.bukti_foto}
            </a>
          ) : (
            <p className="font-semibold text-ink">-</p>
          )}
        </div>
      </div>
    </div>
  );
}
