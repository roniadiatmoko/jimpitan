import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../config";
import RapelForm from "./RapelForm";
import SimpleModal from "../components/SimpleModal";
import DetailRapel from "./DetailRapel";
import { getDaysInMonth } from "../components/DateHelper";
import { rupiahFormat } from "../components/MoneyHeper";

export default function RapelList() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [rapelData, setRapelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalDetail, setOpenModalDetail] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedItem, setSelectedItem] = useState(null);

  const showRapelData = async () => {
    setLoading(true);
    //get api request here
    try {
      const monthTwoDigit = selectedMonth.toString().padStart(2, "0");
      const monthToSearch = `${year}-${monthTwoDigit}`;
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/rapel-bulanan/${monthToSearch}`,
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
      setRapelData(data.rapelBulanan);
      console.log(rapelData);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const kekurangan = (jumlahHariRapel) => {
    return getDaysInMonth(selectedMonth, year) - jumlahHariRapel;
  }

  useEffect(() => {
    showRapelData();
  }, [selectedMonth]);

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
            onChange={
              (e) => {
                setSelectedMonth(e.target.value);
              }
              
            }
          >
            {months.map((month) => {
              return (
                <option value={month.value} key={month.value}>
                  {month.label}
                </option>
              );
            })}
          </select>

          {/* <button
            className="pl-4 pr-4 pt-1 pb-1 rounded-xl bg-blue-500 text-white hover:bg-blue-700"
            onClick={showRapelData}
          >
            <span>Tampilkan</span>
          </button> */}
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
          <h2 className="font-bold text-4xl float-left text-blue-700">{months.find(m => m.value === Number(selectedMonth)).label} {year}</h2>
          <button
            className="p-4 mb-5 float-right rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setOpenModalAdd(true);
            }}
          >
            <span>+ Tambah Data Rapel</span>
          </button>

          {
            /* Modal Add Rapel */
            openModalAdd ? (
              <div className="bg-black bg-opacity-50 fixed top-0 left-0 w-full h-full z-40">
                <div className="fixed top-1/2 left-1/2 w-[90%] transform -translate-x-1/2 -translate-y-1/2 text-center bg-white rounded-lg p-5 z-50">
                  <h3 className="text-center bold mb-10">Tambah Data Rapel</h3>
                  <RapelForm />
                  <button
                    className="p-4 mb-5 float-right rounded-xl text-white font-bold bg-gray-600 hover:bg-blue-700"
                    onClick={() => {
                      setOpenModalAdd(false);
                    }}
                  >
                    <span>Tutup</span>
                  </button>
                </div>
              </div>
            ) : (
              ""
            )
          }

          <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 border">No</th>
                <th className="px-4 py-2 border">Nomor Rumah</th>
                <th className="px-4 py-2 border">Nama</th>
                <th className="px-4 py-2 border">Jumlah Hari Rapel</th>
                <th className="px-4 py-2 border">Aksi</th>
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
                      {item.nomor_rumah}
                    </td>
                    <td className="px-4 py-2 border">
                      {
                        homeList.find(
                          (h) => h.nomor === Number(item.nomor_rumah)
                        )?.nama
                      }
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {`${item.jumlah_rapel} dari ${getDaysInMonth(
                        selectedMonth,
                        year
                      )} `}

                      {getDaysInMonth(selectedMonth, year) ===
                      item.jumlah_rapel ? (
                        <span className="text-green-600 font-bold p-2 ml-2">
                          Lunas
                        </span>
                      ) : (
                        <span className="text-red-500 bg-red-300 rounded-full p-2 font-bold ml-2">
                          Kurang{" "}
                          {kekurangan(item.jumlah_rapel)}{" "}
                          Hari ( { rupiahFormat(kekurangan(item.jumlah_rapel) * 500)} )
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-1 border text-center">
                      <button
                        className="bg-blue-600 w-full text-white p-1 rounded-xl font-bold hover:bg-blue-700"
                        onClick={() => {
                          setSelectedItem(item);
                          setOpenModalDetail(true);
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {
                /* Modal Detail Rapel */
                openModalDetail && (
                  <SimpleModal
                    content={
                      <DetailRapel
                        nomorRumah={selectedItem.nomor_rumah}
                        year={year}
                        month={selectedMonth}
                      />
                    }
                    onClose={() => setOpenModalDetail(false)}
                  />
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
