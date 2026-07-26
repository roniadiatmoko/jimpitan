import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import { getDaysInMonth } from "../../../shared/helpers/DateHelper";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Badge from "../../../shared/components/ui/Badge";
import Spinner from "../../../shared/components/ui/Spinner";
import RapelForm from "./RapelForm";
import DetailRapel from "./DetailRapel";
import DatePicker from "react-datepicker";

export default function RapelList() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [rapelData, setRapelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalDetail, setOpenModalDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const showRapelData = async () => {
    setLoading(true);
    //get api request here
    try {
      const monthToSearch = selectedMonth.getFullYear() + "-" + (selectedMonth.getMonth() + 1).toString().padStart(2, "0");
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
      // console.log(rapelData);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const kekurangan = (jumlahHariRapel) => {
    return getDaysInMonth((selectedMonth.getMonth() + 1).toString().padStart(2, "0"), selectedMonth.getFullYear()) - jumlahHariRapel;
  }

  useEffect(() => {
    showRapelData();
  }, [selectedMonth]);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">Daftar Rapel</h1>
        <label className="mt-4 mb-1 block text-xs font-medium text-muted">
          Pilih Bulan
        </label>
        <DatePicker
          selected={selectedMonth}
          onChange={(date) => setSelectedMonth(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker // hanya bulan & tahun
          wrapperClassName="w-full sm:w-64"
          className="w-full rounded-lg border border-line p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </Card>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-lg font-bold text-ink">
            {months.find(m => m.value === Number((selectedMonth.getMonth() + 1).toString().padStart(2, "0"))).label} {selectedMonth.getFullYear()}
          </h2>
          <Button onClick={() => setOpenModalAdd(true)}>
            + Tambah Data Rapel
          </Button>
        </div>

        {
          /* Modal Add Rapel */
          openModalAdd ? (
            <div className="fixed top-0 left-0 z-40 h-full w-full bg-black/50">
              <div className="fixed top-1/2 left-1/2 w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
                <RapelForm
                  onSuccess={() => showRapelData()}
                  initialPeriod={`${selectedMonth.getFullYear()}-${(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}`}
                />
                <Button
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => setOpenModalAdd(false)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          ) : (
            ""
          )
        }

        {loading && <Spinner label="Melihat data..." />}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nomor Rumah</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Jumlah Hari Rapel</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rapelData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    Belum ada data rapel
                  </td>
                </tr>
              ) : (
                rapelData.map((item, index) => (
                  <tr key={index} className="border-t border-line odd:bg-white even:bg-surface">
                    <td className="px-4 py-3 text-center">{index + 1}</td>
                    <td className="px-4 py-3 text-center">
                      {item.nomor_rumah}
                    </td>
                    <td className="px-4 py-3">
                      {
                        homeList.find(
                          (h) => h.nomor === Number(item.nomor_rumah)
                        )?.nama
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {`${item.jumlah_rapel} dari ${getDaysInMonth(
                        (selectedMonth.getMonth() + 1).toString().padStart(2, "0"),
                        selectedMonth.getFullYear()
                      )} `}

                      {getDaysInMonth((selectedMonth.getMonth() + 1).toString().padStart(2, "0"), selectedMonth.getFullYear()) ===
                      item.jumlah_rapel ? (
                        <Badge tone="success" className="ml-2">
                          Lunas
                        </Badge>
                      ) : (
                        <Badge tone="danger" className="ml-2">
                          Kurang {kekurangan(item.jumlah_rapel)} Hari (
                          {rupiahFormat(kekurangan(item.jumlah_rapel) * 500)})
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setSelectedItem(item);
                          setOpenModalDetail(true);
                        }}
                      >
                        Detail
                      </Button>
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
                        year={selectedMonth.getFullYear()}
                        month={(selectedMonth.getMonth() + 1).toString().padStart(2, "0")}
                      />
                    }
                    onClose={() => setOpenModalDetail(false)}
                  />
                )
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
