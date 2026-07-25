import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";

export default function DetailPengeluaran({ pengeluaran }) {
  if (!pengeluaran) return null;

  return (
    <div className="m-4">
      <h1 className="text-2xl font-bold text-red-700">Detail Pengeluaran</h1>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-gray-500 text-sm">Tanggal</p>
          <p className="font-semibold">
            {pengeluaran.tanggal.toString().split("T")[0]}
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Nominal Pengeluaran</p>
          <p className="font-semibold">{rupiahFormat(pengeluaran.nominal)}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Penanggung Jawab</p>
          <p className="font-semibold">{pengeluaran.penanggung_jawab}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Keterangan</p>
          <p className="font-semibold whitespace-pre-wrap">
            {pengeluaran.keterangan || "-"}
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Bukti</p>
          {pengeluaran.bukti_foto ? (
            <a
              href={pengeluaran.bukti_foto}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-blue-600 hover:underline break-all"
            >
              {pengeluaran.bukti_foto}
            </a>
          ) : (
            <p className="font-semibold">-</p>
          )}
        </div>
      </div>
    </div>
  );
}
