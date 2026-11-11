import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import { getDatesinMonth } from "../../../shared/helpers/DateHelper";
import { format } from "date-fns";
import Spinner from "../../../shared/components/ui/Spinner";

export default function DetailRapel({ nomorRumah, namaWarga, year, month }) {
  const [tanggalRapel, setTanggalRapel] = useState([]);
  const [wargaList, setWargaList] = useState(homeList);
  const [loading, setLoading] = useState(true);

  // Ambil ref-warga jika nama belum dioper via props
  useEffect(() => {
    if (namaWarga) return;

    const fetchRefWarga = async () => {
      try {
        const res = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "OK" && Array.isArray(json.data) && json.data.length > 0) {
            setWargaList(json.data);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat ref-warga di DetailRapel:", err);
      }
    };
    fetchRefWarga();
  }, [namaWarga]);

  const monthFilter = () => {
    const monthTwoDigit = month.toString().padStart(2, "0");
    return `${year}-${monthTwoDigit}`;
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
      setTanggalRapel(data.tanggalRapel || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTanggalRapel();
  }, [nomorRumah, year, month]);

  const nama =
    namaWarga ||
    wargaList.find((home) => Number(home.nomor) === Number(nomorRumah))?.nama ||
    "";

  return (
    <div>
      <h1 className="text-lg font-bold text-ink">Detail Rapel</h1>
      <p className="text-sm font-medium text-muted">
        Rumah No. {nomorRumah}{nama ? ` — ${nama}` : ""}
      </p>
      <p className="mb-4 text-sm font-medium text-muted">
        {months.find((m) => m.value === Number(month))?.label} {year}
      </p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status Rapel</th>
              </tr>
            </thead>
            <tbody>
              {getDatesinMonth(Number(month), Number(year)).map((date) => (
                <tr
                  key={date.toString()}
                  className="border-t border-line odd:bg-white even:bg-surface"
                >
                  <td className="px-4 py-2 text-center">
                    {format(date, "dd MMMM yyyy")}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {tanggalRapel.includes(format(date, "yyyy-MM-dd")) ? (
                      <span className="font-semibold text-emerald-600">
                        ✅ Terisi Rapel
                      </span>
                    ) : (
                      <span className="text-muted">
                        -
                      </span>
                    )}
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
