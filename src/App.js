import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Swal from "sweetalert2";

// Mengimpor komponen RapelForm dari file terpisah
import RapelForm from "./RapelForm.js";

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

const getPageFromPath = (path) => {
  if (path.includes("#/rapel")) {
    return "rapel";
  }
  return "harian";
};

export default function App() {
  const [currentPage, setCurrentPage] = useState(
    getPageFromPath(window.location.hash)
  );
  const [tanggal, setTanggal] = useState(new Date());
  const [terisi, setTerisi] = useState({});
  const [uangDiambil, setUangDiambil] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // State baru untuk menyimpan status rapel harian
  const [rapelHarianStatus, setRapelHarianStatus] = useState([]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getPageFromPath(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Efek untuk mengambil data rapel harian setiap kali tanggal berubah
  useEffect(() => {
    const fetchRapelHarianStatus = async () => {
      const tanggalFormatted = format(tanggal, "yyyy-MM-dd");
      try {
        const response = await fetch(
          `https://ee548084-499f-43bb-b451-942060a81754-00-1dz8i3zxrf31f.pike.replit.dev/api/rapel-harian/${tanggalFormatted}`
        );
        if (response.ok) {
          const data = await response.json();
          // rapelHarianStatus sekarang berupa array nomor_rumah
          console.log("Status rapel harian:", data.rapelHouses);
          setRapelHarianStatus(data.rapelHouses);
        } else {
          console.error("Gagal mengambil status rapel harian");
          setRapelHarianStatus([]);
        }
      } catch (error) {
        console.error("Error fetching rapel status:", error);
        setRapelHarianStatus([]);
      }
    };
    fetchRapelHarianStatus();
  }, [tanggal]);

  const toggleRumah = (nomor) => {
    // MEMO: Logika ini mencegah rumah yang sudah rapel untuk di-centang.
    // Jika nomor rumah ada di daftar rapel, maka fungsi akan berhenti.
    if (rapelHarianStatus.includes(String(nomor))) {
      return;
    }
    setTerisi((prev) => ({ ...prev, [nomor]: !prev[nomor] }));
  };

  const totalSetor = Object.keys(terisi).filter(
    (nomor) => terisi[nomor]
  ).length;
  const totalUang = totalSetor * 500;
  const isSesuai = parseInt(uangDiambil) === totalUang;

  const simpan = async () => {
    if (!isSesuai) {
      Swal.fire("Perhatian", "Jumlah uang diambil tidak sesuai.", "warning");
      return;
    }

    // Perbaikan: Pastikan ada data yang dicentang sebelum mencoba menyimpan
    const terisiRumah = Object.keys(terisi).filter((nomor) => terisi[nomor]);
    if (terisiRumah.length === 0) {
      Swal.fire("Kosong", "Belum ada rumah yang dicentang.", "info");
      return;
    }

    const dataJimpitan = rumahList.map((r) => ({
      nomor: String(r.nomor),
      nama: r.nama,
      // MEMO: Status disimpan berdasarkan state 'terisi'.
      // Karena rumah yang sudah rapel tidak bisa di-centang (berkat logika di toggleRumah),
      // maka statusnya akan otomatis 0 (nol) saat disimpan, sesuai permintaan.
      status: terisi[r.nomor] ? 1 : 0,
    }));

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
            tanggal: format(tanggal, "yyyy-MM-dd"),
            diambil_oleh: "Petugas Ronda",
            data: dataJimpitan,
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
    <div className="min-h-screen pb-96 bg-gray-50">
      {currentPage === "harian" ? (
        // Tampilan untuk input harian
        <>
          <div className="text-center">
            <div className="bg-green-400 mt-[-15px] p-1 shadow">
              <h1 className="text-center font-bold mb-4 mt-10 h-20 text-green-800 text-lg">
                Nge-Jimpit GBK Tempel 2
              </h1>
            </div>

            <div className="bg-white p-1 rounded-t-3xl text-center shadow mb-4 mt-[-50px]">
              <label className="block mb-2 font-medium">Tanggal:</label>
              <DatePicker
                selected={tanggal}
                onChange={(date) => setTanggal(date)}
                dateFormat="dd-MM-yyyy"
                locale={id}
                className="w-full border text-center rounded p-2"
              />
              <div className="mt-4 text-lg text-center font-bold text-green-700">
                <div className="text-red-700 text-xs text-center">
                  Pastikan tanggal ronda sudah benar sebelum menyimpan!
                </div>
                {format(tanggal, "EEEE, d MMMM yyyy", { locale: id })}
              </div>

              <table className="w-full bg-white shadow rounded">
                <thead>
                  <tr className="bg-gray-200 text-center">
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
                      <td className="p-2 text-left">{r.nama}</td>
                      <td className="p-2 text-center">
                        {/* Logika untuk menampilkan "Rapel" jika rumah sudah rapel. */}
                        {rapelHarianStatus.includes(String(r.nomor)) ? (
                          <span className="font-semibold text-green-600">
                            Rapel
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={!!terisi[r.nomor]}
                            onChange={async (e) => {
                              const isChecked = e.target.checked;
                              const result = await Swal.fire({
                                title: isChecked
                                  ? `Tandai Jimpitan?`
                                  : `Hapus Jimpitan?`,
                                html: isChecked
                                  ? `Apakah Anda yakin menandai <b>${r.nomor} - ${r.nama} </b>mengisi jimpitan?`
                                  : `Apakah Anda yakin menghapus jimpitan Rumah <b>${r.nomor} - ${r.nama} </b>?`,
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-green-900 text-white p-4 border-t rounded-t-3xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              💰 Total Seharusnya:{" "}
              <strong>
                {totalSetor} × 500 = Rp {totalUang.toLocaleString()}
              </strong>
            </div>
            <div className="flex flex-col items-center gap-2">
              <label>Masukkan Total Uang Yang Diambil:</label>
              <input
                type="number"
                value={uangDiambil}
                onChange={(e) => setUangDiambil(e.target.value)}
                onFocus={() => setKeyboardOpen(true)}
                onBlur={() => setKeyboardOpen(false)}
                className="p-1 border rounded w-50 text-black"
                placeholder="Masukkan jimpitan hari ini"
              />
            </div>

            {keyboardOpen ? (
              <div>
                <div className="text-red-300 text-sm text-center">
                  *Masukkan tanpa titik tanpa koma
                </div>
                <div className="text-red-800 text-sm text-center bg-red-200 p-2 rounded">
                  Jika uang yang diambil tidak sesuai dengan checklist. <br />
                  Petugas ronda harus melengkapi kekurangannya.
                </div>
              </div>
            ) : (
              ""
            )}
            <button
              onClick={simpan}
              disabled={!isSesuai || totalSetor === 0}
              className={`px-4 py-2 mt-5 w-full text-white rounded ${
                isSesuai && totalSetor > 0
                  ? "bg-green-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isSesuai ? "Simpan Jimpitan" : "Jumlah Tidak Sesuai"}
            </button>
          </div>
        </>
      ) : (
        // Tampilan untuk halaman rapel
        <RapelForm />
      )}
    </div>
  );
}
