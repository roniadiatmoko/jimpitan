import { useMemo, useRef, useState, useEffect } from "react";
import { rupiahFormat } from "../../components/MoneyHeper";
import { ENDPOINT_BASE_URL, homeList } from "../../config";

function AccordionItem({
  id,
  openId,
  setOpenId,
  title,
  bgColor = "bg-white",
  amount,
  children,
}) {
  const isOpen = openId === id;
  const contentRef = useRef(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) setMaxH(contentRef.current.scrollHeight);
    else setMaxH(0);
  }, [isOpen, children]);

  return (
    <div className={`border rounded-lg ${bgColor} shadow-md`}>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
        onClick={() => setOpenId(isOpen ? null : id)}
      >
        <span className="font-semibold">
          {isOpen ? "▲" : "▼"} {title}
        </span>

        {/* Angka rata kanan, lebar konsisten */}
        <span className="font-bold text-lg min-w-[14ch] text-right">
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
        `${ENDPOINT_BASE_URL}/api/pengeluaran-bulan/2025-09`
      );
      const data = await res.json();
      setDataPengeluaran(data);
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
    () => dataPengeluaran.reduce((a, b) => a + (b.total || 0), 0),
    [dataPengeluaran]
  );

  useEffect(() => {
    apiDataHarian();
    apiDataRapel();

    // apiDataPengeluaran();
    setLoading(false);
  }, [period]);

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center mt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      ) : (
        <div>
          <div className="w-full">
            <AccordionItem
              id="harian"
              openId={openId}
              setOpenId={setOpenId}
              title="📅 Jimpitan Harian"
              bgColor="bg-purple-100"
              amount={totalHarian}
            >
              <div className="overflow-x-auto">
                <table className="border-collapse text-sm w-full">
                  <thead className="bg-purple-300">
                    <tr>
                      <th className="border p-2 text-center">Tanggal</th>
                      <th className="border p-2 text-center">Rumah Terisi</th>
                      <th className="border p-2 text-center">Total Jimpitan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataHarian.map((d) => (
                      <tr
                        key={d.tanggal}
                        className="odd:bg-white even:bg-gray-50"
                      >
                        <td className="border p-2">{d.tanggal}</td>
                        <td className="border p-2 text-center">
                          {d.terisi}/{homeList.length}
                        </td>
                        <td className="border p-2 text-right">
                          {rupiahFormat(d.nominal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionItem>
            <div className="mt-1"></div>
            <AccordionItem
              id="rapel"
              openId={openId}
              setOpenId={setOpenId}
              title="🏠 Jimpitan Rapel"
              bgColor="bg-blue-100"
              amount={totalRapel}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-blue-300">
                    <tr>
                      <th className="border p-2 text-center">No Rumah</th>
                      <th className="border p-2 text-center">Nama Penghuni</th>
                      <th className="border p-2 text-center">Jumlah Rapel</th>
                      <th className="border p-2 text-center">Nominal Rapel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataRapel.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="border p-2 text-center">
                          {r.nomor_rumah}
                        </td>
                        <td className="border p-2">
                          {" "}
                          {homeList.find(
                            (h) => h.nomor === Number(r.nomor_rumah)
                          )?.nama || "-"}
                        </td>
                        <td className="border p-2 text-center">
                          {r.jumlah_rapel} Hari
                        </td>
                        <td className="border p-2 text-right">
                          {rupiahFormat(r.nominal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionItem>
          </div>

          <div className="w-full mt-1">
            {/* Total Bulan Ini */}
            <div className="bg-green-100 border border-purple-200 rounded-lg p-4 font-semibold shadow-md">
              <div className="flex justify-between gap-2">
                <span className="font-bold">💰 Total Jimpitan Bulan Ini</span>
                <span className="font-bold text-lg text-right">
                  {rupiahFormat(totalSemua)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full mt-1">
            {/* Pengeluaran Bulan Ini */}
            <AccordionItem
              id="pengeluaran"
              openId={openId}
              setOpenId={setOpenId}
              title="⛔ Pengeluaran Bulan Ini"
              bgColor="bg-red-100"
              amount={pengeluaranBulan}
            >
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-red-300">
                    <tr>
                      <th className="border p-2 text-center">No</th>
                      <th className="border p-2 text-center">Tanggal</th>
                      <th className="border p-2 text-center">Keperluan</th>
                      <th className="border p-2 text-center">Nominal</th>
                      <th className="border p-2 text-center">PIC</th>
                      <th className="border p-2 text-center">
                        Bukti (Opsional)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataPengeluaran.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="border p-2 text-center">{r.nomor}</td>
                        <td className="border p-2">{r.nama}</td>
                        <td className="border p-2">{r.nama}</td>
                        <td className="border p-2 text-right">
                          {rupiahFormat(r.nominal)}
                        </td>
                        <td className="border p-2">{r.nama}</td>
                        <td className="border p-2">{r.nama}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionItem>
          </div>

          <div className="w-full mt-10">
            {/* Pengeluaran Bulan Ini */}
            <div className="bg-orange-300 border border-orange-400 rounded-lg p-4 font-semibold shadow-md">
              <div className="flex justify-between gap-2">
                <span className="font-bold">💴 Saldo Sebelumnya </span>
                <span className="font-bold text-xl text-right">
                  {rupiahFormat(saldoSebelumnya)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full mt-1">
            {/* Pengeluaran Bulan Ini */}
            <div className="bg-green-300 border border-green-400 rounded-lg p-4 font-semibold shadow-md">
              <div className="flex justify-between gap-2">
                <span className="font-bold">💳 Sisa Saldo Keseluruhan </span>
                <span className="font-bold text-xl text-right">
                  {rupiahFormat(saldoKeseluruhan)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
