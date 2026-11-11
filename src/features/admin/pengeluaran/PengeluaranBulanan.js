import { useEffect, useMemo, useState } from "react";
import PengeluaranForm from "./PengeluaranForm";
import DetailPengeluaran from "./DetailPengeluaran";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import SimpleModal from "../../../shared/components/SimpleModal";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Spinner from "../../../shared/components/ui/Spinner";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import Swal from "sweetalert2";

export default function PengeluaranBulanan({ period }) {
  const [loading, setLoading] = useState(false);
  const [dataPengeluaran, setDataPengeluaran] = useState([]);
  const [openModalPengeluaran, setModalAddPengeluaran] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openModalDetail, setOpenModalDetail] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [openModalEdit, setOpenModalEdit] = useState(false);

  const defaultPeriod =
    new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0");

  const currentPeriod = period || defaultPeriod;

  const showPengeluaran = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/pengeluaran/${currentPeriod}`
      );
      const data = await res.json();

      setDataPengeluaran(data.pengeluaran || []);
      setModalAddPengeluaran(false);
      setOpenModalEdit(false);
      setEditItem(null);
    } catch (error) {
      console.error("Error fetching pengeluaran:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Hapus Pengeluaran?",
      text: "Data pengeluaran ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/pengeluaran/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal menghapus data pengeluaran.");
      }

      setDataPengeluaran((prev) => prev.filter((item) => item.id !== id));
      Swal.fire("Terhapus!", "Data pengeluaran berhasil dihapus.", "success");
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal!", error.message || "Gagal menghapus data pengeluaran.", "error");
    }
  };

  const totalPengeluaran = useMemo(
    () => dataPengeluaran.reduce((a, b) => a + (Number(b.nominal) || 0), 0),
    [dataPengeluaran]
  );

  useEffect(() => {
    showPengeluaran();
  }, [period]);

  return (
    <div>
      <Button
        className="mb-4"
        onClick={() => {
          setModalAddPengeluaran(true);
        }}
      >
        + Tambah Data Pengeluaran
      </Button>

      {/* Modal Tambah Pengeluaran */}
      {openModalPengeluaran && (
        <SimpleModal
          content={
            <PengeluaranForm
              onSuccess={() => showPengeluaran()}
              onCancel={() => setModalAddPengeluaran(false)}
            />
          }
          onClose={() => setModalAddPengeluaran(false)}
        />
      )}

      {/* Modal Edit Pengeluaran */}
      {openModalEdit && (
        <SimpleModal
          content={
            <PengeluaranForm
              initialData={editItem}
              onSuccess={() => showPengeluaran()}
              onCancel={() => {
                setOpenModalEdit(false);
                setEditItem(null);
              }}
            />
          }
          onClose={() => {
            setOpenModalEdit(false);
            setEditItem(null);
          }}
        />
      )}

      {/* Modal Detail Pengeluaran */}
      {openModalDetail && (
        <SimpleModal
          content={
            <DetailPengeluaran
              pengeluaran={selectedItem}
              onEdit={(item) => {
                setOpenModalDetail(false);
                setEditItem(item);
                setOpenModalEdit(true);
              }}
              onClose={() => setOpenModalDetail(false)}
            />
          }
          onClose={() => setOpenModalDetail(false)}
        />
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Nominal Pengeluaran</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {dataPengeluaran.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">
                      Belum ada data pengeluaran
                    </td>
                  </tr>
                ) : (
                  dataPengeluaran.map((pengeluaran, index) => {
                    return (
                      <tr
                        key={pengeluaran.id}
                        className="border-t border-line odd:bg-white even:bg-surface"
                      >
                        <td className="px-4 py-2 text-center">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {pengeluaran.tanggal.toString().split("T")[0]}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-red-600">
                          {rupiahFormat(pengeluaran.nominal)}
                        </td>
                        <td className="px-4 py-2">
                          {pengeluaran.penanggung_jawab}
                        </td>
                        <td className="px-4 py-2 max-w-xs truncate">
                          {pengeluaran.keterangan || "-"}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className="!px-3 !py-1 text-xs"
                              onClick={() => {
                                setSelectedItem(pengeluaran);
                                setOpenModalDetail(true);
                              }}
                            >
                              Detail
                            </Button>
                            <Button
                              className="!px-3 !py-1 text-xs"
                              onClick={() => {
                                setEditItem(pengeluaran);
                                setOpenModalEdit(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              className="!px-3 !py-1 text-xs"
                              onClick={() => handleDelete(pengeluaran.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                <tr className="border-t border-line bg-surface font-semibold">
                  <td colSpan={2} className="px-4 py-2 text-center">
                    Total
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-red-600">
                    {rupiahFormat(totalPengeluaran)}
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
