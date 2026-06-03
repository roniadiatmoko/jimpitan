import { format } from "date-fns";
import { getDatesinMonth } from "../../../shared/helpers/DateHelper";
import { fi, id } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import HitungULangHarianForm from "./HitungUlangHarianForm";

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
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        ""
      )}
      <div className="mb-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-emerald-100 rounded-xl border border-emerald-200 p-4 shadow-sm">
            <div className="text-sm uppercase tracking-wide text-emerald-700">
              SUDAH DIHITUNG
            </div>
            <div className="text-3xl font-bold text-emerald-900">
              {summaryCounts.sudahDihitung}
            </div>
            <div className="text-sm text-emerald-700">
              {summaryCounts.pctSudahDihitung.toFixed(1)}% dari {datesInMonth.length} hari
            </div>
          </div>
          <div className="bg-orange-100 rounded-xl border border-orange-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-wide text-orange-700">
                BELUM DIHITUNG ULANG
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-2 py-1 text-xs font-semibold text-white hover:bg-orange-700"
                onClick={copyBelumDihitungUlang}
              >
                Copy Hari
              </button>
            </div>
            <div className="text-3xl font-bold text-orange-900">
              {summaryCounts.belumDihitungUlang}
            </div>
            <div className="text-sm text-orange-700">
              {summaryCounts.pctBelumDihitungUlang.toFixed(1)}% dari {datesInMonth.length} hari
            </div>
            {copySuccessBelum && (
              <div className="mt-2 text-sm text-orange-800">{copySuccessBelum}</div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-sm uppercase tracking-wide text-gray-500">
              TOTAL NOMINAL
            </div>
            <div className="text-base text-slate-700">
              Nominal Petugas Ronda: Rp {summaryCounts.totalNominalHarian.toLocaleString("id-ID")}
            </div>
            <div className="text-base text-slate-700">
              Nominal Hitung Ulang: Rp {summaryCounts.totalNominalHitungUlang.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="bg-emerald-100 rounded-xl border border-emerald-200 p-4 shadow-sm">
            <div className="text-sm uppercase tracking-wide text-emerald-700">
              SURPLUS
            </div>
            <div className="text-3xl font-bold text-emerald-900">
              {summaryCounts.Surplus}
            </div>
            <div className="text-sm text-emerald-700">
              {summaryCounts.pctSurplus.toFixed(1)}% dari {datesInMonth.length} hari
            </div>
          </div>
          <div className="bg-red-100 rounded-xl border border-red-200 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-wide text-red-700">
                DEFISIT
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                onClick={copyDefisit}
              >
                Copy Hari
              </button>
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
          </div>
          <div className="bg-sky-100 rounded-xl border border-sky-200 p-4 shadow-sm">
            <div className="text-sm uppercase tracking-wide text-sky-700">
              BALANCE
            </div>
            <div className="text-3xl font-bold text-sky-900">
              {summaryCounts.Balance}
            </div>
            <div className="text-sm text-sky-700">
              {summaryCounts.pctBalance.toFixed(1)}% dari {datesInMonth.length} hari
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Filter Balance:</label>
          <select
            className="border rounded px-3 py-2"
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
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-4 py-2 border">Tanggal</th>
              <th className="px-4 py-2 border">Nominal Petugas Ronda</th>
              <th className="px-4 py-2 border">Nominal Hitung Ulang</th>
              <th className="px-4 py-2 border">Balance</th>
              <th className="px-4 py-2 border">Selisih</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, index) => {
              return (
                <tr key={index}>
                  <td className="px-4 py-2 border">
                    {format(r.tanggal, "EEEE, dd MMM yyyy", { locale: id })}
                  </td>
                  <td className="px-4 py-2 border text-right">
                    Rp {r.nominalHarian.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 border text-right">
                    Rp {r.nominalHitungUlang.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <span
                      className={
                        r.balance === "Balance"
                          ? "bg-green-300 text-green-600 font-bold text-sm py-2 px-2 rounded-full"
                          : r.balance === "Surplus"
                          ? "bg-blue-300 text-blue-600 font-bold py-2 px-2 rounded-full"
                          : "bg-red-300 text-red-600 font-bold text-sm py-2 px-2 rounded-full"
                      }
                    >
                      {r.balance}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-right">
                    Rp {r.selisih.toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      className="bg-orange-600 w-full text-white p-1 rounded-xl font-bold hover:bg-orange-700"
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
                    </button>
                  </td>
                </tr>
              );
            })}

            <tr className="font-semibold bg-gray-50">
              <td className="border p-2 text-right">Total</td>
              <td className="border p-2 text-right">
                Rp{" "}
                {filteredRows
                  .reduce((a, b) => a + (b.nominalHarian || 0), 0)
                  .toLocaleString("id-ID")}
              </td>
              <td className="border p-2 text-right">
                Rp{" "}
                {filteredRows
                  .reduce((a, b) => a + (b.nominalHitungUlang || 0), 0)
                  .toLocaleString("id-ID")}
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
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
