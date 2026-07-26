import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import { getDatesinMonth, getDaysInMonth } from "../../../shared/helpers/DateHelper";
import { format } from "date-fns";
import Spinner from "../../../shared/components/ui/Spinner";

export default function DetailRapel({ nomorRumah, year, month }) {
  const [tanggalRapel, setTanggalRapel] = useState([]);
  const [loading, setLoading] = useState(true);

  const daysInMonth = () => {
    const monthTwoDigit = month.toString().padStart(2, "0");
    const monthToSearch = `${year}-${monthTwoDigit}`;
    return getDaysInMonth(month, year);
  };

  const monthFilter = () => {
    const monthTwoDigit = month.toString().padStart(2, "0");
    const monthToSearch = `${year}-${monthTwoDigit}`;

    return monthToSearch;
  };

  const getTanggalRapel = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/detail-rapel-per-rumah/${nomorRumah}/${monthFilter()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      const data = await res.json();
      setTanggalRapel(data.tanggalRapel);
      console.log("tanggalrapel", data);
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
  };

  useEffect(() => {
    getTanggalRapel();
  }, []);

  return (
    <div>
      <h1 className="text-lg font-bold text-ink">Detail Rapel</h1>
      <p className="text-sm font-medium text-muted">
        Rumah No. {nomorRumah} -{" "}
        {homeList.find((home) => home.nomor === Number(nomorRumah)).nama}
      </p>
      <p className="mb-4 text-sm font-medium text-muted">
        {months.find((m) => m.value === Number(month)).label} {year}
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Rapel</th>
              </tr>
            </thead>
            <tbody>
              {getDatesinMonth(month, year).map((date) => (
                <tr key={date.toString()} className="border-t border-line odd:bg-white even:bg-surface">
                  <td className="px-4 py-2 text-center">
                    {format(date, "dd MMMM yyyy")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {tanggalRapel.includes(format(date, "yyyy-MM-dd"))
                      ? "✅ Rapel"
                      : "❌ Tidak Rapel"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
