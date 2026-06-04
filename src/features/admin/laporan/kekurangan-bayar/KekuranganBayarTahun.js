import { useEffect, useMemo, useState } from "react";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../../shared/config";
import { rupiahFormat } from "../../../../shared/helpers/MoneyHeper";

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
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/laporan-kekurangan-tahun/${selectedYear}`);
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

  const totalSum = filteredData.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

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
    if (!nomor) return;
    setLoadingRef(true);
    setRefError("");
    setRefWarga(null);
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga/${nomor}`);
      const json = await res.json();
      if (!res.ok || (json.status && json.status !== "OK")) {
        throw new Error(json.message || "Tidak menemukan data warga");
      }
      setRefWarga(json.data || null);
    } catch (err) {
      console.error(err);
      setRefError(err.message || "Gagal memuat data warga");
      setRefWarga(null);
    } finally {
      setLoadingRef(false);
    }
  };

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
    const pesan = buildWhatsappMessage();
    try {
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/kirim-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret_key: "rahasiakita123", pesan, no_hp: refWarga.no_hp }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim pesan");
      }
      alert("Pesan dikirim lewat kanal");
    } catch (err) {
      console.error(err);
      alert("Gagal mengirim pesan: " + (err.message || "error"));
    }
  };

  const activeDetail = selectedDetail || {};
  const activeHome = homeMap[activeDetail.nomor_rumah];
  const waPhone = normalizePhone(refWarga?.no_hp);

  return (
    <div className="m-4 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-amber-700 mb-6">
        Rekap Kekurangan Bayar per Tahun
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Pilih Tahun</label>
          <select
            className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2"
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

        <div className="text-right text-sm text-gray-500">
          Menampilkan data rekap tahunan untuk tahun <span className="font-semibold">{year}</span>.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium mr-2">Filter Status:</span>
          {[
            { value: "all", label: "Semua" },
            { value: "menghuni", label: "Menghuni" },
            { value: "belum", label: "Belum Dihuni" },
          ].map((option) => (
            <label
              key={option.value}
              className={`inline-flex items-center rounded-full border px-3 py-2 text-sm cursor-pointer transition ${
                statusFilter === option.value
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
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

      {loading && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
          Memuat data rekap tahunan...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-amber-600 text-white">
            <tr>
              <th className="px-3 py-2 border">Nomor Rumah</th>
              <th className="px-3 py-2 border">Penghuni</th>
              <th className="px-3 py-2 border">Status Dihuni</th>
              <th className="px-3 py-2 border">
                <div className="flex flex-col gap-1">
                  <span>Total sampai bulan</span>
                  <select
                    value={selectedEndMonth}
                    onChange={(e) => setSelectedEndMonth(Number(e.target.value))}
                    className="w-24 rounded border border-white bg-amber-700 px-2 py-1 text-xs text-white"
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
                <th key={month.value} className="px-3 py-2 border">
                  {month.label}
                </th>
              ))}
              <th className="px-3 py-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                const homeData = homeMap[item.nomor_rumah];
                const isMenghuni = homeData?.sudah_menghuni === 1;
                return (
                  <tr key={`${item.nomor_rumah}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 border text-center">{item.nomor_rumah}</td>
                    <td className="px-3 py-2 border text-left">{homeData?.nama || "-"}</td>
                    <td className="px-3 py-2 border">
                      <span
                        className={`px-2 py-1 text-center font-bold rounded-full inline-block ${
                          isMenghuni
                            ? "text-green-700 bg-green-300 border-green-700 w-full block"
                            : "text-red-700 bg-red-300 border-red-700 w-full block"
                        }`}
                      >
                        {isMenghuni ? "Menghuni" : "Belum"}
                      </span>
                    </td>
                    <td
                      className="px-3 py-2 border text-center font-semibold cursor-pointer hover:bg-amber-100"
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
                        <td key={month.value} className="px-3 py-2 border text-center">
                          {days} ({rupiahFormat(nominal)})
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border text-center font-semibold">
                      {item.total ?? 0} ({rupiahFormat((Number(item.total) || 0) * 500)})
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-3 py-6 border text-center text-gray-500" colSpan={17}>
                  Tidak ada data rekap tahunan.
                </td>
              </tr>
            )}
            {filteredData.length > 0 && (
              <tr className="bg-gray-100 font-semibold">
                <td className="px-3 py-2 border" colSpan={3}></td>
                <td className="px-3 py-2 border text-center">
                  {(() => {
                    const cumulativeGrandTotal = filteredData.reduce((sum, item) => sum + calculateCumulativeTotal(item), 0);
                    const cumulativeNominal = cumulativeGrandTotal * 500;
                    return `${cumulativeGrandTotal} (${rupiahFormat(cumulativeNominal)})`;
                  })()}
                </td>
                <td className="px-3 py-2 border text-right" colSpan={13}>
                  Total Seluruh Kekurangan Bayar: {totalSum} ({rupiahFormat(totalSum * 500)})
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showDetailModal && selectedDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Detail Total sampai bulan</h2>
                <p className="text-sm text-slate-500">
                  {`Rumah ${selectedDetail.nomor_rumah} hingga ${months.find((m) => m.value === selectedEndMonth)?.label}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <div className="text-xs uppercase text-gray-500">Nomor rumah</div>
                    <div className="text-base font-semibold text-slate-900">{selectedDetail.nomor_rumah}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500">Nama penghuni</div>
                    <div className="text-base font-semibold text-slate-900">{activeHome?.nama || "-"}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-amber-50 p-4">
                  <div className="text-sm text-gray-600">Kekurangan bayar</div>
                  <div className="mt-2 text-lg font-semibold text-amber-800">
                    {(() => {
                      const cumulativeDays = calculateCumulativeTotal(selectedDetail);
                      const cumulativeNominal = cumulativeDays * 500;
                      return `${cumulativeDays} hari / ${rupiahFormat(cumulativeNominal)}`;
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-900">Rincian per bulan</div>
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
                          <div key={month.value} className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm text-slate-700">
                            <span>{month.label}</span>
                            <span>{rupiahFormat(nominal)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-right">
                  <div className="text-sm text-gray-600">Total sampai bulan</div>
                  <div className="mt-2 text-xl font-semibold text-slate-900">
                    {(() => {
                      const cumulativeDays = calculateCumulativeTotal(selectedDetail);
                      const cumulativeNominal = cumulativeDays * 500;
                      return `${cumulativeDays} hari / ${rupiahFormat(cumulativeNominal)}`;
                    })()}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-blue-50 p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-slate-900">📱 Pesan WhatsApp</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        📋 Copy Pesan
                      </button>
                      <button
                        type="button"
                        onClick={sendWhatsappViaKanal}
                        disabled={!refWarga?.no_hp}
                        className={`rounded-md px-3 py-1 text-xs font-semibold ${
                          refWarga?.no_hp ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Kirim WA dengan Kanal
                      </button>
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
                        <span className="text-red-600 italic">nomor wa belum diisi</span>
                      )}
                    </div>
                    <div>
                      Link:{" "}
                      {refWarga?.no_hp && waPhone ? (
                        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          {`https://wa.me/${waPhone}`}
                        </a>
                      ) : (
                        "-"
                      )}
                    </div>
                    {refError && <div className="text-xs text-red-600">{refError}</div>}
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {buildWhatsappMessage()}
                  </div>
                  {!refWarga?.no_hp && (
                    <div className="text-xs text-red-600 italic mt-2">nomor wa belum diisi di menu warga</div>
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
