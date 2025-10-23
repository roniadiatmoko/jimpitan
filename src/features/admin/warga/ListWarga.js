import { homeList } from "../../../shared/config";

export default function ListWarga() {
  const sudahMenghuni = homeList.filter((h) => h.sudah_menghuni === 1).length;
  const belumMenghuni = homeList.filter((h) => h.sudah_menghuni === 0).length;

  return (
    <div className="m-8 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-sky-700 mb-10">
        Daftar Warga
      </h1>

      <div className="flex justify-between mb-5 gap-4">
        <div className="bg-green-300 rounded-lg p-4 w-full text-center">
          <span className="font-bold text-green-700">
            Sudah Menghuni <br/><h1 className="text-7xl">{sudahMenghuni}{" "}</h1>
          </span>
        </div>
        <div className="bg-red-300 rounded-lg p-4 w-full text-center">
          <span className="font-bold text-red-700 ml-6">
            Belum Menghuni <br/> <h1 className="text-7xl">{belumMenghuni}</h1>
          </span>
        </div>
      </div>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-sky-600 text-white">
          <tr>
            <th className="px-4 py-2 border">Nomor Rumah</th>
            <th className="px-4 py-2 border">Penghuni</th>
            <th className="px-4 py-2 border">Status Kepenghunian</th>
          </tr>
        </thead>
        <tbody>
          {homeList.map((h, index) => {
            return (
              <tr>
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
                    {h.sudah_menghuni === 1
                      ? "Sudah Menghuni"
                      : "Belum Menghuni"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
