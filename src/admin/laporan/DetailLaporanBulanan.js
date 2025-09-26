import { useMemo, useRef, useState, useEffect } from "react";
import { rupiahFormat } from "../../components/MoneyHeper";

// Contoh data (ganti dengan data asli dari API/props)
const dataHarian = [
  {
    tanggal: "2025-09-01",
    rumahSetor: 62,
    total: 62000,
    status: "Tidak Lengkap",
  },
  { tanggal: "2025-09-02", rumahSetor: 68, total: 68000, status: "Lengkap" },
];
const dataRapel = [
  { nomor: "12", nama: "Pak Budi", nominal: 30000 },
  { nomor: "27", nama: "Bu Sari", nominal: 30000 },
];

function AccordionItem({ id, openId, setOpenId, title, bgColor="bg-white", amount, children }) {
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
        <span className="font-semibold">{title}</span>

        {/* Angka rata kanan, lebar konsisten */}
        <span className="font-bold text-xl min-w-[14ch] text-right">
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

export default function LaporanBulananAccordion() {
  const [openId, setOpenId] = useState("harian");

  const totalHarian = useMemo(
    () => dataHarian.reduce((a, b) => a + (b.total || 0), 0),
    []
  );
  const totalRapel = useMemo(
    () => dataRapel.reduce((a, b) => a + (b.nominal || 0), 0),
    []
  );
  const totalSemua = totalHarian + totalRapel;

  return (
    <div className="space-y-4 flex flex-wrap flex-row gap-4">
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
                  <tr key={d.tanggal} className="odd:bg-white even:bg-gray-50">
                    <td className="border p-2">{d.tanggal}</td>
                    <td className="border p-2 text-center">{d.rumahSetor}</td>
                    <td className="border p-2 text-right">{rupiahFormat(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionItem>
        <div className="mt-2"></div>
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
                  <th className="border p-2 text-center">Nominal Rapel</th>
                </tr>
              </thead>
              <tbody>
                {dataRapel.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="border p-2 text-center">{r.nomor}</td>
                    <td className="border p-2">{r.nama}</td>
                    <td className="border p-2 text-right">{rupiahFormat(r.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionItem>
      </div>
      <div className="w-full">
        {/* Total keseluruhan */}
        <div className="bg-green-100 border border-purple-200 rounded-lg p-4 font-semibold shadow-md">
          <div className="flex justify-between gap-2">
            <span className="font-bold">Total Jimpitan:</span>
            <span className="font-bold text-xl text-right">
              {rupiahFormat(totalSemua)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
