import { useMemo, useRef, useState, useEffect } from "react";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Spinner from "../../../shared/components/ui/Spinner";
import Swal from "sweetalert2";

function AccordionItem({ id, openId, setOpenId, title, amount, children }) {
  const isOpen = openId === id;
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) setMaxH(contentRef.current.scrollHeight);
    else setMaxH(0);
  }, [isOpen, children]);

  return (
    <div className="rounded-xl border border-line bg-white">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
        onClick={() => setOpenId(isOpen ? null : id)}
      >
        <span className="font-semibold text-ink">
          {isOpen ? "▲" : "▼"} {title}
        </span>

        {/* Angka rata kanan, lebar konsisten */}
        <span className="font-bold text-lg min-w-[14ch] text-right text-ink">
          {rupiahFormat(amount)}
        </span>
      </button>

      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? maxH : 0 }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LaporanBulananAccordion({
  period = new Date().getFullYear() +
    "-" +
    (new Date().getMonth() + 1).toString().padStart(2, "0"),
}) {
  const [openId, setOpenId] = useState("");
  const [dataHarian, setDataHarian] = useState([]);
  const [dataRapel, setDataRapel] = useState([]);
  const [dataPengeluaran, setDataPengeluaran] = useState([]);
  const [saldoKeseluruhan, setSaldoKeseluruhan] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saldoSebelumnya, setSaldoSebelumnya] = useState(0);
  const [savingRekap, setSavingRekap] = useState(false);

  const [tahun, bulan] = period.split("-");

  const apiDataHarian = async () => {
    try {
      const res = await fetch(`${ENDPOINT_BASE_URL}/api/jimpitan/${period}`);
      const data = await res.json();

      setDataHarian(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const apiDataRapel = async () => {
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/rapel-bulanan/${period}`
      );
      const data = await res.json();
      setDataRapel(data.rapelBulanan);
    } catch (error) {
      console.log(error);
    }
  };

  const apiDataPengeluaran = async () => {
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/pengeluaran/${period}`
      );
      const data = await res.json();
      setDataPengeluaran(data.pengeluaran);
    } catch (error) {
      console.log(error);
    }
  };

  const apiDataRekap = async () => {
    try {
      const res = await fetch(
        `${ENDPOINT_BASE_URL}/api/rekap/${tahun}/${bulan}`
      );
      const data = await res.json();
      setSaldoSebelumnya(data.data?.saldo_sebelumnya || 0);
      setSaldoKeseluruhan(data.data?.sisa_saldo || 0);
    } catch (error) {
      console.log(error);
    }
  };

  const totalHarian = useMemo(
    () => dataHarian.reduce((a, b) => a + (b.nominal || 0), 0),
    [dataHarian]
  );
  const totalRapel = useMemo(
    () => dataRapel.reduce((a, b) => a + (b.nominal || 0), 0),
    [dataRapel]
  );
  const totalSemua = totalHarian + totalRapel;

  const pengeluaranBulan = useMemo(
    () => dataPengeluaran.reduce((a, b) => a + (Number(b.nominal) || 0), 0),
    [dataPengeluaran]
  );

  const handleSimpanUlangRekap = async () => {
    const confirm = await Swal.fire({
      title: "Simpan Ulang Rekap?",
      text: "Data rekap saldo periode ini akan ditimpa dengan nilai terbaru.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, simpan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSavingRekap(true);
    Swal.fire({
      title: "Menyimpan...",
      text: "Menyimpan rekap saldo, mohon tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const namaBulan =
        months.find((m) => m.value === Number(bulan))?.label || bulan;
      const keterangan = `Rekap otomatis ${namaBulan} ${tahun}`;

      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rekap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tahun,
          bulan,
          pemasukan: totalSemua,
          pengeluaran: pengeluaranBulan,
          keterangan,
          secret_key: "rahasiakita123",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan rekap");
      }

      await apiDataRekap();
      Swal.fire(
        "Berhasil",
        result.message || "Rekap saldo berhasil disimpan.",
        "success"
      );
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", err.message || "Gagal menyimpan rekap saldo.", "error");
    } finally {
      setSavingRekap(false);
    }
  };

  useEffect(() => {
    apiDataHarian();
    apiDataRapel();
    apiDataPengeluaran();
    apiDataRekap();
    setLoading(false);
  }, [period]);

  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          <AccordionItem
            id="harian"
            openId={openId}
            setOpenId={setOpenId}
            title="Jimpitan Harian"
            amount={totalHarian}
          >
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 text-center">Tanggal</th>
                    <th className="px-3 py-2 text-center">Rumah Terisi</th>
                    <th className="px-3 py-2 text-center">Total Jimpitan</th>
                  </tr>
                </thead>
                <tbody>
                  {dataHarian.map((d) => (
                    <tr key={d.tanggal} className="border-t border-line odd:bg-white even:bg-surface">
                      <td className="px-3 py-2">{d.tanggal}</td>
                      <td className="px-3 py-2 text-center">
                        {d.terisi}/{homeList.length}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {rupiahFormat(d.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionItem>

          <AccordionItem
            id="rapel"
            openId={openId}
            setOpenId={setOpenId}
            title="Jimpitan Rapel"
            amount={totalRapel}
          >
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 text-center">No Rumah</th>
                    <th className="px-3 py-2 text-center">Nama Penghuni</th>
                    <th className="px-3 py-2 text-center">Jumlah Rapel</th>
                    <th className="px-3 py-2 text-center">Nominal Rapel</th>
                  </tr>
                </thead>
                <tbody>
                  {dataRapel.map((r, i) => (
                    <tr key={i} className="border-t border-line odd:bg-white even:bg-surface">
                      <td className="px-3 py-2 text-center">
                        {r.nomor_rumah}
                      </td>
                      <td className="px-3 py-2">
                        {" "}
                        {homeList.find(
                          (h) => h.nomor === Number(r.nomor_rumah)
                        )?.nama || "-"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {r.jumlah_rapel} Hari
                      </td>
                      <td className="px-3 py-2 text-right">
                        {rupiahFormat(r.nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionItem>

          {/* Total Bulan Ini */}
          <Card className="flex items-center justify-between gap-2">
            <span className="font-semibold text-ink">Total Jimpitan Bulan Ini</span>
            <span className="text-lg font-bold text-ink">
              {rupiahFormat(totalSemua)}
            </span>
          </Card>

          <AccordionItem
            id="pengeluaran"
            openId={openId}
            setOpenId={setOpenId}
            title="Pengeluaran Bulan Ini"
            amount={pengeluaranBulan}
          >
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 text-center">No</th>
                    <th className="px-3 py-2 text-center">Tanggal</th>
                    <th className="px-3 py-2 text-center">Keperluan</th>
                    <th className="px-3 py-2 text-center">Nominal</th>
                    <th className="px-3 py-2 text-center">Penanggung Jawab</th>
                  </tr>
                </thead>
                <tbody>
                  {dataPengeluaran.map((p, i) => (
                    <tr key={i} className="border-t border-line odd:bg-white even:bg-surface">
                      <td className="px-3 py-2 text-center">{i + 1}</td>
                      <td className="px-3 py-2">{(p.tanggal).toString().slice(0, 10)}</td>
                      <td className="px-3 py-2">{p.keterangan}</td>
                      <td className="px-3 py-2 text-right">
                        {rupiahFormat(p.nominal)}
                      </td>
                      <td className="px-3 py-2">{p.penanggung_jawab}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionItem>

          {/* Saldo Bulan Ini */}
          <Card className="flex items-center justify-between gap-2 mt-6">
            <span className="font-semibold text-ink">Saldo Bulan Ini</span>
            <span className="text-xl font-bold text-ink">
              {rupiahFormat(totalSemua - pengeluaranBulan)}
            </span>
          </Card>

          <Button
            className="w-full"
            onClick={handleSimpanUlangRekap}
            disabled={savingRekap}
          >
            {savingRekap ? "Menyimpan..." : "Simpan Ulang Rekap"}
          </Button>

          {/* Saldo Sebelumnya */}
          <Card className="flex items-center justify-between gap-2">
            <span className="font-semibold text-ink">Saldo Sebelumnya</span>
            <span className="text-xl font-bold text-ink">
              {rupiahFormat(saldoSebelumnya)}
            </span>
          </Card>

          {/* Sisa Saldo Keseluruhan */}
          <Card className="flex items-center justify-between gap-2 bg-accent-soft border-accent/20">
            <span className="font-semibold text-accent">Sisa Saldo Keseluruhan</span>
            <span className="text-xl font-bold text-accent">
              {rupiahFormat(saldoKeseluruhan)}
            </span>
          </Card>
        </div>
      )}
    </div>
  );
}
