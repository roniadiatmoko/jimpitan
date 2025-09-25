import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../config";
import { getDatesinMonth, getDaysInMonth } from "../components/DateHelper";
import { format } from "date-fns";

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
    <div className="m-8">
      <h1 className="text-2xl font-bold">Detail Rapel </h1>
      <h2 className="text-green-500">
        <b>
          Rumah No. {nomorRumah} -{" "}
          {homeList.find((home) => home.nomor === Number(nomorRumah)).nama}
        </b>
      </h2>
      <h2 className="text-green-500">
        <b>
          {months.find((m) => m.value === Number(month)).label} {year}
        </b>
      </h2>

      <div className="mt-5 rounded-xl bg-green-50 w-full h-full">
        {loading ? (
          <div className="flex justify-center">
            <div
              className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full"
              role="status"
              aria-label="loading"
            >
              <span className="sr-only">Melihat Data...</span>
            </div>
            &nbsp; Melihat Data...
          </div>
        ) : (
          <table className="w-full border border-slate-300 border-collapse  text-lg font-semibold">
            <thead>
              <tr>
                <th className="p-2 border border-slate-300">Tanggal</th>
                <th className="p-2 border border-slate-300">Rapel</th>
              </tr>
            </thead>
            <tbody>
              {getDatesinMonth(month, year).map((date) => (
                <tr key={date.toString()}>
                  <td className="p-2 text-center border border-slate-300">
                    {format(date, "dd MMMM yyyy")}
                  </td>
                  <td className="p-2 text-center border border-slate-300">
                    {tanggalRapel.includes(format(date, "yyyy-MM-dd"))
                      ? "✅ Rapel"
                      : "❌ Tidak Rapel"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
