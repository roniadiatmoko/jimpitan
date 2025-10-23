// export const ENDPOINT_BASE_URL = 'https://ee548084-499f-43bb-b451-942060a81754-00-1dz8i3zxrf31f.pike.replit.dev';
// export const ENDPOINT_BASE_URL = 'http://localhost:3000'

export const ENDPOINT_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://ee548084-499f-43bb-b451-942060a81754-00-1dz8i3zxrf31f.pike.replit.dev";


export const ENDPOINTS = {
    jimpitan: `${ENDPOINT_BASE_URL}/jimpitan`,
    admin: `${ENDPOINT_BASE_URL}/#/admin`,
    rapel: `${ENDPOINT_BASE_URL}/#/rapel`,
    rapelList: `${ENDPOINT_BASE_URL}/#/rapel-list`
}

export const SALDO_MULAI = 1200000;

export const homeList = [
  { nomor: 1, nama: "Hartono", sudah_menghuni: 1 },
  { nomor: 2, nama: "Yuliyanto", sudah_menghuni: 1 },
  { nomor: 3, nama: "Risal", sudah_menghuni: 0 },
  { nomor: 4, nama: "Wahyono", sudah_menghuni: 1 },
  { nomor: 5, nama: "Doni", sudah_menghuni: 1 },
  { nomor: 6, nama: "Iput", sudah_menghuni: 1 },
  { nomor: 7, nama: "-", sudah_menghuni: 0 },
  { nomor: 8, nama: "Hendra", sudah_menghuni: 1 },
  { nomor: 9, nama: "Bambang", sudah_menghuni: 1 },
  { nomor: 10, nama: "Tri Koesnanto", sudah_menghuni: 1 },
  { nomor: 11, nama: "Herma", sudah_menghuni: 1 },
  { nomor: 12, nama: "Sri Parinem, S.Pd", sudah_menghuni: 0 },
  { nomor: 13, nama: "-", sudah_menghuni: 0 },
  { nomor: 14, nama: "-", sudah_menghuni: 0 },
  { nomor: 15, nama: "Eko", sudah_menghuni: 1 },
  { nomor: 16, nama: "Farid", sudah_menghuni: 1 },
  { nomor: 17, nama: "-", sudah_menghuni: 0 },
  { nomor: 18, nama: "Rini", sudah_menghuni: 0 },
  { nomor: 19, nama: "Adi", sudah_menghuni: 1 },
  { nomor: 20, nama: "Pak Roni", sudah_menghuni: 1 },
  { nomor: 21, nama: "Yudha", sudah_menghuni: 1 },
  { nomor: 22, nama: "Ineke", sudah_menghuni: 1 },
  { nomor: 23, nama: "-", sudah_menghuni: 0 },
  { nomor: 24, nama: "-", sudah_menghuni: 0 },
  { nomor: 25, nama: "Nugroho", sudah_menghuni: 1 },
  { nomor: 26, nama: "Agus", sudah_menghuni: 1 },
  { nomor: 27, nama: "-", sudah_menghuni: 0 },
  { nomor: 28, nama: "Ade", sudah_menghuni: 1 },
  { nomor: 29, nama: "-", sudah_menghuni: 0 },
  { nomor: 30, nama: "Wahyu Sutejo", sudah_menghuni: 0 },
  { nomor: 31, nama: "Amri", sudah_menghuni: 1 },
  { nomor: 32, nama: "Dedy", sudah_menghuni: 1 },
  { nomor: 33, nama: "Roni", sudah_menghuni: 1 },
  { nomor: 34, nama: "-", sudah_menghuni: 0 },
  { nomor: 35, nama: "Sinyo/Aang", sudah_menghuni: 0 },
  { nomor: 36, nama: "-", sudah_menghuni: 0 },
  { nomor: 37, nama: "Ulil", sudah_menghuni: 0 },
  { nomor: 38, nama: "Adinda", sudah_menghuni: 0 },
  { nomor: 39, nama: "Boby", sudah_menghuni: 1 },
  { nomor: 40, nama: "Hari", sudah_menghuni: 1 },
  { nomor: 41, nama: "-", sudah_menghuni: 0 },
  { nomor: 42, nama: "-", sudah_menghuni: 0 },
  { nomor: 43, nama: "Topik", sudah_menghuni: 1 },
  { nomor: 44, nama: "Wahyu Pratama", sudah_menghuni: 1 },
  { nomor: 45, nama: "-", sudah_menghuni: 0 },
  { nomor: 46, nama: "-", sudah_menghuni: 0 },
  { nomor: 47, nama: "-", sudah_menghuni: 0 },
  { nomor: 48, nama: "-", sudah_menghuni: 0 },
  { nomor: 49, nama: "Ilham", sudah_menghuni: 1 },
  { nomor: 50, nama: "Hafidz", sudah_menghuni: 1 },
  { nomor: 51, nama: "Koko", sudah_menghuni: 0 },
  { nomor: 52, nama: "Tri/Yudi", sudah_menghuni: 0 },
  { nomor: 53, nama: "Anwar", sudah_menghuni: 1 },
  { nomor: 54, nama: "Okta", sudah_menghuni: 1 },
  { nomor: 55, nama: "-", sudah_menghuni: 0 },
  { nomor: 56, nama: "-", sudah_menghuni: 0 },
  { nomor: 57, nama: "-", sudah_menghuni: 0 },
  { nomor: 58, nama: "-", sudah_menghuni: 0 },
  { nomor: 59, nama: "Pitaloka", sudah_menghuni: 1 },
  { nomor: 60, nama: "Tri", sudah_menghuni: 0 },
  { nomor: 61, nama: "Royhan", sudah_menghuni: 1 },
  { nomor: 62, nama: "Samsino", sudah_menghuni: 1 },
  { nomor: 63, nama: "Kasto", sudah_menghuni: 0 },
  { nomor: 64, nama: "Wahyu Hidayat", sudah_menghuni: 0 },
  { nomor: 65, nama: "Yahya", sudah_menghuni: 1 },
  { nomor: 66, nama: "-", sudah_menghuni: 0 },
  { nomor: 67, nama: "Endra", sudah_menghuni: 1 },
  { nomor: 68, nama: "Ikhwan", sudah_menghuni: 0 },
];

export const userAccount = [
  { username: "menterijimpitan", password: "menterijimpitan", fullname: "Menteri Jimpitan" },
  { username: "ketua", password: "kepalasuku", fullname: "Ketua Paguyuban" },
];

export const months = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];