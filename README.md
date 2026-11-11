# 🎨 Jimpitan v2 - Frontend Web Application

Aplikasi antarmuka web modern untuk sistem pencatatan jimpitan warga RT / paguyuban (GBK Tempel 2). Dibangun menggunakan **React 19**, **Tailwind CSS**, dan arsitektur desain yang responsif (desktop, tablet, dan smartphone touchscreen).

---

## 🌟 Fitur Halaman & Modul

1. **Dashboard Admin (`/admin`)**:
   - Ringkasan kas, pintasan cepat, dan status operasional sistem.
2. **Hitung Ulang Harian (`/admin/hitung-ulang-harian`)**:
   - Pencatatan jimpitan per pos ronda harian dengan indikator status kehadiran dan modal lihat tanggal yang sudah diisi.
3. **Daftar Rapel (`/admin/rapel`)**:
   - Formulir pelunasan rapel jimpitan dengan opsi otomatis "Lunaskan bulan ini" (menghitung sisa hari kosong secara akurat).
   - Sinkronisasi nama warga otomatis berdasarkan master data Ref Warga.
4. **Pengeluaran Kas (`/admin/pengeluaran`)**:
   - Pencatatan dan edit pengeluaran kas operasional RT dengan filter per bulan.
5. **Rekap Bulanan & Daftar Rekap (`/admin/daftar-rekap`)**:
   - Laporan rekapitulasi saldo kas masuk dan keluar.
   - **Fitur Cetak Laporan Keuangan**: template cetak resmi standar tutup buku akhir tahun/bulan.
6. **Kekurangan Bayar (`/admin/kekurangan-bayar-tahun`)**:
   - **Matriks Tahunan**: Gambaran menyeluruh status pembayaran seluruh rumah (Januari – Desember).
   - Setiap kolom bulan interaktif, langsung membuka rincian bulanan terkait (`/admin/kekurangan-bayar?period=YYYY-MM`).
   - Tombol salin rekap tagihan WhatsApp siap kirim ke grup warga.
7. **Sinkronisasi Cloud (`/admin/sinkron-cloud`)**:
   - Dashboard sinkronisasi SQLite lokal ke PostgreSQL / Supabase dengan progress bar dan log langsung.
8. **Status WhatsApp (`/admin/status-whatsapp`)**:
   - Monitoring koneksi bot WhatsApp, scan QR code, dan pengetesan pesan.
9. **Data Warga (`/admin/list-warga` & `/admin/ref-warga`)**:
   - Master data warga dan pemetaan nomor rumah dinamis.

---

## 💻 Cara Menjalankan

### Mode Pengembangan (Development)
```bash
cd frontend
npm install
npm start
```
Aplikasi akan berjalan di `http://localhost:3001` (atau 3000 jika disesuaikan).

### Mode Produksi (Build & Serve)
Untuk menyajikan frontend secara sangat ringan dan cepat di Linux Mint atau server lokal:
```bash
# 1. Kompilasi bundle statis
npm run build

# 2. Sajikan dengan server statis ultra-ringan bawaan (Node.js murni)
node serve.js
```
Aplikasi produksi akan disajikan di `http://localhost:3001`.

---

## ⚙️ Variabel Lingkungan (`.env`)

Lihat [`.env.example`](.env.example):
```env
PORT=3001
REACT_APP_API_URL=http://localhost:3000
GENERATE_SOURCEMAP=false
BROWSER=none
```

---

## 🛠️ Stack Teknologi

- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS & Modern Color Palette
- **Components**: DatePicker, Currency Input, SweetAlert2
- **Static Server**: Node.js HTTP server native (`serve.js`)
