import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";
import Card from "../../../../shared/components/ui/Card";
import Button from "../../../../shared/components/ui/Button";
import Badge from "../../../../shared/components/ui/Badge";
import Spinner from "../../../../shared/components/ui/Spinner";

export default function KekuranganBayarTahun() {
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

  const yearOptions = useMemo(() => {
    const start = currentYear - 5;
    return Array.from({ length: 11 }, (_, idx) => String(start + idx));
  }, [currentYear]);

  const homeMap = useMemo(() => {
    const map = {};
    for (const home of homeList) {
      map[String(home.nomor)] = home;
    }
    return map;
  }, []);

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
          secret_key: "rahasiakita123",
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
        <h1 className="text-xl font-bold text-ink mb-6">
          Rekap Kekurangan Bayar per Tahun
        </h1>

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

        <div className="flex flex-wrap items-center gap-4">
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
                  <div className="flex flex-col gap-1">
                    <span>Total sampai bulan</span>
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
                  </div>
                </th>
                {months.map((month) => (
                  <th key={month.value} className="px-3 py-3">
                    {month.label}
                  </th>
                ))}
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
                  <div className="mb-3 text-sm font-semibold text-ink">
                    Rincian per bulan
                  </div>
                  <div className="space-y-2">
                    {months
                      .filter((month) => month.value <= selectedEndMonth)
                      .filter((month) => {
                        const key = month.label.toLowerCase();
                        return Number(selectedDetail[key]) > 0;
                      })
                      .map((month) => {
                        const key = month.label.toLowerCase();
                        const days = Number(selectedDetail[key]) || 0;
                        const nominal = days * 500;
                        return (
                          <div
                            key={month.value}
                            className="flex items-center justify-between border-b border-line pb-2 text-sm text-ink"
                          >
                            <span>{month.label}</span>
                            <span>{rupiahFormat(nominal)}</span>
                          </div>
                        );
                      })}
                  </div>
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
