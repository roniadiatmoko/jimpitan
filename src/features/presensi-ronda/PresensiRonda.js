import { useEffect, useState } from "react";
import SimpleModal from "../../shared/components/SimpleModal";
import FormTambahPersonilRonda from "./FormTambahPersonilRonda";
import { ENDPOINT_BASE_URL } from "../../shared/config";

export default function PresensiRonda({ tanggal }) {
  const [personilRonda, setPersonilRonda] = useState([]);
  const [openModalTambahPersonilRonda, setOpenModalTambahPersonilRonda] =
    useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState("");

  const tanggalStr =
    tanggal instanceof Date
      ? tanggal.toISOString().slice(0, 10)
      : String(tanggal).slice(0, 10);

  const fetchPersonilRonda = async () => {
    setLoadingList(true);
    setErrorList("");

    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/ronda/personil/${encodeURIComponent(
          tanggalStr
        )}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal mengambil data personil ronda.");
      }

      const json = await res.json();
      setPersonilRonda(json.data || []);
    } catch (error) {
      setErrorList("Gagal memuat data personil ronda.");
    } finally {
      setLoadingList(false);
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm("Yakin ingin menghapus personil ronda ini?")) {
      return;
    }

    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ronda/personil/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal menghapus personil ronda.");
      }

      alert("Berhasil menghapus personil ronda.");
      fetchPersonilRonda();
    } catch (error) {
      alert("Gagal menghapus personil ronda. Silakan coba lagi." + error);
    }
  };

  useEffect(() => {
    fetchPersonilRonda();
  }, [tanggalStr]);

  return (
    <div className="mb-2 bg-teal-100 shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-green-700 mb-2">
        Penanggung Jawab Ronda
      </h1>
      <p className="text-center text-gray-600">
        Isikan yang hadir ronda untuk konfirmasi jimpitan.
      </p>

      <button
        className="mt-4 bg-green-600 w-full text-white p-2 rounded-xl font-bold hover:bg-green-700"
        onClick={() => setOpenModalTambahPersonilRonda(true)}
      >
        + Tambah Personil Ronda
      </button>

      {
        /* Modal Detail Rapel */
        openModalTambahPersonilRonda && (
          <SimpleModal
            content={
              <FormTambahPersonilRonda
                tanggal={tanggal}
                onClose={() => setOpenModalTambahPersonilRonda(false)}
                onSuccess={fetchPersonilRonda}
              />
            }
            onClose={() => setOpenModalTambahPersonilRonda(false)}
          />
        )
      }

      <div>
        <table className="w-full mt-2 border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="px-4 py-2 border">#</th>
              <th className="px-4 py-2 border">Penanggung Jawab</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {personilRonda.length === 0 ? (
              <tr>
                <td className="px-4 py-2 border text-center" colSpan={3}>
                  Belum disii
                </td>
              </tr>
            ) : null}
            {personilRonda.map((personil, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border text-center bg-gray-400">
                  {index + 1}
                </td>
                <td className="px-4 py-2 border text-left">
                  {personil.nomor_rumah} - {personil.nama_penghuni}
                </td>
                <td className="px-4 py-2 border text-center">
                  <button
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={() => handleHapus(personil.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
