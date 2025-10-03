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
  const [selectedNominalHitungUlang, setSelectedNominalHitungUlang] = useState(0);

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
              : nominalHarian > nominalHitungUlang
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
          {rows.map((r, index) => {
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
                      setSelectedDate(format(r.tanggal, "yyyy-MM-dd", { locale: id }));
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
              {rows
                .reduce((a, b) => a + (b.nominalHarian || 0), 0)
                .toLocaleString("id-ID")}
            </td>
            <td className="border p-2 text-right">
              Rp{" "}
              {rows
                .reduce((a, b) => a + (b.nominalHitungUlang || 0), 0)
                .toLocaleString("id-ID")}
            </td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
      </table>

      {
        /* Modal Add Rapel */
        openModalEdit ? (
          <SimpleModal
            content={
              <HitungULangHarianForm
                tanggal={selectedDate}
                nominalHarian = {selectedNominalHarian}
                nominalHitungUlang = {selectedNominalHitungUlang}
                onSuccess={() => {
                  setOpenModalEdit(false);
                  setReloadFlag(x => x + 1);
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
