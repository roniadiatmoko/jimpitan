import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Swal from "sweetalert2";

const rumahList = [
  { nomor: 1, nama: "Pak Budi" },
  { nomor: 2, nama: "Bu Ani" },
  { nomor: 3, nama: "Pak Dedi" },
  { nomor: 4, nama: "Bu Wati" },
  { nomor: 5, nama: "Pak Joko" },
  { nomor: 6, nama: "Bu Sari" },
  { nomor: 7, nama: "Pak Ahmad" },
  { nomor: 8, nama: "Bu Rina" },
  { nomor: 9, nama: "Pak Slamet" },
  { nomor: 10, nama: "Bu Yuni" },
  { nomor: 11, nama: "Pak Tono" },
  { nomor: 12, nama: "Bu Rini" },
  { nomor: 13, nama: "Pak Anto" },
  { nomor: 14, nama: "Bu Lina" },
  { nomor: 15, nama: "Pak Bambang" },
  { nomor: 16, nama: "Bu Nia" },
  { nomor: 17, nama: "Pak Darto" },
  { nomor: 18, nama: "Bu Eni" },
  { nomor: 19, nama: "Pak Rudi" },
  { nomor: 20, nama: "Bu Fitri" },
  { nomor: 21, nama: "Pak Hadi" },
  { nomor: 22, nama: "Bu Murni" },
  { nomor: 23, nama: "Pak Udin" },
  { nomor: 24, nama: "Bu Lilis" },
  { nomor: 25, nama: "Pak Narto" },
  { nomor: 26, nama: "Bu Sinta" },
  { nomor: 27, nama: "Pak Wahyu" },
  { nomor: 28, nama: "Bu Desi" },
  { nomor: 29, nama: "Pak Riyan" },
  { nomor: 30, nama: "Bu Putri" },
  { nomor: 31, nama: "Pak Gito" },
  { nomor: 32, nama: "Bu Mega" },
  { nomor: 33, nama: "Pak Ari" },
  { nomor: 34, nama: "Bu Citra" },
  { nomor: 35, nama: "Pak Eko" },
  { nomor: 36, nama: "Bu Melati" },
  { nomor: 37, nama: "Pak Reza" },
  { nomor: 38, nama: "Bu Zahra" },
  { nomor: 39, nama: "Pak Dani" },
  { nomor: 40, nama: "Bu Tika" },
  { nomor: 41, nama: "Pak Yoga" },
  { nomor: 42, nama: "Bu Rossa" },
  { nomor: 43, nama: "Pak Ivan" },
  { nomor: 44, nama: "Bu Rika" },
  { nomor: 45, nama: "Pak Aldi" },
  { nomor: 46, nama: "Bu Winda" },
  { nomor: 47, nama: "Pak Ilham" },
  { nomor: 48, nama: "Bu Mita" },
  { nomor: 49, nama: "Pak Tegar" },
  { nomor: 50, nama: "Bu Shinta" },
  { nomor: 51, nama: "Pak Fauzi" },
  { nomor: 52, nama: "Bu Nanda" },
  { nomor: 53, nama: "Pak Hasan" },
  { nomor: 54, nama: "Bu Ayu" },
  { nomor: 55, nama: "Pak Gilang" },
  { nomor: 56, nama: "Bu Hesti" },
  { nomor: 57, nama: "Pak Zaki" },
  { nomor: 58, nama: "Bu Farah" },
  { nomor: 59, nama: "Pak Damar" },
  { nomor: 60, nama: "Bu Kiki" },
  { nomor: 61, nama: "Pak Haris" },
  { nomor: 62, nama: "Bu Suci" },
  { nomor: 63, nama: "Pak Bima" },
  { nomor: 64, nama: "Bu Ningsih" },
  { nomor: 65, nama: "Pak Iwan" },
  { nomor: 66, nama: "Bu Wulan" },
  { nomor: 67, nama: "Pak Jamil" },
  { nomor: 68, nama: "Bu Dewi" },
];

export default function App() {
  const [tanggal, setTanggal] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // format yyyy-mm-dd
  });

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
    const rumahSetor = Object.entries(terisi)
      .filter(([_, value]) => value)
      .map(([nomor]) => {
        const r = rumahList.find((item) => item.nomor === parseInt(nomor));
        return {
          nomor: r?.nomor,
          nama: r?.nama,
        };
      });

    for (let item of rumahSetor) {
      await fetch("https://script.google.com/macros/s/AKfycbwE3dSj570d2KP-v00D4JQdhLOIaNlVzI-RiAHG8SRRAUKpfmZXwLUXIU-iMCTeUvw3Wg/exec", {
        method: "POST",
        body: JSON.stringify({
          tanggal, // ambil dari input tanggal
          nomor_rumah: item.nomor,
          nama: item.nama,
          setor: 1,
          diambil_oleh: 'Petugas Ronda', // misalnya dari state nama petugas
        }),
      });
    }

    Swal.fire("Berhasil!", "Data sudah disimpan.", "success");
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
