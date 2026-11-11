import { useEffect, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import { getDaysInMonth } from "../../../shared/helpers/DateHelper";
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
  const [wargaList, setWargaList] = useState(homeList);
  const [loading, setLoading] = useState(false);
  const [openModalAdd, setOpenModalAdd] = useState(false);
  const [openModalDetail, setOpenModalDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Ambil data referensi warga terkini dari API
  useEffect(() => {
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
        console.warn("Gagal memuat ref-warga di RapelList:", err);
      }
    };
    fetchRefWarga();
  }, []);

  const showRapelData = async () => {
    setLoading(true);
    try {
      const monthToSearch =
        selectedMonth.getFullYear() +
        "-" +
        (selectedMonth.getMonth() + 1).toString().padStart(2, "0");
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
      setRapelData(data.rapelBulanan || []);
    } catch (error) {
      console.error("Error fetching rapel bulanan:", error);
    } finally {
      setLoading(false);
    }
  };

  const kekurangan = (jumlahHariRapel) => {
    return (
      getDaysInMonth(
        (selectedMonth.getMonth() + 1).toString().padStart(2, "0"),
        selectedMonth.getFullYear()
      ) - jumlahHariRapel
    );
  };

  useEffect(() => {
    showRapelData();
  }, [selectedMonth]);

  const getNamaWarga = (item) => {
    if (item.nama) return item.nama;
    const found = wargaList.find(
      (h) => Number(h.nomor) === Number(item.nomor_rumah)
    );
    return found?.nama || `Rumah No. ${item.nomor_rumah}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">Daftar Rapel</h1>
        <label className="mt-4 mb-1 block text-xs font-medium text-muted">
          Pilih Bulan
        </label>
        <DatePicker
          customInput={
            <input
              inputMode="none"
              onKeyDown={(e) => e.preventDefault()}
              autoComplete="off"
            />
          }
          selected={selectedMonth}
          onChange={(date) => setSelectedMonth(date)}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          wrapperClassName="w-full sm:w-64"
          className="w-full rounded-lg border border-line p-2.5 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        />
      </Card>

      <Card className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h2 className="text-lg font-bold text-ink">
            {
              months.find(
                (m) =>
                  m.value ===
                  Number(
                    (selectedMonth.getMonth() + 1).toString().padStart(2, "0")
                  )
              )?.label
            }{" "}
            {selectedMonth.getFullYear()}
          </h2>
          <Button onClick={() => setOpenModalAdd(true)}>
            + Tambah Data Rapel
          </Button>
        </div>

        {/* Modal Add Rapel */}
        {openModalAdd && (
          <SimpleModal
            content={
              <RapelForm
                wargaList={wargaList}
                onSuccess={() => {
                  setOpenModalAdd(false);
                  showRapelData();
                }}
                onCancel={() => setOpenModalAdd(false)}
                initialPeriod={`${selectedMonth.getFullYear()}-${(
                  selectedMonth.getMonth() + 1
                )
                  .toString()
                  .padStart(2, "0")}`}
              />
            }
            onClose={() => setOpenModalAdd(false)}
          />
        )}

        {loading && <Spinner label="Melihat data..." />}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nomor Rumah</th>
                <th className="px-4 py-3 text-left">Nama Warga</th>
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
                rapelData.map((item, index) => {
                  const daysInM = getDaysInMonth(
                    (selectedMonth.getMonth() + 1).toString().padStart(2, "0"),
                    selectedMonth.getFullYear()
                  );
                  const isLunas = daysInM === item.jumlah_rapel;

                  return (
                    <tr
                      key={index}
                      className="border-t border-line odd:bg-white even:bg-surface"
                    >
                      <td className="px-4 py-3 text-center">{index + 1}</td>
                      <td className="px-4 py-3 text-center font-bold text-ink">
                        {item.nomor_rumah}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {getNamaWarga(item)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {`${item.jumlah_rapel} dari ${daysInM} `}

                        {isLunas ? (
                          <Badge tone="success" className="ml-2">
                            Lunas
                          </Badge>
                        ) : (
                          <Badge tone="danger" className="ml-2">
                            Kurang {kekurangan(item.jumlah_rapel)} hari
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="secondary"
                          className="!px-3 !py-1 text-xs"
                          onClick={() => {
                            setSelectedItem(item);
                            setOpenModalDetail(true);
                          }}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Modal Detail Rapel */}
              {openModalDetail && selectedItem && (
                <SimpleModal
                  content={
                    <DetailRapel
                      nomorRumah={selectedItem.nomor_rumah}
                      namaWarga={getNamaWarga(selectedItem)}
                      year={selectedMonth.getFullYear()}
                      month={(selectedMonth.getMonth() + 1)
                        .toString()
                        .padStart(2, "0")}
                    />
                  }
                  onClose={() => setOpenModalDetail(false)}
                />
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
