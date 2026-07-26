import { format } from "date-fns";
import { getDatesinMonth } from "../../../shared/helpers/DateHelper";
import { fi, id } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Badge from "../../../shared/components/ui/Badge";
import Spinner from "../../../shared/components/ui/Spinner";
import HitungULangHarianForm from "./HitungUlangHarianForm";
import Swal from "sweetalert2";

export default function DetailNominalHitungUlangHarian({ period }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [year, month] = period.split("-").map(Number);
  const datesInMonth = useMemo(() => getDatesinMonth(month, year), [period]);
  const [openModalEdit, setOpenModalEdit] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [selectedNominalHarian, setSelectedNominalHarian] = useState(0);
  const [selectedNominalHitungUlang, setSelectedNominalHitungUlang] =
    useState(0);
  const [balanceFilter, setBalanceFilter] = useState("all"); // all | Balance | Surplus | Defisit | Belum Dihitung Ulang
  const [copySuccessBelum, setCopySuccessBelum] = useState("");
  const [copySuccessDefisit, setCopySuccessDefisit] = useState("");

  const filteredRows = useMemo(() => {
    if (balanceFilter === "all") return rows;
    return rows.filter((r) => r.balance === balanceFilter);
  }, [rows, balanceFilter]);

  const belumDihitungUlangText = useMemo(() => {
    return filteredRows
      .filter((row) => row.balance === "Belum Dihitung Ulang")
      .map((row) => format(row.tanggal, "EEEE, dd MMM yyyy", { locale: id }))
      .join("\n");
  }, [filteredRows]);

  const defisitText = useMemo(() => {
    return filteredRows
      .filter((row) => row.balance === "Defisit")
      .map((row) => format(row.tanggal, "EEEE, dd MMM yyyy", { locale: id }))
      .join("\n");
  }, [filteredRows]);

  const copyToClipboard = async (text, type) => {
    if (!navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      if (type === "belum") {
        setCopySuccessBelum("Disalin ke clipboard");
        window.setTimeout(() => setCopySuccessBelum(""), 2000);
      } else if (type === "defisit") {
        setCopySuccessDefisit("Disalin ke clipboard");
        window.setTimeout(() => setCopySuccessDefisit(""), 2000);
      }
    } catch (error) {
      if (type === "belum") {
        setCopySuccessBelum("Gagal menyalin");
        window.setTimeout(() => setCopySuccessBelum(""), 2000);
      } else if (type === "defisit") {
        setCopySuccessDefisit("Gagal menyalin");
        window.setTimeout(() => setCopySuccessDefisit(""), 2000);
      }
    }
  };

  const copyBelumDihitungUlang = () => copyToClipboard(belumDihitungUlangText, "belum");
  const copyDefisit = () => copyToClipboard(defisitText, "defisit");
  const [sendingTanggal, setSendingTanggal] = useState(null);

  const handleSendWaGroup = async (tanggal) => {
    const confirm = await Swal.fire({
      title: "Kirim ke WA Grup?",
      text: `Kirim laporan jimpitan tanggal ${tanggal} ke grup WA?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, kirim",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) {
      return;
    }

    setSendingTanggal(tanggal);
    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/resend-laporan-jimpitan/${tanggal}`
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim laporan WA");
      }
      Swal.fire("Berhasil", result.message || "Laporan sudah dikirim ke WA Grup.", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", err.message || "Gagal mengirim laporan WA.", "error");
    } finally {
      setSendingTanggal(null);
    }
  };

  const summaryCounts = useMemo(() => {
    const counts = {
      sudahDihitung: 0,
      belumDihitungUlang: 0,
      Balance: 0,
      Surplus: 0,
      Defisit: 0,
      totalNominalHarian: 0,
      totalNominalHitungUlang: 0,
      pctSudahDihitung: 0,
      pctBelumDihitungUlang: 0,
      pctBalance: 0,
      pctSurplus: 0,
      pctDefisit: 0,
    };

    const totalDays = datesInMonth.length;

    for (const row of filteredRows) {
      if (row.balance === "Belum Dihitung Ulang") {
        counts.belumDihitungUlang += 1;
      } else {
        counts.sudahDihitung += 1;
      }

      if (row.balance === "Balance") counts.Balance += 1;
      if (row.balance === "Surplus") counts.Surplus += 1;
      if (row.balance === "Defisit") counts.Defisit += 1;

      counts.totalNominalHarian += row.nominalHarian || 0;
      counts.totalNominalHitungUlang += row.nominalHitungUlang || 0;
    }

    if (totalDays > 0) {
      counts.pctSudahDihitung = (counts.sudahDihitung / totalDays) * 100;
      counts.pctBelumDihitungUlang = (counts.belumDihitungUlang / totalDays) * 100;
      counts.pctBalance = (counts.Balance / totalDays) * 100;
      counts.pctSurplus = (counts.Surplus / totalDays) * 100;
      counts.pctDefisit = (counts.Defisit / totalDays) * 100;
    }

    return counts;
  }, [filteredRows, datesInMonth]);

  async function withConcurrency(tasks, limit = 6) {
    const ret = [];
    let i = 0;

    async function worker() {
      while (i < tasks.length) {
        const idx = i++;
        ret[idx] = await tasks[idx]();
      }
    }

    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
      worker()
    );
    await Promise.all(workers);
    return ret;
  }

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError("");
      try {
        const tasks = datesInMonth.map((date) => async () => {
          const [harianResponse, hitungUlangResponse] =
            await Promise.allSettled([
              fetch(
                `${ENDPOINT_BASE_URL}/api/laporan/${format(date, "yyyy-MM-dd")}`
              ),
              fetch(
                `${ENDPOINT_BASE_URL}/api/jimpitan/hitung-ulang-harian/${format(
                  date,
                  "yyyy-MM-dd"
                )}`
              ),
            ]);

          let nominalHarian = 0;
          if (
            harianResponse.status === "fulfilled" &&
            harianResponse.value.ok
          ) {
            const data = await harianResponse.value.json();

            nominalHarian = data ? data.data.totalUang || 0 : 0;
          }

          let nominalHitungUlang = 0;
          if (
            hitungUlangResponse.status === "fulfilled" &&
            hitungUlangResponse.value.ok
          ) {
            const data = await hitungUlangResponse.value.json();

            nominalHitungUlang = data?.data.total_harian || 0;
          }

          let statusBalance =
            nominalHitungUlang === 0
              ? "Belum Dihitung Ulang"
              : nominalHarian === nominalHitungUlang
              ? "Balance"
              : nominalHarian < nominalHitungUlang
              ? "Surplus"
              : "Defisit";

          return {
            tanggal: date,
            nominalHarian,
            nominalHitungUlang,
            balance: statusBalance,
            selisih: nominalHitungUlang - nominalHarian,
          };
        });

        const result = await withConcurrency(tasks, 6);

        result.sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1));
        setRows(result);
      } catch (err) {
        setError("Gagal mengambil data");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [period, reloadFlag]);

  return (
    <div>
      {loading && <Spinner />}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            SUDAH DIHITUNG
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {summaryCounts.sudahDihitung}
          </div>
          <div className="text-sm text-emerald-700">
            {summaryCounts.pctSudahDihitung.toFixed(1)}% dari {datesInMonth.length} hari
          </div>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              BELUM DIHITUNG ULANG
            </div>
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={copyBelumDihitungUlang}
            >
              Copy Hari
            </Button>
          </div>
          <div className="text-3xl font-bold text-amber-900">
            {summaryCounts.belumDihitungUlang}
          </div>
          <div className="text-sm text-amber-700">
            {summaryCounts.pctBelumDihitungUlang.toFixed(1)}% dari {datesInMonth.length} hari
          </div>
          {copySuccessBelum && (
            <div className="mt-2 text-sm text-amber-800">{copySuccessBelum}</div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            TOTAL NOMINAL
          </div>
          <div className="text-sm text-ink">
            Nominal Petugas Ronda: Rp {summaryCounts.totalNominalHarian.toLocaleString("id-ID")}
          </div>
          <div className="text-sm text-ink">
            Nominal Hitung Ulang: Rp {summaryCounts.totalNominalHitungUlang.toLocaleString("id-ID")}
          </div>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            SURPLUS
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {summaryCounts.Surplus}
          </div>
          <div className="text-sm text-emerald-700">
            {summaryCounts.pctSurplus.toFixed(1)}% dari {datesInMonth.length} hari
          </div>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-700">
              DEFISIT
            </div>
            <Button
              variant="secondary"
              className="!px-2 !py-1 text-xs"
              onClick={copyDefisit}
            >
              Copy Hari
            </Button>
          </div>
          <div className="text-3xl font-bold text-red-900">
            {summaryCounts.Defisit}
          </div>
          <div className="text-sm text-red-700">
            {summaryCounts.pctDefisit.toFixed(1)}% dari {datesInMonth.length} hari
          </div>
          {copySuccessDefisit && (
            <div className="mt-2 text-sm text-red-800">{copySuccessDefisit}</div>
          )}
        </Card>
        <Card className="bg-accent-soft border-accent/20">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">
            BALANCE
          </div>
          <div className="text-3xl font-bold text-accent">
            {summaryCounts.Balance}
          </div>
          <div className="text-sm text-accent">
            {summaryCounts.pctBalance.toFixed(1)}% dari {datesInMonth.length} hari
          </div>
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-ink">Filter Balance:</label>
        <select
          className="rounded-lg border border-line px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          value={balanceFilter}
          onChange={(e) => setBalanceFilter(e.target.value)}
        >
          <option value="all">Semua</option>
          <option value="Balance">Balance</option>
          <option value="Surplus">Surplus</option>
          <option value="Defisit">Defisit</option>
          <option value="Belum Dihitung Ulang">Belum Dihitung Ulang</option>
        </select>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nominal Petugas Ronda</th>
                <th className="px-4 py-3">Nominal Hitung Ulang</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Selisih</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Kirim WA ke Grup</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, index) => {
                return (
                  <tr key={index} className="border-t border-line odd:bg-white even:bg-surface">
                    <td className="px-4 py-2">
                      {format(r.tanggal, "EEEE, dd MMM yyyy", { locale: id })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      Rp {r.nominalHarian.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      Rp {r.nominalHitungUlang.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Badge
                        tone={
                          r.balance === "Balance"
                            ? "success"
                            : r.balance === "Surplus"
                            ? "info"
                            : r.balance === "Belum Dihitung Ulang"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {r.balance}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      Rp {r.selisih.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          setOpenModalEdit(true);
                          setSelectedDate(
                            format(r.tanggal, "yyyy-MM-dd", { locale: id })
                          );
                          setSelectedNominalHarian(r.nominalHarian);
                          setSelectedNominalHitungUlang(r.nominalHitungUlang);
                        }}
                      >
                        Update
                      </Button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        className="w-full !text-xs"
                        disabled={
                          sendingTanggal === format(r.tanggal, "yyyy-MM-dd") ||
                          r.nominalHarian === 0
                        }
                        onClick={() =>
                          handleSendWaGroup(format(r.tanggal, "yyyy-MM-dd"))
                        }
                      >
                        {sendingTanggal === format(r.tanggal, "yyyy-MM-dd")
                          ? "Mengirim..."
                          : "Kirim ke WAGRUP"}
                      </Button>
                    </td>
                  </tr>
                );
              })}

              <tr className="border-t border-line bg-surface font-semibold">
                <td className="px-4 py-2 text-right">Total</td>
                <td className="px-4 py-2 text-right">
                  Rp{" "}
                  {filteredRows
                    .reduce((a, b) => a + (b.nominalHarian || 0), 0)
                    .toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-2 text-right">
                  Rp{" "}
                  {filteredRows
                    .reduce((a, b) => a + (b.nominalHitungUlang || 0), 0)
                    .toLocaleString("id-ID")}
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {
        /* Modal Add Rapel */
        openModalEdit ? (
          <SimpleModal
            content={
              <HitungULangHarianForm
                tanggal={selectedDate}
                nominalHarian={selectedNominalHarian}
                nominalHitungUlang={selectedNominalHitungUlang}
                onSuccess={() => {
                  setOpenModalEdit(false);
                  setReloadFlag((x) => x + 1);
                }}
              />
            }
            onClose={() => setOpenModalEdit(false)}
          />
        ) : (
          ""
        )
      }
    </div>
  );
}
