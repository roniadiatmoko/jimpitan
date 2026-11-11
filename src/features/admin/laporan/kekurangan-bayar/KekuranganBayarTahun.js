import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ENDPOINT_BASE_URL, homeList, months, API_SECRET_KEY } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";
import Card from "../../../../shared/components/ui/Card";
import Button from "../../../../shared/components/ui/Button";
import Badge from "../../../../shared/components/ui/Badge";
import Spinner from "../../../../shared/components/ui/Spinner";
import Swal from "sweetalert2";

export default function KekuranganBayarTahun() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEndMonth, setSelectedEndMonth] = useState(12);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refWarga, setRefWarga] = useState(null);
  const [loadingRef, setLoadingRef] = useState(false);
  const [refError, setRefError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState([]);
  const [isPaying, setIsPaying] = useState(false);

  const yearOptions = useMemo(() => {
    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, idx) => String(start + idx));
  }, [currentYear]);

  const [wargaList, setWargaList] = useState(homeList);

  useEffect(() => {
    const fetchRef = async () => {
      try {
        const res = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "OK" && Array.isArray(json.data) && json.data.length > 0) {
            setWargaList(json.data);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat ref-warga:", e);
      }
    };
    fetchRef();
  }, []);

  const homeMap = useMemo(() => {
    const map = {};
    for (const home of wargaList) {
      map[String(home.nomor)] = home;
    }
    return map;
  }, [wargaList]);

  const fetchKekuranganTahun = async (selectedYear) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/laporan-kekurangan-tahun/${selectedYear}`,
      );
      const result = await response.json();
      if (!response.ok || (result.ok !== undefined && !result.ok)) {
        throw new Error(result.message || "Gagal memuat laporan tahunan");
      }
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memuat laporan tahunan");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKekuranganTahun(year);
  }, [year]);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return (data || []).filter((item) => {
      const homeData = homeMap[item.nomor_rumah];
      if (!homeData) return false;
      const isMenghuni = homeData.sudah_menghuni === 1;
      return statusFilter === "menghuni" ? isMenghuni : !isMenghuni;
    });
  }, [data, homeMap, statusFilter]);

  const totalSum = filteredData.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );

  const calculateCumulativeTotal = (item) => {
    let cumulative = 0;
    for (let i = 1; i <= selectedEndMonth; i++) {
      const month = months.find((m) => m.value === i);
      if (month) {
        const key = month.label.toLowerCase();
        cumulative += Number(item[key]) || 0;
      }
    }
    return cumulative;
  };

  const normalizePhone = (num) => {
    if (!num) return null;
    let phone = String(num).trim();
    if (phone.startsWith("+")) {
      phone = phone.slice(1);
    }
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    }
    return phone.replace(/\D/g, "");
  };

  const fetchRefWarga = async (nomor) => {
    // Memastikan nomor rumah bersih dari spasi dan dikonversi ke string
    const cleanNomor = String(nomor || "").trim();
    if (!cleanNomor) return;

    setLoadingRef(true);
    setRefError("");
    setRefWarga(null);
    try {
      // Menggunakan encodeURIComponent untuk mengamankan karakter khusus pada URL jika ada
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/ref-warga/${encodeURIComponent(cleanNomor)}`,
      );
      const json = await res.json();

      if (
        !res.ok ||
        (json.status && json.status !== "OK" && json.status !== "success")
      ) {
        throw new Error(json.message || "Tidak menemukan data warga");
      }

      // --- PERBAIKAN STRUKTUR DATA ---
      // Mengantisipasi jika json.data berbentuk array atau objek langsung
      let wargaData = null;
      if (Array.isArray(json.data)) {
        wargaData = json.data[0] || null;
      } else if (json.data) {
        wargaData = json.data;
      }

      if (!wargaData || (!wargaData.no_hp && !wargaData.nama)) {
        throw new Error("Data warga ditemukan, tetapi profil/nomor HP kosong.");
      }

      setRefWarga(wargaData);
    } catch (err) {
      console.error("Error fetchRefWarga:", err);
      setRefError(err.message || "Gagal memuat data warga");
      setRefWarga(null);
    } finally {
      setLoadingRef(false);
    }
  };

  useEffect(() => {
    if (showDetailModal && selectedDetail && selectedDetail.nomor_rumah) {
      fetchRefWarga(selectedDetail.nomor_rumah);
    } else {
      setRefWarga(null);
      setRefError("");
    }
  }, [showDetailModal, selectedDetail]);

  useEffect(() => {
    if (showDetailModal && selectedDetail) {
      fetchRefWarga(selectedDetail.nomor_rumah);
    } else {
      setRefWarga(null);
      setRefError("");
    }
  }, [showDetailModal, selectedDetail]);

  const monthsWithDeficiency = useMemo(() => {
    if (!selectedDetail) return [];
    return months
      .filter((month) => month.value <= selectedEndMonth)
      .filter((month) => {
        const key = month.label.toLowerCase();
        return Number(selectedDetail[key]) > 0;
      })
      .map((month) => {
        const key = month.label.toLowerCase();
        const days = Number(selectedDetail[key]) || 0;
        return {
          value: month.value,
          label: month.label,
          key,
          days,
          nominal: days * 500,
          periodStr: `${year}-${String(month.value).padStart(2, "0")}`,
        };
      });
  }, [selectedDetail, selectedEndMonth, year]);

  useEffect(() => {
    if (showDetailModal && selectedDetail) {
      const availableMonthValues = months
        .filter((month) => month.value <= selectedEndMonth)
        .filter(
          (month) => Number(selectedDetail[month.label.toLowerCase()]) > 0
        )
        .map((month) => month.value);
      setSelectedMonthsToPay(availableMonthValues);
    } else {
      setSelectedMonthsToPay([]);
    }
  }, [showDetailModal, selectedDetail, selectedEndMonth]);

  const toggleSelectMonth = (monthValue) => {
    setSelectedMonthsToPay((prev) =>
      prev.includes(monthValue)
        ? prev.filter((v) => v !== monthValue)
        : [...prev, monthValue].sort((a, b) => a - b)
    );
  };

  const toggleSelectAllMonths = () => {
    if (selectedMonthsToPay.length === monthsWithDeficiency.length) {
      setSelectedMonthsToPay([]);
    } else {
      setSelectedMonthsToPay(monthsWithDeficiency.map((m) => m.value));
    }
  };

  const selectedPaymentSummary = useMemo(() => {
    const selectedList = monthsWithDeficiency.filter((m) =>
      selectedMonthsToPay.includes(m.value)
    );
    const totalDays = selectedList.reduce((sum, m) => sum + m.days, 0);
    const totalNominal = totalDays * 500;
    return {
      selectedList,
      totalDays,
      totalNominal,
    };
  }, [monthsWithDeficiency, selectedMonthsToPay]);

  const handlePaySelectedMonths = async () => {
    if (selectedPaymentSummary.totalDays === 0) {
      Swal.fire(
        "Pilih Bulan",
        "Silakan pilih setidaknya 1 bulan yang ingin dibayarkan.",
        "warning"
      );
      return;
    }

    const defaultNominal = selectedPaymentSummary.totalNominal;
    const formattedDefault = rupiahFormat(defaultNominal).replace(/\u00A0/g, " ");
    const monthNamesList = selectedPaymentSummary.selectedList
      .map((m) => `${m.label} (${rupiahFormat(m.nominal).replace(/\u00A0/g, " ")})`)
      .join(", ");

    const { value: formValues } = await Swal.fire({
      title: `Bayar Jimpitan Rumah No. ${selectedDetail.nomor_rumah}`,
      html: `
        <div style="text-align: left; font-size: 13px; color: #374151; line-height: 1.6;">
          <div style="background: #f3f4f6; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; border-left: 4px solid #10b981;">
            <div><strong>Penghuni:</strong> ${homeMap[selectedDetail.nomor_rumah]?.nama || "-"}</div>
            <div><strong>Bulan Terpilih:</strong> ${monthNamesList}</div>
            <div style="margin-top: 4px; font-weight: 600; color: #047857;">Total Tagihan Terpilih: ${formattedDefault} (${selectedPaymentSummary.totalDays} hari)</div>
          </div>
          
          <label style="display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px;">
            Nominal yang Dibayarkan (Rp):
          </label>
          <input 
            id="swal-input-nominal" 
            type="number" 
            step="500" 
            min="500" 
            value="${defaultNominal}" 
            class="swal2-input" 
            style="width: 100%; margin: 0 0 10px 0; font-size: 16px; font-weight: bold; padding: 10px; border-radius: 6px; border: 1px solid #d1d5db;"
            placeholder="Masukkan nominal bayar"
          />
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button type="button" id="btn-quick-full" style="padding: 4px 10px; font-size: 11px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 4px; cursor: pointer;">
              ⚡ Bayar Penuh (${formattedDefault})
            </button>
          </div>
          <div style="font-size: 11px; color: #6b7280; background: #fffbeb; padding: 8px 12px; border-radius: 6px; border: 1px solid #fef3c7;">
            💡 <em>Pembayaran otomatis dialokasikan dari bulan terlama ke bulan terbaru secara kronologis. Jika nominal kurang dari total tagihan, bulan berikutnya tetap tercatat sebagai kekurangan di laporan.</em>
          </div>
        </div>
      `,
      didOpen: () => {
        const input = document.getElementById("swal-input-nominal");
        const btnFull = document.getElementById("btn-quick-full");
        if (btnFull && input) {
          btnFull.addEventListener("click", () => {
            input.value = defaultNominal;
            input.focus();
          });
        }
        if (input) {
          input.focus();
          input.select();
        }
      },
      showCancelButton: true,
      confirmButtonText: "Konfirmasi & Simpan Pembayaran",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById("swal-input-nominal");
        const val = Number(input?.value);
        if (!val || val < 500) {
          Swal.showValidationMessage("Nominal pembayaran minimal Rp 500 (1 hari jimpitan)!");
          return false;
        }
        return { nominal: val };
      },
    });

    if (!formValues) return;

    setIsPaying(true);
    Swal.fire({
      title: "Menyimpan Pembayaran...",
      text: "Mohon tunggu, data rapel harian sedang dicatat ke database.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rapel/bayar-multi-bulan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: API_SECRET_KEY,
          nomor_rumah: selectedDetail.nomor_rumah,
          nominal: formValues.nominal,
          daftar_bulan: selectedPaymentSummary.selectedList.map((m) => m.periodStr),
        }),
      });

      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "Gagal mencatat pembayaran rapel.");
      }

      await fetchKekuranganTahun(year);

      const rincianHasilHtml = (result.hasil_per_bulan || [])
        .map((h) => {
          const mObj = months.find((m) => `${year}-${String(m.value).padStart(2, "0")}` === h.bulan);
          const mLabel = mObj ? mObj.label : h.bulan;
          if (h.status === "LUNAS") {
            return `<li><strong>${mLabel}</strong>: <span style="color: #059669;">Lunas (${h.hari_disimpan} hari / ${rupiahFormat(h.nominal_disimpan)})</span></li>`;
          } else if (h.status === "SEBAGIAN") {
            return `<li><strong>${mLabel}</strong>: <span style="color: #d97706;">Sebagian terbayar (${h.hari_disimpan} hari / ${rupiahFormat(h.nominal_disimpan)})</span>, <span style="color: #dc2626;">sisa ${h.sisa_hari_belum_lunas} hari (${rupiahFormat(h.sisa_nominal_belum_lunas)})</span></li>`;
          } else {
            return `<li><strong>${mLabel}</strong>: Sudah lunas sebelumnya</li>`;
          }
        })
        .join("");

      Swal.fire({
        title: "Pembayaran Berhasil Dicatat! 🎉",
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6;">
            <p style="margin-bottom: 8px;"><strong>Rumah No. ${selectedDetail.nomor_rumah} (${homeMap[selectedDetail.nomor_rumah]?.nama || "-"}):</strong></p>
            <p>• Total hari terisi: <strong>${result.total_hari_disimpan} hari (${rupiahFormat(result.total_nominal_disimpan)})</strong></p>
            ${result.kelebihan_nominal > 0 ? `<p style="color: #059669;">• Kelebihan dana: <strong>${rupiahFormat(result.kelebihan_nominal)}</strong> (karena semua tagihan telah lunas)</p>` : ""}
            <div style="margin-top: 10px; background: #f9fafb; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <strong>Rincian Hasil per Bulan:</strong>
              <ul style="margin: 6px 0 0 16px; padding: 0;">
                ${rincianHasilHtml}
              </ul>
            </div>
          </div>
        `,
        icon: "success",
      });

      setShowDetailModal(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal", err.message || "Terjadi kesalahan saat memproses pembayaran.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const buildWhatsappMessage = () => {
    if (!selectedDetail) return "";

    const rincian = months
      .filter((month) => month.value <= selectedEndMonth)
      .filter((month) => {
        const key = month.label.toLowerCase();
        return Number(selectedDetail[key]) > 0;
      })
      .map((month) => {
        const key = month.label.toLowerCase();
        const days = Number(selectedDetail[key]) || 0;
        const nominal = days * 500;
        return `${month.label}: ${days} hari (${rupiahFormat(nominal)})`;
      })
      .join("\n");

    const totalNominal = calculateCumulativeTotal(selectedDetail) * 500;
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `📢 *Pemberitahuan Resmi Pengurus Jimpitan*\n\nYth. Warga Perumahan Griya Bhina Karya Tempel 2 Nomor *${selectedDetail.nomor_rumah}*\n\nTanggal: *${tanggal}*\n\n*Ini adalah pesan WhatsApp resmi dari Pengurus Jimpitan Perumahan Griya Bhina Karya Tempel 2. Mohon dapat membalas pesan ini dengan balasan apa saja sebagai tanda pesan telah diterima. Kami juga memohon untuk tidak melaporkan pesan ini sebagai SPAM agar layanan Broadcast WhatsApp pengurus tetap dapat berfungsi dengan baik.*\n\nKami menginformasikan bahwa masih terdapat administrasi jimpitan yang perlu dilengkapi sebagai berikut:\n\n🏠 Nomor Rumah : *${selectedDetail.nomor_rumah}*\n👤 Nama : *${homeMap[selectedDetail.nomor_rumah]?.nama || "-"}*\n\n💰 Rincian kekurangan per bulan:\n${rincian}\n\n*Total: ${rupiahFormat(totalNominal)}*\n\n*Cara Pembayaran:*\n\n*A. Tunai (Cash)*\n• Rumah No. 43 (Bapak Topik)\n• Rumah No. 33 (Roni A)\n\n*B. Transfer DANA*\n089673378055\na.n. Roni Adiatmoko\n\n*(Mohon konfirmasi setelah melakukan pembayaran.)*\n\n📝 *Catatan:* Apabila terdapat kesalahan atau ketidaksesuaian pada pencatatan jimpitan, silakan membalas pesan ini. Pengurus akan melakukan pengecekan dan konfirmasi kembali bersama petugas ronda harian untuk dilakukan koreksi apabila diperlukan.\n\n🙏 Terima kasih kepada seluruh warga yang telah berpartisipasi membayar jimpitan. Dana yang terkumpul digunakan untuk mendukung kebutuhan, keamanan, perawatan, dan pembangunan lingkungan yang manfaatnya dapat dirasakan bersama oleh seluruh warga.\n\nHormat kami,\n\n*Pengurus Jimpitan*\n*Perumahan Griya Bhina Karya Tempel 2*`;
  };

  const handleCopyTagihanWa = async () => {
    const monthObj = months.find((m) => m.value === selectedEndMonth);
    const monthLabel = monthObj ? monthObj.label : "";

    const listTagihan = filteredData
      .map((item) => {
        const days = calculateCumulativeTotal(item);
        if (days <= 0) return null;
        const nominal = days * 500;
        const nama = homeMap[item.nomor_rumah]?.nama || "-";
        const formattedNominal = rupiahFormat(nominal)
          .replace(/\u00A0/g, " ")
          .replace(/,00$/, "");
        return {
          nomor: Number(item.nomor_rumah) || 0,
          text: `No. ${item.nomor_rumah} - ${nama} | ${formattedNominal}`,
        };
      })
      .filter(Boolean);

    listTagihan.sort((a, b) => a.nomor - b.nomor);

    if (listTagihan.length === 0) {
      Swal.fire({
        title: "Tidak Ada Tagihan",
        text: `Tidak ada warga yang memiliki tagihan s/d ${monthLabel} ${year} untuk filter ini.`,
        icon: "info",
      });
      return;
    }

    const copyText = [
      `Kekurangan bayar jimpitan s/d ${monthLabel} ${year}`,
      "",
      ...listTagihan.map((t) => t.text),
    ].join("\n");

    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyText);
        success = true;
      }
    } catch (e) {
      console.warn("navigator.clipboard failed, trying fallback:", e);
    }

    if (!success) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand("copy");
        textArea.remove();
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }

    if (success) {
      Swal.fire({
        title: "Berhasil Disalin!",
        text: `Data tagihan (${listTagihan.length} rumah) s/d ${monthLabel} ${year} telah disalin ke clipboard.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire("Gagal", "Gagal menyalin teks ke clipboard.", "error");
    }
  };

  const handleCopyMessage = async () => {
    const pesan = buildWhatsappMessage();
    if (!pesan) return;
    try {
      await navigator.clipboard.writeText(pesan);
      alert("Pesan telah disalin ke clipboard!");
    } catch (err) {
      console.error(err);
      alert("Gagal menyalin pesan ke clipboard.");
    }
  };

  const sendWhatsappViaKanal = async () => {
    if (!refWarga?.no_hp || !selectedDetail) return;

    // 1. Set loading menjadi true saat tombol diklik
    setIsLoading(true);
    const pesan = buildWhatsappMessage();

    try {
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/kirim-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret_key: API_SECRET_KEY,
          pesan,
          no_hp: refWarga.no_hp,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim pesan");
      }
      alert("Pesan dikirim lewat kanal");
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim pesan: " + (err.message || "error"));
    } finally {
      // 2. Apapun hasilnya (sukses/gagal), matikan loading di sini
      setIsLoading(false);
    }
  };

  const activeDetail = selectedDetail || {};
  const activeHome = homeMap[activeDetail.nomor_rumah];
  const waPhone = normalizePhone(refWarga?.no_hp);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink">
              Rekap Kekurangan Bayar per Tahun
            </h1>
            <p className="text-xs text-muted mt-1">
              Pantau akumulasi kekurangan bayar jimpitan warga per tahun dan buka rincian per bulan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              className="flex items-center gap-1.5 text-xs !py-2 !px-3"
              onClick={() => {
                const padMonth = String(selectedEndMonth).padStart(2, "0");
                navigate(`/admin/kekurangan-bayar?period=${year}-${padMonth}`);
              }}
              title={`Buka laporan kekurangan bayar bulan ${months.find((m) => m.value === selectedEndMonth)?.label} ${year}`}
            >
              <span>📅</span> Buka Kekurangan Bulan {months.find((m) => m.value === selectedEndMonth)?.label}
            </Button>
            <Button
              className="flex items-center gap-1.5 text-xs !py-2 !px-3.5"
              onClick={() => navigate("/admin/kekurangan-bayar")}
            >
              <span>🔎</span> Kekurangan Per Bulan
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted">
              Pilih Tahun
            </label>
            <select
              className="w-48 rounded-lg border border-line bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right text-sm text-muted">
            Menampilkan data rekap tahunan untuk tahun{" "}
            <span className="font-semibold text-ink">{year}</span>.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink mr-2">Filter Status:</span>
            {[
              { value: "all", label: "Semua" },
              { value: "menghuni", label: "Menghuni" },
              { value: "belum", label: "Belum Dihuni" },
            ].map((option) => (
              <label
                key={option.value}
                className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${
                  statusFilter === option.value
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-ink border-line hover:bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="statusFilter"
                  value={option.value}
                  checked={statusFilter === option.value}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>

          <Button
            variant="success"
            onClick={handleCopyTagihanWa}
            className="flex items-center gap-2 !bg-emerald-600 hover:!bg-emerald-700 !text-white text-sm py-2 px-3.5 shadow-sm"
            title="Salin rekap tagihan jimpitan sesuai filter untuk WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
              />
            </svg>
            <span>Salin Tagihan WA</span>
          </Button>
        </div>
      </Card>

      {loading && <Spinner label="Memuat data rekap tahunan..." />}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-3">Nomor Rumah</th>
                <th className="px-3 py-3">Penghuni</th>
                <th className="px-3 py-3">Status Dihuni</th>
                <th className="px-3 py-3">
                  <div className="flex flex-col items-center gap-1.5">
                    <span>Total sampai bulan</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedEndMonth}
                        onChange={(e) =>
                          setSelectedEndMonth(Number(e.target.value))
                        }
                        className="w-24 rounded border border-line bg-white px-2 py-1 text-xs text-ink normal-case"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleCopyTagihanWa}
                        className="inline-flex items-center justify-center p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                        title="Salin rekap tagihan s/d bulan ini ke WA"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </th>
                {months.map((month) => {
                  const isSelectedMonth = month.value === selectedEndMonth;
                  return (
                    <th key={month.value} className="px-2 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const padMonth = String(month.value).padStart(2, "0");
                          navigate(`/admin/kekurangan-bayar?period=${year}-${padMonth}`);
                        }}
                        className={`group inline-flex items-center gap-1 text-xs transition hover:text-accent hover:underline ${
                          isSelectedMonth ? "text-accent font-bold" : "text-muted font-semibold"
                        }`}
                        title={`Buka kekurangan bayar bulan ${month.label} ${year}`}
                      >
                        <span>{month.label}</span>
                        <span className="text-[10px] text-accent opacity-60 group-hover:opacity-100">↗</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const homeData = homeMap[item.nomor_rumah];
                  const isMenghuni = homeData?.sudah_menghuni === 1;
                  return (
                    <tr
                      key={`${item.nomor_rumah}-${index}`}
                      className="border-t border-line odd:bg-white even:bg-surface"
                    >
                      <td className="px-3 py-2 text-center">
                        {item.nomor_rumah}
                      </td>
                      <td className="px-3 py-2 text-left">
                        {homeData?.nama || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge tone={isMenghuni ? "success" : "danger"}>
                          {isMenghuni ? "Menghuni" : "Belum"}
                        </Badge>
                      </td>
                      <td
                        className="px-3 py-2 text-center font-semibold cursor-pointer hover:bg-accent-soft"
                        onClick={() => {
                          setSelectedDetail(item);
                          setShowDetailModal(true);
                        }}
                      >
                        {(() => {
                          const cumulativeDays = calculateCumulativeTotal(item);
                          const cumulativeNominal = cumulativeDays * 500;
                          return `${cumulativeDays} (${rupiahFormat(cumulativeNominal)})`;
                        })()}
                      </td>
                      {months.map((month) => {
                        const key = month.label.toLowerCase();
                        const days = Number(item[key]) || 0;
                        const nominal = days * 500;
                        return (
                          <td
                            key={month.value}
                            className="px-3 py-2 text-center"
                          >
                            {days} ({rupiahFormat(nominal)})
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center font-semibold">
                        {item.total ?? 0} (
                        {rupiahFormat((Number(item.total) || 0) * 500)})
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-muted"
                    colSpan={17}
                  >
                    Tidak ada data rekap tahunan.
                  </td>
                </tr>
              )}
              {filteredData.length > 0 && (
                <tr className="border-t border-line bg-surface font-semibold">
                  <td className="px-3 py-2" colSpan={3}></td>
                  <td className="px-3 py-2 text-center">
                    {(() => {
                      const cumulativeGrandTotal = filteredData.reduce(
                        (sum, item) => sum + calculateCumulativeTotal(item),
                        0,
                      );
                      const cumulativeNominal = cumulativeGrandTotal * 500;
                      return `${cumulativeGrandTotal} (${rupiahFormat(cumulativeNominal)})`;
                    })()}
                  </td>
                  <td className="px-3 py-2 text-right" colSpan={13}>
                    Total Seluruh Kekurangan Bayar: {totalSum} (
                    {rupiahFormat(totalSum * 500)})
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showDetailModal && selectedDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Detail Total sampai bulan
                </h2>
                <p className="text-sm text-muted">
                  {`Rumah ${selectedDetail.nomor_rumah} hingga ${months.find((m) => m.value === selectedEndMonth)?.label}`}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Tutup
              </Button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4">
                  <div>
                    <div className="text-xs uppercase text-muted">
                      Nomor rumah
                    </div>
                    <div className="text-base font-semibold text-ink">
                      {selectedDetail.nomor_rumah}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted">
                      Nama penghuni
                    </div>
                    <div className="text-base font-semibold text-ink">
                      {activeHome?.nama || "-"}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="text-sm text-red-700">Kekurangan bayar</div>
                  <div className="mt-2 text-lg font-semibold text-red-900">
                    {(() => {
                      const cumulativeDays =
                        calculateCumulativeTotal(selectedDetail);
                      const cumulativeNominal = cumulativeDays * 500;
                      return `${cumulativeDays} hari / ${rupiahFormat(cumulativeNominal)}`;
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-ink">
                        Rincian per Bulan & Pembayaran
                      </div>
                      <div className="text-xs text-muted">
                        Centang bulan yang ingin dibayar, lalu masukkan nominal
                      </div>
                    </div>
                    {monthsWithDeficiency.length > 1 && (
                      <button
                        type="button"
                        onClick={toggleSelectAllMonths}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        {selectedMonthsToPay.length === monthsWithDeficiency.length
                          ? "Batal Pilih Semua"
                          : "Pilih Semua"}
                      </button>
                    )}
                  </div>

                  {monthsWithDeficiency.length > 0 ? (
                    <div className="space-y-2">
                      {monthsWithDeficiency.map((month) => {
                        const isChecked = selectedMonthsToPay.includes(month.value);
                        return (
                          <div
                            key={month.value}
                            onClick={() => toggleSelectMonth(month.value)}
                            className={`flex items-center justify-between rounded-lg border p-2.5 text-sm transition cursor-pointer select-none ${
                              isChecked
                                ? "border-emerald-300 bg-emerald-50/50 text-emerald-950 font-medium"
                                : "border-line bg-surface/50 text-muted hover:bg-surface"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>
                                {month.label}
                                <span className="ml-1.5 text-xs text-muted font-normal">
                                  ({month.days} hari)
                                </span>
                              </span>
                            </div>
                            <span className={isChecked ? "font-semibold text-emerald-700" : "text-muted"}>
                              {rupiahFormat(month.nominal)}
                            </span>
                          </div>
                        );
                      })}

                      <div className="mt-4 pt-3 border-t border-line space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted">
                            Bulan terpilih: <strong>{selectedPaymentSummary.selectedList.length} bulan</strong>
                          </span>
                          <span className="text-ink font-semibold">
                            Total: {selectedPaymentSummary.totalDays} hari ({rupiahFormat(selectedPaymentSummary.totalNominal)})
                          </span>
                        </div>

                        <Button
                          variant="success"
                          className="w-full flex items-center justify-center gap-2 !py-2.5 text-sm font-semibold shadow-sm"
                          disabled={selectedPaymentSummary.totalDays === 0 || isPaying}
                          onClick={handlePaySelectedMonths}
                        >
                          <span>💳</span>
                          {isPaying
                            ? "Memproses Pembayaran..."
                            : selectedPaymentSummary.totalDays === 0
                            ? "Pilih Bulan untuk Membayar"
                            : `Bayar Bulan Terpilih (${rupiahFormat(selectedPaymentSummary.totalNominal)})`}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-muted">
                      Tidak ada tunggakan jimpitan di bulan-bulan terpilih.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-line bg-surface p-4 text-right">
                  <div className="text-sm text-muted">
                    Total sampai bulan
                  </div>
                  <div className="mt-2 text-xl font-semibold text-ink">
                    {(() => {
                      const cumulativeDays =
                        calculateCumulativeTotal(selectedDetail);
                      const cumulativeNominal = cumulativeDays * 500;
                      return `${cumulativeDays} hari / ${rupiahFormat(cumulativeNominal)}`;
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-accent/20 bg-accent-soft p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-ink">
                      Pesan WhatsApp
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        className="!px-3 !py-1 text-xs"
                        onClick={handleCopyMessage}
                      >
                        Copy Pesan
                      </Button>
                      <Button
                        variant="success"
                        className="!px-3 !py-1 text-xs"
                        onClick={sendWhatsappViaKanal}
                        disabled={!refWarga?.no_hp}
                      >
                        {isLoading ? "Mengirim..." : "Kirim WA via Kanal"}
                      </Button>
                    </div>
                  </div>

                  <div className="mb-2 text-sm space-y-2">
                    <div>
                      Nomor HP:{" "}
                      {loadingRef ? (
                        <span>Memuat...</span>
                      ) : refWarga?.no_hp ? (
                        <span className="font-medium">{refWarga.no_hp}</span>
                      ) : (
                        <span className="text-red-600 italic">
                          nomor wa belum diisi
                        </span>
                      )}
                    </div>
                    <div>
                      Link:{" "}
                      {refWarga?.no_hp && waPhone ? (
                        <a
                          href={`https://wa.me/${waPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent underline"
                        >
                          {`https://wa.me/${waPhone}`}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                    {refError && (
                      <div className="text-xs text-red-600">{refError}</div>
                    )}
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded bg-white p-3 text-xs text-ink whitespace-pre-wrap font-mono leading-relaxed">
                    {buildWhatsappMessage()}
                  </div>
                  {!refWarga?.no_hp && (
                    <div className="text-xs text-red-600 italic mt-2">
                      nomor wa belum diisi di menu warga
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
