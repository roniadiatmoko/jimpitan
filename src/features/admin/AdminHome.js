import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ENDPOINT_BASE_URL, months } from "../../shared/config";
import { rupiahFormat } from "../../shared/helpers/MoneyHeper";
import Card from "../../shared/components/ui/Card";
import StatTile from "../../shared/components/ui/StatTile";
import MonthlyBarChart from "../../shared/components/charts/MonthlyBarChart";
import {
  IconRapel,
  IconHitungUlang,
  IconPengeluaran,
  IconLaporan,
  IconRekap,
  IconKekurangan,
  IconWarga,
  IconKalender,
} from "../../shared/components/icons";

const pad2 = (n) => String(n).padStart(2, "0");

const shortcuts = [
  {
    to: "rapel-list",
    label: "Daftar Rapel",
    desc: "Lihat dan kelola tunggakan jimpitan warga.",
    icon: IconRapel,
  },
  {
    to: "detail-harian",
    label: "Hitung Ulang Harian",
    desc: "Koreksi setoran jimpitan harian per rumah.",
    icon: IconHitungUlang,
  },
  {
    to: "pengeluaran",
    label: "Pengeluaran",
    desc: "Catat dan tinjau pengeluaran kas warga.",
    icon: IconPengeluaran,
  },
  {
    to: "laporan-bulanan",
    label: "Rekap Bulanan",
    desc: "Ringkasan pemasukan dan saldo tiap bulan.",
    icon: IconLaporan,
  },
  {
    to: "daftar-rekap",
    label: "Daftar Rekap",
    desc: "Riwayat rekap saldo yang sudah dibuat.",
    icon: IconRekap,
  },
  {
    to: "kekurangan-bayar",
    label: "Kekurangan Bayar",
    desc: "Pantau rumah dengan kekurangan pembayaran.",
    icon: IconKekurangan,
  },
  {
    to: "list-warga",
    label: "Data Warga",
    desc: "Kelola daftar rumah dan penghuni.",
    icon: IconWarga,
  },
  {
    to: "tanggal-putih",
    label: "Tanggal Putih",
    desc: "Atur tanggal yang dibebaskan dari jimpitan.",
    icon: IconKalender,
  },
];

export default function AdminHome() {
  const fullname = localStorage.getItem("fullname") || "Petugas";
  const today = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });
  const activeYear = new Date().getFullYear();

  const [rekapRows, setRekapRows] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchRekapTahun = async () => {
      setLoadingRekap(true);
      try {
        const results = await Promise.all(
          months.map(async (m) => {
            try {
              const res = await fetch(
                `${ENDPOINT_BASE_URL}/api/rekap/${activeYear}/${pad2(m.value)}`
              );
              const json = await res.json();
              return {
                bulan: m.value,
                label: m.label.slice(0, 3),
                pemasukan: json.data?.pemasukan || 0,
                pengeluaran: json.data?.pengeluaran || 0,
                sisa_saldo: json.data?.sisa_saldo || 0,
              };
            } catch (err) {
              return {
                bulan: m.value,
                label: m.label.slice(0, 3),
                pemasukan: 0,
                pengeluaran: 0,
                sisa_saldo: 0,
              };
            }
          })
        );
        if (!cancelled) setRekapRows(results);
      } finally {
        if (!cancelled) setLoadingRekap(false);
      }
    };

    fetchRekapTahun();
    return () => {
      cancelled = true;
    };
  }, [activeYear]);

  const totalPendapatan = useMemo(
    () => rekapRows.reduce((a, b) => a + (b.pemasukan || 0), 0),
    [rekapRows]
  );
  const totalPengeluaran = useMemo(
    () => rekapRows.reduce((a, b) => a + (b.pengeluaran || 0), 0),
    [rekapRows]
  );
  const sisaSaldo = useMemo(() => {
    const latestWithData = [...rekapRows]
      .reverse()
      .find((r) => r.pemasukan || r.pengeluaran || r.sisa_saldo);
    return latestWithData?.sisa_saldo ?? 0;
  }, [rekapRows]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Selamat datang kembali,</p>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {fullname}
          </h1>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </div>

      <h2 className="mb-4 text-base font-semibold text-ink">
        Ringkasan Tahun {activeYear}
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Pendapatan Tahun Ini"
          value={loadingRekap ? "…" : rupiahFormat(totalPendapatan)}
        />
        <StatTile
          label="Pengeluaran Tahun Ini"
          value={loadingRekap ? "…" : rupiahFormat(totalPengeluaran)}
        />
        <StatTile
          label="Sisa Saldo"
          value={loadingRekap ? "…" : rupiahFormat(sisaSaldo)}
          tone="accent"
        />
      </div>

      <Card className="mb-8">
        <h2 className="mb-1 text-base font-semibold text-ink">
          Pendapatan &amp; Pengeluaran per Bulan
        </h2>
        <p className="mb-4 text-sm text-muted">
          Tahun {activeYear}, berdasarkan data rekap yang tersimpan.
        </p>
        {loadingRekap ? (
          <div className="py-10 text-center text-sm text-muted">
            Memuat grafik...
          </div>
        ) : (
          <MonthlyBarChart
            data={rekapRows}
            seriesAKey="pemasukan"
            seriesBKey="pengeluaran"
            seriesALabel="Pendapatan"
            seriesBLabel="Pengeluaran"
          />
        )}
      </Card>

      <h2 className="mb-4 text-base font-semibold text-ink">Menu Cepat</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-xl border border-line bg-white p-5 transition hover:border-accent/40 hover:shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon />
            </div>
            <div className="text-base font-semibold text-ink">{label}</div>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
