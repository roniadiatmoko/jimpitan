import { useEffect, useMemo, useState } from "react";
import PengeluaranForm from "./PengeluaranForm";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";

export default function PengeluaranBulanan({ period }) {
  const [loading, setLoading] = useState(false);
  const [dataPengeluaran, setDataPengeluaran] = useState([]);
  const [openModalPengeluaran, setModalAddPengeluaran] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openModalHapus, setOpenModalHapus] = useState(false);

  const defaultPeriod =
    new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0");

  const currentPeriod = period || defaultPeriod;

  const showPengeluaran = async () => {
    setLoading(true);
    //get api request here
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/pengeluaran/${currentPeriod}`
      );
      const data = await res.json();

      setDataPengeluaran(data.pengeluaran);
      console.log(`${ENDPOINT_BASE_URL}/api/pengeluaran/${period}`);
      setModalAddPengeluaran(false);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const totalPengeluaran = useMemo(
    () => dataPengeluaran.reduce((a, b) => a + (b.nominal || 0), 0),
    [dataPengeluaran]
  );

  useEffect(() => {
    showPengeluaran();
  }, [period]);

  return (
    <div className="overflow-x-auto p-4">
      <button
        className="p-4 mb-5 float-right rounded-xl text-white font-bold bg-red-600 hover:bg-red-700"
        onClick={() => {
          setModalAddPengeluaran(true);
        }}
      >
        + Tambah Data Pengeluaran
      </button>

      {
        /* Modal Detail Rapel */
        openModalPengeluaran && (
          <SimpleModal
            content={<PengeluaranForm onSuccess={() => showPengeluaran()} />}
            onClose={() => setModalAddPengeluaran(false)}
          />
        )
      }

      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">Tanggal</th>
              <th className="px-4 py-2 border">Nominal Pengeluaran</th>
              <th className="px-4 py-2 border">Penanggung Jawab</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataPengeluaran.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  Belum ada data pengeluaran
                </td>
              </tr>
            ) : (
              dataPengeluaran.map((pengeluaran, index) => {
                return (
                  <tr key={pengeluaran.id}>
                    <td className="px-4 py-2 border text-center">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 border">
                      {pengeluaran.tanggal.toString().split("T")[0]}
                    </td>
                    <td className="px-4 py-2 border text-right">
                      {rupiahFormat(pengeluaran.nominal)}
                    </td>
                    <td className="px-4 py-2 border">
                      {pengeluaran.penanggung_jawab}
                    </td>
                    <td className="px-4 py-2 border">
                      <button
                        className="bg-red-600 w-full text-white p-1 rounded-xl font-bold hover:bg-blue-700"
                        onClick={() => {
                          setSelectedItem(pengeluaran);
                          setOpenModalHapus(true);
                        }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-red-100">
              <td colSpan={2} className="px-4 py-2 border text-center">
                Total{" "}
              </td>
              <td className="px-4 py-2 border text-right">
                {rupiahFormat(totalPengeluaran)}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
