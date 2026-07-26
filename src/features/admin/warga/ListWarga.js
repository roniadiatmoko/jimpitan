import { format } from "date-fns";
import { homeList } from "../../../shared/config";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Badge from "../../../shared/components/ui/Badge";

export default function ListWarga() {
  const [statusFilter, setStatusFilter] = useState("all"); // all | menghuni | belum
  const navigate = useNavigate();

  const sudahMenghuni = homeList.filter((h) => h.sudah_menghuni === 1).length;
  const belumMenghuni = homeList.filter((h) => h.sudah_menghuni === 0).length;

  const homeMap = useMemo(() => {
    const map = {};
    for (const h of homeList) map[Number(h.nomor)] = h;
    return map;
  }, [homeList]);

  const homeListSorted = useMemo(() => {
    if (statusFilter === "all") return homeList;
    return homeList.filter((item) => {
      const homeData = homeMap[Number(item.nomor)];
      if (!homeData) return false;
      const isMenghuni = homeData.sudah_menghuni === 1;
      return statusFilter === "menghuni" ? isMenghuni : !isMenghuni;
    });
  }, [homeMap, statusFilter, homeList]);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink mb-5">
          Daftar Warga (Static Data)
        </h1>

        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center mb-5">
          <Button onClick={() => navigate("/admin/ref-warga")}>
            Detail Database Warga
          </Button>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-center">
              <span className="font-semibold text-emerald-700">
                Sudah Menghuni <br />
                <span className="text-5xl font-bold text-emerald-900">{sudahMenghuni}</span>
              </span>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 w-full text-center">
              <span className="font-semibold text-red-700">
                Belum Menghuni <br />
                <span className="text-5xl font-bold text-red-900">{belumMenghuni}</span>
              </span>
            </div>
          </div>
        </div>

        <label className="mb-1 block text-xs font-medium text-muted">Filter Status:</label>
        <select
          className="rounded-lg border border-line px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Semua</option>
          <option value="menghuni">Menghuni</option>
          <option value="belum">Belum Dihuni</option>
        </select>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Nomor Rumah</th>
                <th className="px-4 py-3">Penghuni</th>
                <th className="px-4 py-3">Status Kepenghunian</th>
                <th className="px-4 py-3">Terhitung Mulai</th>
              </tr>
            </thead>
            <tbody>
              {homeListSorted.map((h, index) => {
                return (
                  <tr key={h.nomor} className="border-t border-line odd:bg-white even:bg-surface">
                    <td className="px-4 py-2 text-center text-muted">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 text-center">{h.nomor}</td>
                    <td className="px-4 py-2">{h.nama}</td>
                    <td className="px-4 py-2 text-center">
                      <Badge tone={h.sudah_menghuni === 1 ? "success" : "danger"}>
                        {h.sudah_menghuni === 1 ? "Menghuni" : "Belum"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {h.tanggal_huni !== "0000-00-00"
                        ? format(new Date(h.tanggal_huni), "dd MMMM yyyy")
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
