import { useState } from "react";
import { months } from "../config";

export default function RapelList() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [rapelData, setRapelData] = useState([]);
  const [loading, setLoading] = useState(false);

  const showRapelData = () => {
    setLoading(true);
    //get api request here

    setTimeout(() => {
      alert(selectedMonth);
      setLoading(false);
    }, 5000);
  };

  return (
    <div className="m-8">
      <div className=" bg-blue-50 p-4 rounded-xl">
        <h1 className="text-2xl text-center font-bold text-blue-900">
          Daftar Rapel
        </h1>
        <br />
        <span className="text-gray-600">Pilih Bulan</span>
        <div className="flex flex-row justify-stretch gap-5">
          <select
            className="w-[50%] p-4 mb-2 rounded-lg bg-white"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {months.map((month) => {
              return (
                <option value={month.value} key={month.value}>
                  {month.label}
                </option>
              );
            })}
          </select>

          <button
            className="pl-4 pr-4 pt-1 pb-1 rounded-xl bg-blue-400 text-white hover:bg-blue-500"
            onClick={showRapelData}
          >
            <span>Tampilkan</span>
          </button>
        </div>
      </div>
      <div className="mt-1 bg-blue-50 p-4 rounded-xl">
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
          ""
        )}

        {/* data rapel */}
        <div className="overflow-x-auto p-4">
          <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 border">No</th>
                <th className="px-4 py-2 border">Nomor Rumah</th>
                <th className="px-4 py-2 border">Nama</th>
                <th className="px-4 py-2 border">Jumlah Hari Rapel</th>
              </tr>
            </thead>
            <tbody>
              {rapelData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-gray-500">
                    Belum ada data rapel
                  </td>
                </tr>
              ) : (
                rapelData.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="px-4 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {item.nomorRumah}
                    </td>
                    <td className="px-4 py-2 border">{item.nama}</td>
                    <td className="px-4 py-2 border text-center">
                      {item.jumlahHari}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
