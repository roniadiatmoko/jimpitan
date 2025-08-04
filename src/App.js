import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Swal from "sweetalert2";

const rumahList = [
  { nomor: 1, nama: "Hartono" },
  { nomor: 2, nama: "Yuliyanto" },
  { nomor: 3, nama: "Risal" },
  { nomor: 4, nama: "Wahyono" },
  { nomor: 5, nama: "Doni" },
  { nomor: 6, nama: "Rizky/Iput" },
  { nomor: 7, nama: "-" },
  { nomor: 8, nama: "Hendra" },
  { nomor: 9, nama: "Bambang" },
  { nomor: 10, nama: "Tri Koesnanto" },
  { nomor: 11, nama: "Herma" },
  { nomor: 12, nama: "-" },
  { nomor: 13, nama: "-" },
  { nomor: 14, nama: "-" },
  { nomor: 15, nama: "Eko" },
  { nomor: 16, nama: "Farid" },
  { nomor: 17, nama: "-" },
  { nomor: 18, nama: "Rini" },
  { nomor: 19, nama: "Adi" },
  { nomor: 20, nama: "Pak Roni" },
  { nomor: 21, nama: "Yudha" },
  { nomor: 22, nama: "Ineke" },
  { nomor: 23, nama: "-" },
  { nomor: 24, nama: "-" },
  { nomor: 25, nama: "Nugroho" },
  { nomor: 26, nama: "Agus" },
  { nomor: 27, nama: "-" },
  { nomor: 28, nama: "Ade" },
  { nomor: 29, nama: "-" },
  { nomor: 30, nama: "Wahyu Sutejo" },
  { nomor: 31, nama: "Amri" },
  { nomor: 32, nama: "Dedy" },
  { nomor: 33, nama: "Roni" },
  { nomor: 34, nama: "-" },
  { nomor: 35, nama: "Sinyo/Aang" },
  { nomor: 36, nama: "-" },
  { nomor: 37, nama: "Ulil" },
  { nomor: 38, nama: "Ardi/Adinda" },
  { nomor: 39, nama: "Boby" },
  { nomor: 40, nama: "Hari" },
  { nomor: 41, nama: "-" },
  { nomor: 42, nama: "-" },
  { nomor: 43, nama: "Farah" },
  { nomor: 44, nama: "Wahyu" },
  { nomor: 45, nama: "-" },
  { nomor: 46, nama: "-" },
  { nomor: 47, nama: "-" },
  { nomor: 48, nama: "Sari" },
  { nomor: 49, nama: "Ilham" },
  { nomor: 50, nama: "Hafidz" },
  { nomor: 51, nama: "Koko" },
  { nomor: 52, nama: "Tri/Yudi" },
  { nomor: 53, nama: "Anwar" },
  { nomor: 54, nama: "Okta" },
  { nomor: 55, nama: "-" },
  { nomor: 56, nama: "-" },
  { nomor: 57, nama: "-" },
  { nomor: 58, nama: "-" },
  { nomor: 59, nama: "Pitaloka" },
  { nomor: 60, nama: "Tri" },
  { nomor: 61, nama: "Royhan" },
  { nomor: 62, nama: "Samsino" },
  { nomor: 63, nama: "Kasto" },
  { nomor: 64, nama: "Wahyu Hidayat" },
  { nomor: 65, nama: "Yahya" },
  { nomor: 66, nama: "-" },
  { nomor: 67, nama: "Endra" },
  { nomor: 68, nama: "Ikhwan" },
];

export default function App() {
  const [tanggal, setTanggal] = useState(new Date());

  const [terisi, setTerisi] = useState({});
  const [uangDiambil, setUangDiambil] = useState("");

  const toggleRumah = (nomor) => {
    setTerisi((prev) => ({ ...prev, [nomor]: !prev[nomor] }));
  };

  const totalSetor = Object.values(terisi).filter(Boolean).length;
  const totalUang = totalSetor * 500;
  const isSesuai = parseInt(uangDiambil) === totalUang;
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const simpan = async () => {
    if (!isSesuai) {
      Swal.fire("Perhatian", "Jumlah uang diambil tidak sesuai.", "warning");
      return;
    }

    // --- PERUBAHAN DI SINI ---
    // Mengumpulkan semua data rumah (terisi dan tidak terisi)
    const dataJimpitan = rumahList.map(r => ({
      nomor: r.nomor,
      nama: r.nama,
      status: terisi[r.nomor] ? 1 : 0 // 1 jika terisi, 0 jika tidak
    }));

    if (dataJimpitan.length === 0) {
      Swal.fire("Kosong", "Belum ada rumah yang dicentang.", "info");
      return;
    }

    Swal.fire({
      title: "Menyimpan...",
      text: "Mohon tunggu sebentar",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(
        "https://ee548084-499f-43bb-b451-942060a81754-00-1dz8i3zxrf31f.pike.replit.dev/api/jimpitan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret_key: "rahasiakita123",
            tanggal: format(tanggal, "yyyy-MM-dd"), // Menggunakan tanggal dari DatePicker
            diambil_oleh: "Petugas Ronda",
            data: dataJimpitan, // Mengirim semua data rumah
          }),
        }
      );

      if (response.ok) {
        Swal.fire("Berhasil!", "Data sudah disimpan.", "success");
        setTerisi({});
        setUangDiambil("");
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", "Tidak bisa mengirim data. Periksa koneksi.", "error");
    }
  };

  return (
    <div
      className="min-h-screen pb-96 p-4 bg-gray-50"
      style={{ paddingBottom: keyboardOpen ? "300px" : "300px" }}
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-green-700">
          Nge-Jimpit GBK Tempel 2
        </h1>

        <label className="block mb-2 font-medium">Tanggal:</label>
        <DatePicker
          selected={tanggal}
          onChange={(date) => setTanggal(date)}
          dateFormat="dd-MM-yyyy"
          locale={id}
          className="w-full border rounded p-2"
        />
        {/* Format tampilan: Jumat, 1 Agustus 2025 */}
        <div className="mt-4 text-lg text-center font-bold text-green-700">
          {format(tanggal, "EEEE, d MMMM yyyy", { locale: id })}
        </div>
      </div>

      {/* Tampilkan hasil yang disimpan */}
      {/* <div className="mt-4 text-sm text-gray-600">
        <strong>Format Simpan (YYYY-MM-DD):</strong>{" "}
        {format(tanggal, "yyyy-MM-dd")}
      </div> */}

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 text-center">Nomor</th>
            <th className="p-2">Nama</th>
            <th className="p-2 text-center">Terisi</th>
          </tr>
        </thead>
        <tbody>
          {rumahList.map((r, index) => (
            <tr
              key={r.nomor}
              className={`${
                index % 2 === 0 ? "bg-green-200" : "bg-white"
              } border-t`}
            >
              <td className="p-2 text-center font-bold">{r.nomor}</td>
              <td className="p-2">{r.nama}</td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={!!terisi[r.nomor]}
                  onChange={async (e) => {
                    const isChecked = e.target.checked;
                    const result = await Swal.fire({
                      title: isChecked ? `Tandai Jimpitan?` : `Hapus Jimpitan?`,
                      text: isChecked
                        ? `Apakah Anda yakin menandai ${r.nomor} - ${r.nama} mengisi jimpitan?`
                        : `Apakah Anda yakin menghapus jimpitan Rumah ${r.nomor} - ${r.nama}?`,
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonText: "Ya",
                      cancelButtonText: "Batal",
                      confirmButtonColor: "#3085d6",
                      cancelButtonColor: "#d33",
                    });

                    if (result.isConfirmed) {
                      toggleRumah(r.nomor);
                    }
                  }}
                  className="w-6 h-6 accent-blue-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="fixed bottom-0 left-0 right-0 bg-green-900 text-white p-4 border-t shadow-md flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          💰 Total:{" "}
          <strong>
            {totalSetor} × 500 = Rp {totalUang.toLocaleString()}
          </strong>
        </div>
        <div className="flex items-center gap-2">
          <label>Uang Diambil:</label>
          <input
            type="number"
            value={uangDiambil}
            onChange={(e) => setUangDiambil(e.target.value)}
            onFocus={() => setKeyboardOpen(true)}
            onBlur={() => setKeyboardOpen(false)}
            className="p-1 border rounded w-50 text-black"
            placeholder="Total jimpitan hari ini"
          />
        </div>
        <button
          onClick={simpan}
          disabled={!isSesuai}
          className={`px-4 py-2 mt-10 w-full text-white rounded ${
            isSesuai ? "bg-green-600" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Simpan
        </button>
      </div>
    </div>
  );
}
