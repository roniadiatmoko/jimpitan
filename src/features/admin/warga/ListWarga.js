import { format } from "date-fns";
import { homeList } from "../../../shared/config";
import { useMemo, useState } from "react";

export default function ListWarga() {
  const [statusFilter, setStatusFilter] = useState("all"); // all | menghuni | belum

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
    <div className="m-4 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-sky-700 mb-10">
        Daftar Warga
      </h1>

      <div className="flex justify-between mb-5 gap-4">
        <div className="bg-green-300 rounded-lg p-4 w-full text-center">
          <span className="font-bold text-green-700">
            Sudah Menghuni <br />
            <h1 className="text-7xl">{sudahMenghuni} </h1>
          </span>
        </div>
        <div className="bg-red-300 rounded-lg p-4 w-full text-center">
          <span className="font-bold text-red-700 ml-6">
            Belum Menghuni <br /> <h1 className="text-7xl">{belumMenghuni}</h1>
          </span>
        </div>
      </div>

      <label className="text-sm font-medium">Filter Status:</label>
      <select
        className="border rounded px-3 py-2"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">Semua</option>
        <option value="menghuni">Menghuni</option>
        <option value="belum">Belum Dihuni</option>
      </select>

      <div className="overflow-x-auto">
        <table className="w-full mt-2 border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-sky-600 text-white">
            <tr>
              <th className="px-4 py-2 border w-10">#</th>
              <th className="px-4 py-2 border">Nomor Rumah</th>
              <th className="px-4 py-2 border">Penghuni</th>
              <th className="px-4 py-2 border">Status Kepenghunian</th>
              <th className="px-4 py-2 border">Terhitung Mulai</th>
            </tr>
          </thead>
          <tbody>
            {homeListSorted.map((h, index) => {
              return (
                <tr>
                  <td className="px-4 py-2 border text-center bg-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2 border text-center">{h.nomor}</td>
                  <td className="px-4 py-2 border">{h.nama}</td>
                  <td className="px-4 py-2 border">
                    <span
                      className={
                        h.sudah_menghuni === 1
                          ? "bg-green-300 text-green-700 block text-center p-2 text-sm rounded-full font-bold"
                          : "bg-red-300 text-red-700 p-2 block text-center text-sm rounded-full font-bold"
                      }
                    >
                      {h.sudah_menghuni === 1 ? "Menghuni" : "Belum"}
                    </span>
                  </td>
                  <td className="px-4 py-2 border">
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
    </div>
  );
}
