import React, { useState, useEffect } from "react";
import { rupiahFormat, terbilang } from "../../../shared/helpers/MoneyHeper";
import Button from "../../../shared/components/ui/Button";
import { ENDPOINT_BASE_URL } from "../../../shared/config";

function formatTanggalIndo(dateStr) {
  if (!dateStr) return "-";
  try {
    const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [y, m, d] = raw.split("-");
    if (y && m && d) {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
      ];
      const monthIdx = parseInt(m, 10) - 1;
      return `${parseInt(d, 10)} ${monthNames[monthIdx] || m} ${y}`;
    }
    return raw;
  } catch {
    return dateStr;
  }
}

export default function CetakLaporanTutupBuku({
  year,
  rows = [],
  totalPemasukan = 0,
  totalPengeluaran = 0,
  onClose,
}) {
  const currentYearNum = new Date().getFullYear();
  const isPastYear = Number(year) < currentYearNum;

  // Tanggal default tutup buku
  const defaultTanggalDokumen = isPastYear
    ? `31 Desember ${year}`
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());

  const [namaOrganisasi, setNamaOrganisasi] = useState("PAGUYUBAN WARGA GBK TEMPEL 2");
  const [alamatSekretariat, setAlamatSekretariat] = useState(
    "Sekretariat: Perumahan Griya Bhina Karya (GBK) Tempel 2, Gatak, Sukoharjo, Jawa Tengah"
  );
  const [lokasi, setLokasi] = useState("Sukoharjo");
  const [tanggalDokumen, setTanggalDokumen] = useState(defaultTanggalDokumen);
  const [namaKetua, setNamaKetua] = useState("Ketua Paguyuban");
  const [namaBendahara, setNamaBendahara] = useState("Bendahara Jimpitan");
  const [catatanTambahan, setCatatanTambahan] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Data Pengeluaran Rinci
  const [listPengeluaran, setListPengeluaran] = useState([]);
  const [loadingPengeluaran, setLoadingPengeluaran] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingPengeluaran(true);
    fetch(`${ENDPOINT_BASE_URL}/api/pengeluaran/${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setListPengeluaran(data.pengeluaran || []);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data pengeluaran tahunan:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingPengeluaran(false);
      });

    return () => {
      isMounted = false;
    };
  }, [year]);

  // Perhitungan Keuangan
  const saldoAwalTahun = rows[0]?.saldo_sebelumnya || 0;
  const surplusDefisit = totalPemasukan - totalPengeluaran;
  const saldoAkhirTahun = saldoAwalTahun + surplusDefisit;

  const totalPengeluaranDaftar = listPengeluaran.reduce(
    (acc, curr) => acc + (Number(curr.nominal) || 0),
    0
  );

  const handlePrint = () => {
    window.print();
  };

  const waktuCetak = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="relative">
      {/* STYLE KHUSUS PRINT */}
      <style>{`
        @media print {
          /* Sembunyikan elemen aplikasi luar */
          body * {
            visibility: hidden;
          }

          /* Tampilkan khusus kontainer laporan tutup buku */
          #printable-tutup-buku,
          #printable-tutup-buku * {
            visibility: visible;
          }

          #printable-tutup-buku {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }

          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .signature-section {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* PANEL KONTROL ATAS (HANYA DITAMPILKAN DI LAYAR, NO-PRINT) */}
      <div className="no-print mb-6 rounded-xl border border-line bg-surface/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-ink flex items-center gap-2">
              <span>📄</span> Pratinjau Laporan Keuangan Tutup Buku {year}
            </h2>
            <p className="text-xs text-muted">
              Format resmi laporan pertanggungjawaban tutup buku kas tahunan lengkap dengan daftar pengeluaran.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="text-xs !py-2 !px-3"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? "Sembunyikan Pengaturan" : "⚙️ Sesuaikan Kop / Pejabat / TTD"}
            </Button>
            <Button
              type="button"
              className="text-xs !py-2 !px-4 flex items-center gap-1.5"
              onClick={handlePrint}
            >
              <span>🖨️</span> Cetak / Simpan PDF
            </Button>
            {onClose && (
              <Button
                type="button"
                variant="secondary"
                className="text-xs !py-2 !px-3"
                onClick={onClose}
              >
                Tutup
              </Button>
            )}
          </div>
        </div>

        {/* Form Penyesuaian Nama Pejabat & Tanggal (Collapsible) */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-1">
              <label className="block font-medium text-muted mb-1">
                Nama Paguyuban / Kop Surat
              </label>
              <input
                type="text"
                value={namaOrganisasi}
                onChange={(e) => setNamaOrganisasi(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="PAGUYUBAN WARGA GBK TEMPEL 2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-muted mb-1">
                Alamat Sekretariat (Kop Surat)
              </label>
              <input
                type="text"
                value={alamatSekretariat}
                onChange={(e) => setAlamatSekretariat(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Contoh: Sekretariat: Perumahan Griya Bhina Karya (GBK) Tempel 2, Gatak, Sukoharjo"
              />
            </div>
            <div>
              <label className="block font-medium text-muted mb-1">
                Kota / Lokasi Pengesahan
              </label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Contoh: Sukoharjo"
              />
            </div>
            <div>
              <label className="block font-medium text-muted mb-1">
                Tanggal Dokumen
              </label>
              <input
                type="text"
                value={tanggalDokumen}
                onChange={(e) => setTanggalDokumen(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Contoh: 31 Desember 2026"
              />
            </div>
            <div>
              <label className="block font-medium text-muted mb-1">
                Nama / Jabatan Ketua
              </label>
              <input
                type="text"
                value={namaKetua}
                onChange={(e) => setNamaKetua(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Nama Ketua Paguyuban"
              />
            </div>
            <div>
              <label className="block font-medium text-muted mb-1">
                Nama / Jabatan Bendahara
              </label>
              <input
                type="text"
                value={namaBendahara}
                onChange={(e) => setNamaBendahara(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Nama Bendahara"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-muted mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={catatanTambahan}
                onChange={(e) => setCatatanTambahan(e.target.value)}
                className="w-full rounded-lg border border-line p-2 text-ink"
                placeholder="Catatan tambahan di akhir laporan"
              />
            </div>
          </div>
        )}
      </div>

      {/* DOKUMEN FISIK LAPORAN TUTUP BUKU (AREA YANG AKAN TERTAMPIL DI KERTAS CETAK) */}
      <div
        id="printable-tutup-buku"
        className="bg-white p-6 sm:p-10 rounded-xl border border-line shadow-sm text-black font-sans leading-relaxed text-sm"
      >
        {/* KOP SURAT FORMAL */}
        <div className="text-center pb-4 border-b-2 border-black">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-lg bg-black text-white flex items-center justify-center font-bold text-lg tracking-wider">
              GBK
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-wide uppercase text-black">
                {namaOrganisasi}
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                PENGELOLA DANA KAS JIMPITAN &amp; SOSIAL LINGKUNGAN
              </p>
            </div>
          </div>
          <p className="text-[11px] text-gray-600">
            {alamatSekretariat}
          </p>
          <div className="mt-2 border-t border-black border-dashed"></div>
        </div>

        {/* JUDUL LAPORAN */}
        <div className="text-center my-5">
          <h2 className="text-base font-extrabold uppercase underline tracking-wide text-black">
            LAPORAN KEUANGAN &amp; PERTANGGUNGJAWABAN TUTUP BUKU
          </h2>
          <p className="text-xs font-bold uppercase mt-1 text-gray-800">
            TAHUN BUKU {year} (1 JANUARI {year} – 31 DESEMBER {year})
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Nomor Dokumen: LK-TB/{year}/GBK-T2
          </p>
        </div>

        {/* BAGIAN I: IKHTISAR NERACA TUTUP BUKU (EXECUTIVE SUMMARY) */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black bg-gray-100 p-2 border-l-4 border-black mb-3">
            I. IKHTISAR KAS &amp; POSISI TUTUP BUKU
          </h3>

          <div className="border border-black rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-2.5 font-semibold text-gray-700 w-7/12">
                    A. Saldo Kas Awal Tahun (per 1 Januari {year})
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-black">
                    {rupiahFormat(saldoAwalTahun)}
                  </td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50/50">
                  <td className="p-2.5 font-semibold text-gray-700">
                    B. Total Penerimaan / Pemasukan Kas Tahun {year}
                    <div className="text-[10px] text-gray-500 font-normal">
                      (Penerimaan jimpitan harian ronda malam dan pelunasan rapel warga)
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                    {rupiahFormat(totalPemasukan)}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2.5 font-semibold text-gray-700">
                    C. Total Realisasi Pengeluaran Kas Tahun {year}
                    <div className="text-[10px] text-gray-500 font-normal">
                      (Belanja sosial warga, ronda, lampu penerangan &amp; operasional lingkungan)
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-red-800">
                    ({rupiahFormat(totalPengeluaran)})
                  </td>
                </tr>
                <tr className="border-b border-black bg-gray-100 font-bold">
                  <td className="p-2.5 text-gray-900">
                    D. Arus Kas Bersih Tahun {year} ({surplusDefisit >= 0 ? "Surplus" : "Defisit"})
                  </td>
                  <td className={`p-2.5 text-right font-mono ${surplusDefisit >= 0 ? "text-emerald-900" : "text-red-900"}`}>
                    {surplusDefisit >= 0 ? "+" : "-"} {rupiahFormat(Math.abs(surplusDefisit))}
                  </td>
                </tr>
                <tr className="bg-amber-50/60 font-black text-sm">
                  <td className="p-3 text-black">
                    E. SALDO KAS AKHIR TUTUP BUKU (per 31 Desember {year})
                  </td>
                  <td className="p-3 text-right font-mono text-base text-black">
                    {rupiahFormat(saldoAkhirTahun)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TERBILANG NOMINAL TUTUP BUKU */}
          <div className="mt-2.5 p-2.5 bg-gray-50 border border-dashed border-gray-400 rounded-lg text-xs">
            <span className="font-bold text-gray-700">Terbilang: </span>
            <span className="italic font-medium text-black">
              "{terbilang(saldoAkhirTahun)}"
            </span>
          </div>
        </div>

        {/* BAGIAN II: REKAPITULASI ARUS KAS BULANAN */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black bg-gray-100 p-2 border-l-4 border-black mb-3">
            II. REKAPITULASI MUTASI KAS BULANAN (12 BULAN)
          </h3>

          <div className="border border-black rounded-lg overflow-hidden">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-200 border-b border-black text-center font-bold text-black uppercase">
                  <th className="p-2 border-r border-gray-300 w-8">No</th>
                  <th className="p-2 border-r border-gray-300 text-left">Bulan</th>
                  <th className="p-2 border-r border-gray-300 text-right">Saldo Awal</th>
                  <th className="p-2 border-r border-gray-300 text-right">Pemasukan</th>
                  <th className="p-2 border-r border-gray-300 text-right">Pengeluaran</th>
                  <th className="p-2 border-r border-gray-300 text-right">Mutasi (+/-)</th>
                  <th className="p-2 text-right">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const mutasi = (Number(row.pemasukan) || 0) - (Number(row.pengeluaran) || 0);
                  const isOdd = idx % 2 === 1;
                  return (
                    <tr
                      key={row.bulan}
                      className={`border-b border-gray-300 ${isOdd ? "bg-gray-50/70" : "bg-white"}`}
                    >
                      <td className="p-1.5 border-r border-gray-300 text-center font-medium">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border-r border-gray-300 font-semibold text-gray-900">
                        {row.label}
                      </td>
                      <td className="p-1.5 border-r border-gray-300 text-right font-mono">
                        {rupiahFormat(row.saldo_sebelumnya)}
                      </td>
                      <td className="p-1.5 border-r border-gray-300 text-right font-mono text-emerald-800">
                        {rupiahFormat(row.pemasukan)}
                      </td>
                      <td className="p-1.5 border-r border-gray-300 text-right font-mono text-red-800">
                        {rupiahFormat(row.pengeluaran)}
                      </td>
                      <td className={`p-1.5 border-r border-gray-300 text-right font-mono font-medium ${mutasi >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {mutasi >= 0 ? "+" : ""}{rupiahFormat(mutasi)}
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-black">
                        {rupiahFormat(row.sisa_saldo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-200 border-t-2 border-black font-bold text-black">
                  <td colSpan={3} className="p-2 border-r border-gray-400 text-center uppercase tracking-wide">
                    Total Tahun {year}
                  </td>
                  <td className="p-2 border-r border-gray-400 text-right font-mono text-emerald-900">
                    {rupiahFormat(totalPemasukan)}
                  </td>
                  <td className="p-2 border-r border-gray-400 text-right font-mono text-red-900">
                    {rupiahFormat(totalPengeluaran)}
                  </td>
                  <td className={`p-2 border-r border-gray-400 text-right font-mono ${surplusDefisit >= 0 ? "text-emerald-900" : "text-red-900"}`}>
                    {surplusDefisit >= 0 ? "+" : ""}{rupiahFormat(surplusDefisit)}
                  </td>
                  <td className="p-2 text-right font-mono font-black text-black">
                    {rupiahFormat(saldoAkhirTahun)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* BAGIAN III: RINCIAN REALISASI PENGELUARAN KAS */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-black bg-gray-100 p-2 border-l-4 border-black mb-3 flex items-center justify-between">
            <span>III. RINCIAN REALISASI PENGELUARAN KAS TAHUN {year}</span>
            <span className="text-[10px] font-normal lowercase text-gray-600">
              ({listPengeluaran.length} transaksi)
            </span>
          </h3>

          {loadingPengeluaran ? (
            <div className="p-4 text-center text-xs text-gray-500 border border-gray-300 rounded-lg">
              Memuat data rincian pengeluaran kas...
            </div>
          ) : listPengeluaran.length === 0 ? (
            <div className="p-4 text-center text-xs italic text-gray-500 border border-gray-300 rounded-lg">
              Tidak ada catatan transaksi pengeluaran kas pada tahun {year}.
            </div>
          ) : (
            <div className="border border-black rounded-lg overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-200 border-b border-black text-center font-bold text-black uppercase">
                    <th className="p-2 border-r border-gray-300 w-8">No</th>
                    <th className="p-2 border-r border-gray-300 text-center w-24">Tanggal</th>
                    <th className="p-2 border-r border-gray-300 text-left">Uraian / Keperluan Pengeluaran</th>
                    <th className="p-2 border-r border-gray-300 text-left w-36">Penanggung Jawab</th>
                    <th className="p-2 text-right w-28">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {listPengeluaran.map((item, idx) => {
                    const isOdd = idx % 2 === 1;
                    const nominalVal = Number(item.nominal) || 0;
                    return (
                      <tr
                        key={item.id || idx}
                        className={`border-b border-gray-300 ${isOdd ? "bg-gray-50/70" : "bg-white"}`}
                      >
                        <td className="p-1.5 border-r border-gray-300 text-center font-medium">
                          {idx + 1}
                        </td>
                        <td className="p-1.5 border-r border-gray-300 text-center whitespace-nowrap text-gray-800">
                          {formatTanggalIndo(item.tanggal)}
                        </td>
                        <td className="p-1.5 border-r border-gray-300 font-medium text-gray-900 whitespace-pre-line">
                          {item.keterangan || "-"}
                        </td>
                        <td className="p-1.5 border-r border-gray-300 text-gray-700 whitespace-nowrap">
                          {item.penanggung_jawab || "-"}
                        </td>
                        <td className="p-1.5 text-right font-mono font-medium text-red-800 whitespace-nowrap">
                          {rupiahFormat(nominalVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-200 border-t-2 border-black font-bold text-black">
                    <td colSpan={4} className="p-2 border-r border-gray-400 text-center uppercase tracking-wide">
                      Total Realisasi Pengeluaran Kas Tahun {year}
                    </td>
                    <td className="p-2 text-right font-mono font-black text-red-900 whitespace-nowrap">
                      {rupiahFormat(totalPengeluaranDaftar)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* BAGIAN IV: CATATAN ATAS LAPORAN KEUANGAN (CALK) */}
        <div className="mb-6 p-3 bg-gray-50 border border-gray-300 rounded-lg text-xs leading-normal">
          <h4 className="font-bold text-black uppercase mb-1.5">
            IV. Catatan Rekonsiliasi &amp; Ketetapan Tutup Buku:
          </h4>
          <ol className="list-decimal pl-4 space-y-1 text-gray-700">
            <li>
              Buku Kas Jimpitan untuk Tahun Anggaran <b>{year}</b> secara resmi dinyatakan <b>DITUTUP</b>.
            </li>
            <li>
              Saldo akhir per 31 Desember {year} sebesar{" "}
              <b>{rupiahFormat(saldoAkhirTahun)}</b> ({terbilang(saldoAkhirTahun)}) secara resmi dialihkan dan ditetapkan sebagai{" "}
              <b>Saldo Awal Tahun Anggaran {Number(year) + 1}</b>.
            </li>
            <li>
              Seluruh rekapitulasi data pemasukan dan {listPengeluaran.length} item rincian pengeluaran kas telah disinkronkan dan diaudit silang dengan sistem pencatatan jimpitan harian serta bukti pengeluaran kas.
            </li>
            {catatanTambahan && (
              <li className="font-medium text-black">
                {catatanTambahan}
              </li>
            )}
          </ol>
        </div>

        {/* BAGIAN V: LEMBAR PENGESAHAN (TANDA TANGAN RESMI) */}
        <div className="signature-section mt-8 pt-4">
          <div className="text-right text-xs mb-4 text-gray-800">
            {lokasi}, {tanggalDokumen}
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs max-w-2xl mx-auto">
            {/* Kolom 1: Ketua Paguyuban */}
            <div className="flex flex-col justify-between h-32">
              <div>
                <p className="font-semibold text-gray-700">Mengetahui / Menyetujui,</p>
                <p className="font-bold text-black uppercase">Ketua Paguyuban GBK</p>
              </div>
              <div>
                <p className="border-b border-black w-44 mx-auto"></p>
                <p className="font-bold text-black mt-1">{namaKetua}</p>
              </div>
            </div>

            {/* Kolom 2: Bendahara */}
            <div className="flex flex-col justify-between h-32">
              <div>
                <p className="font-semibold text-gray-700">Dibuat &amp; Ditutup oleh,</p>
                <p className="font-bold text-black uppercase">Bendahara Jimpitan</p>
              </div>
              <div>
                <p className="border-b border-black w-44 mx-auto"></p>
                <p className="font-bold text-black mt-1">{namaBendahara}</p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER INFORMASI SISTEM */}
        <div className="mt-8 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
          Laporan Keuangan &amp; Tutup Buku Digital • Sistem Informasi Jimpitan Paguyuban GBK Tempel 2 • Dicetak: {waktuCetak}
        </div>
      </div>
    </div>
  );
}
