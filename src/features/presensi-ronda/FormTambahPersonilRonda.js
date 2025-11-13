import { format } from "date-fns";
import { fi, id } from "date-fns/locale";
import { ENDPOINT_BASE_URL, homeList } from "../../shared/config";
import { useState } from "react";
import Swal from "sweetalert2";
export default function FormTambahPersonilRonda({
  tanggal,
  onClose,
  onSuccess,
}) {
  const [selectedHomes, setSelectedHomes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleHome = (noRumah) => {
    if (selectedHomes.includes(noRumah)) {
      setSelectedHomes(selectedHomes.filter((nomor) => nomor !== noRumah));
    } else {
      setSelectedHomes([...selectedHomes, noRumah]);
    }
  };

  const handleSimpan = async () => {
    if (selectedHomes.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: "Minimal pilih 1 rumah",
      });
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const tanggalKirim =
        tanggal instanceof Date
          ? tanggal.toISOString().slice(0, 10) // yyyy-mm-dd
          : tanggal;

      const homesPayload = selectedHomes.map((nomor) => {
        const item = homeList.find((h) => h.nomor === nomor);
        return {
          nomor_rumah: nomor,
          nama_penghuni: item ? item.nama : null,
        };
      });

      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ronda/personil`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tanggal: tanggalKirim,
          homes: homesPayload,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal menyimpan data personil ronda.");
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Personil ronda berhasil disimpan.",
        timer: 1700,
        showConfirmButton: false,
      });
      setSelectedHomes([]);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: "Terjadi kesalahan. Silakan coba lagi.",
      });
      setErrorMsg(
        "Gagal menyimpan data personil ronda. Silakan coba lagi." + err
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl text-purple-700 font-bold mb-4">
        Personil Ronda {format(tanggal, "EEEE, d MMMM yyyy", { locale: id })}
      </h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Nama Personil:</label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {homeList.map((noRumah) => {
              const isChecked = selectedHomes.includes(noRumah.nomor);
              return (
                <label
                  key={noRumah.nomor}
                  className={
                    "flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-teal-300 " +
                    (isChecked
                      ? "bg-teal-100 border-teal-500 text-teal-700"
                      : "bg-white hover:bg-gray-50")
                  }
                >
                  <input
                    type="checkbox"
                    checked={selectedHomes.includes(noRumah.nomor)}
                    onChange={() => toggleHome(noRumah.nomor)}
                    className="form-checkbox h-5 w-5 text-white-600"
                  />
                  <span>
                    {noRumah.nomor} - {noRumah.nama}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSimpan}
          className="bg-purple-600 w-full mt-5 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Simpan {selectedHomes.length} Personil Ronda
        </button>
      </form>
    </div>
  );
}
