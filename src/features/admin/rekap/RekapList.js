import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import CurrencyInput from "react-currency-input-field";
import { ENDPOINT_BASE_URL, months } from "../../../shared/config";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";

const pad2 = (n) => String(n).padStart(2, "0");

export default function RekapList() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editPemasukan, setEditPemasukan] = useState("");
  const [editPengeluaran, setEditPengeluaran] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editKunciSinkron, setEditKunciSinkron] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [formTahun, setFormTahun] = useState(String(currentYear));
  const [formBulan, setFormBulan] = useState(1);
  const [formPemasukan, setFormPemasukan] = useState("");
  const [formPengeluaran, setFormPengeluaran] = useState("");
  const [formKeterangan, setFormKeterangan] = useState("");

  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncFromTahun, setSyncFromTahun] = useState("2025");
  const [syncFromBulan, setSyncFromBulan] = useState(1);
  const [syncToTahun, setSyncToTahun] = useState(String(currentYear));
  const [syncToBulan, setSyncToBulan] = useState(new Date().getMonth() + 1);
  const [syncing, setSyncing] = useState(false);

  const yearOptions = useMemo(() => {
    const start = 2025;
    const length = Math.max(currentYear - start + 1, 1);
    return Array.from({ length }, (_, idx) => String(start + idx));
  }, [currentYear]);

  const fetchRekapTahun = async (selectedYear) => {
    setLoading(true);
    try {
      const results = await Promise.all(
        months.map(async (m) => {
          try {
            const res = await fetch(
              `${ENDPOINT_BASE_URL}/api/rekap/${selectedYear}/${pad2(m.value)}`
            );
            const json = await res.json();
            return {
              bulan: m.value,
              label: m.label,
              saldo_sebelumnya: json.data?.saldo_sebelumnya || 0,
              pemasukan: json.data?.pemasukan || 0,
              pengeluaran: json.data?.pengeluaran || 0,
              sisa_saldo: json.data?.sisa_saldo || 0,
              is_kunci_sinkron: Number(json.data?.is_kunci_sinkron) === 1 ? 1 : 0,
            };
          } catch (err) {
            console.log(err);
            return {
              bulan: m.value,
              label: m.label,
              saldo_sebelumnya: 0,
              pemasukan: 0,
              pengeluaran: 0,
              sisa_saldo: 0,
              is_kunci_sinkron: 0,
            };
          }
        })
      );
      setRows(results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekapTahun(year);
  }, [year]);

  const openAddForm = () => {
    setFormTahun(year);
    setFormBulan(1);
    setFormPemasukan("");
    setFormPengeluaran("");
    setFormKeterangan("");
    setShowAddForm(true);
  };

  const handleTambahRekap = async () => {
    if (!formTahun || !formBulan) {
      Swal.fire("Perhatian", "Tahun dan bulan harus diisi.", "warning");
      return;
    }
    if (formPemasukan === "" || formPengeluaran === "") {
      Swal.fire(
        "Perhatian",
        "Pemasukan dan pengeluaran harus diisi.",
        "warning"
      );
      return;
    }

    setSaving(true);
    Swal.fire({
      title: "Menyimpan...",
      text: "Menyimpan rekap manual, mohon tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const namaBulan =
        months.find((m) => m.value === Number(formBulan))?.label || formBulan;
      const keterangan =
        formKeterangan.trim() || `Rekap manual ${namaBulan} ${formTahun}`;

      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rekap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tahun: String(formTahun),
          bulan: pad2(formBulan),
          pemasukan: Number(formPemasukan),
          pengeluaran: Number(formPengeluaran),
          keterangan,
          secret_key: "rahasiakita123",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan rekap");
      }

      setShowAddForm(false);
      if (String(formTahun) === String(year)) {
        await fetchRekapTahun(year);
      } else {
        setYear(String(formTahun));
      }
      Swal.fire(
        "Berhasil",
        result.message || "Rekap berhasil disimpan.",
        "success"
      );
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", err.message || "Gagal menyimpan rekap.", "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (row) => {
    setEditRow(row);
    setEditPemasukan(String(row.pemasukan || 0));
    setEditPengeluaran(String(row.pengeluaran || 0));
    setEditKeterangan("");
    setEditKunciSinkron(Number(row.is_kunci_sinkron) === 1);
    setShowEditModal(true);
  };

  const previewSisaSaldo = editRow
    ? (Number(editRow.saldo_sebelumnya) || 0) +
      (Number(editPemasukan) || 0) -
      (Number(editPengeluaran) || 0)
    : 0;

  const handleSimpanNominal = async () => {
    if (!editRow) return;

    if (editPemasukan === "" || editPengeluaran === "") {
      Swal.fire(
        "Perhatian",
        "Pemasukan dan pengeluaran harus diisi.",
        "warning"
      );
      return;
    }

    setEditSaving(true);
    Swal.fire({
      title: "Menyimpan...",
      text: "Memperbarui nominal, mohon tunggu",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const keterangan =
        editKeterangan.trim() ||
        `Perbarui nominal ${editRow.label} ${year}`;

      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rekap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tahun: String(year),
          bulan: pad2(editRow.bulan),
          pemasukan: Number(editPemasukan),
          pengeluaran: Number(editPengeluaran),
          keterangan,
          is_kunci_sinkron: editKunciSinkron ? 1 : 0,
          secret_key: "rahasiakita123",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui nominal");
      }

      setShowEditModal(false);
      await fetchRekapTahun(year);
      Swal.fire(
        "Berhasil",
        result.message || "Nominal berhasil diperbarui.",
        "success"
      );
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", err.message || "Gagal memperbarui nominal.", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const openSyncModal = () => {
    setSyncFromTahun("2025");
    setSyncFromBulan(1);
    setSyncToTahun(String(currentYear));
    setSyncToBulan(new Date().getMonth() + 1);
    setShowSyncModal(true);
  };

  const computeRekapForPeriod = async (tahun, bulan) => {
    const period = `${tahun}-${pad2(bulan)}`;

    const [harianRes, rapelRes, pengeluaranRes] = await Promise.all([
      fetch(`${ENDPOINT_BASE_URL}/api/jimpitan/${period}`),
      fetch(`${ENDPOINT_BASE_URL}/api/rapel-bulanan/${period}`),
      fetch(`${ENDPOINT_BASE_URL}/api/pengeluaran/${period}`),
    ]);

    const [harianJson, rapelJson, pengeluaranJson] = await Promise.all([
      harianRes.json(),
      rapelRes.json(),
      pengeluaranRes.json(),
    ]);

    const totalHarian = (harianJson.data || []).reduce(
      (a, b) => a + (b.nominal || 0),
      0
    );
    const totalRapel = (rapelJson.rapelBulanan || []).reduce(
      (a, b) => a + (b.nominal || 0),
      0
    );
    const pengeluaranBulan = (pengeluaranJson.pengeluaran || []).reduce(
      (a, b) => a + (Number(b.nominal) || 0),
      0
    );

    return {
      pemasukan: totalHarian + totalRapel,
      pengeluaran: pengeluaranBulan,
    };
  };

  const buildPeriodRange = (fromTahun, fromBulan, toTahun, toBulan) => {
    const periods = [];
    let y = Number(fromTahun);
    let m = Number(fromBulan);
    const endY = Number(toTahun);
    const endM = Number(toBulan);

    while (y < endY || (y === endY && m <= endM)) {
      periods.push({ tahun: y, bulan: m });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    return periods;
  };

  const handleSinkron = async () => {
    const periods = buildPeriodRange(
      syncFromTahun,
      syncFromBulan,
      syncToTahun,
      syncToBulan
    );

    if (periods.length === 0) {
      Swal.fire("Perhatian", "Rentang periode tidak valid.", "warning");
      return;
    }

    const fromLabel = `${months.find((m) => m.value === Number(syncFromBulan))?.label} ${syncFromTahun}`;
    const toLabel = `${months.find((m) => m.value === Number(syncToBulan))?.label} ${syncToTahun}`;

    const confirm = await Swal.fire({
      title: "Sinkron Semua Periode?",
      html: `Akan menghitung ulang <b>${periods.length} periode</b> secara urut dari <b>${fromLabel}</b> sampai <b>${toLabel}</b>. Pemasukan &amp; pengeluaran tiap bulan dihitung ulang dari data jimpitan harian, rapel, dan pengeluaran (persis seperti tombol "Simpan Ulang Rekap" di Laporan Bulanan), lalu saldo_sebelumnya dan sisa_saldo mengalir urut dari bulan ke bulan.<br/><br/>Periode dengan status <b>Kunci Sinkron = Ya</b> akan dilewati dan tetap memakai nilai yang sudah ada.<br/><br/>Proses berjalan satu per satu dan bisa memakan waktu beberapa saat.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, sinkron",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSyncing(true);
    Swal.fire({
      title: "Menyinkronkan...",
      html: `Memproses periode 0 / ${periods.length}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const failedPeriods = [];
    const skippedPeriods = [];

    try {
      for (let i = 0; i < periods.length; i++) {
        const { tahun, bulan } = periods[i];
        const namaBulan = months.find((m) => m.value === bulan)?.label || bulan;

        try {
          const checkRes = await fetch(
            `${ENDPOINT_BASE_URL}/api/rekap/${tahun}/${pad2(bulan)}`
          );
          const checkJson = await checkRes.json();
          const isLocked = Number(checkJson.data?.is_kunci_sinkron) === 1;

          if (isLocked) {
            skippedPeriods.push(`${namaBulan} ${tahun}`);
          } else {
            const { pemasukan, pengeluaran } = await computeRekapForPeriod(
              tahun,
              bulan
            );

            const postRes = await fetch(`${ENDPOINT_BASE_URL}/api/rekap`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tahun: String(tahun),
                bulan: pad2(bulan),
                pemasukan,
                pengeluaran,
                keterangan: `Sinkron ulang ${namaBulan} ${tahun}`,
                secret_key: "rahasiakita123",
              }),
            });
            const postJson = await postRes.json();
            if (!postRes.ok) {
              throw new Error(postJson.message || "Gagal sinkron periode ini");
            }
          }
        } catch (err) {
          console.log(err);
          failedPeriods.push(`${namaBulan} ${tahun}`);
        }

        Swal.update({ html: `Memproses periode ${i + 1} / ${periods.length}` });
      }

      setShowSyncModal(false);
      await fetchRekapTahun(year);

      const processedCount =
        periods.length - failedPeriods.length - skippedPeriods.length;
      const summaryParts = [`${processedCount} periode berhasil disinkronkan`];
      if (skippedPeriods.length > 0) {
        summaryParts.push(
          `${skippedPeriods.length} periode dilewati karena terkunci (${skippedPeriods.join(", ")})`
        );
      }
      if (failedPeriods.length > 0) {
        summaryParts.push(
          `${failedPeriods.length} periode gagal (${failedPeriods.join(", ")})`
        );
      }

      Swal.fire(
        failedPeriods.length > 0 ? "Selesai dengan sebagian gagal" : "Berhasil",
        summaryParts.join(". ") + ".",
        failedPeriods.length > 0 ? "warning" : "success"
      );
    } catch (err) {
      console.log(err);
      Swal.fire("Gagal", err.message || "Gagal melakukan sinkronisasi.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const totalPemasukan = rows.reduce(
    (a, b) => a + (Number(b.pemasukan) || 0),
    0
  );
  const totalPengeluaran = rows.reduce(
    (a, b) => a + (Number(b.pengeluaran) || 0),
    0
  );

  return (
    <div className="m-4 bg-white shadow-md p-4 rounded-xl">
      <h1 className="text-center font-bold text-2xl text-green-700 mb-6">
        Daftar Rekap Saldo
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Pilih Tahun
          </label>
          <select
            className="w-48 rounded-md border border-gray-300 bg-white px-3 py-2"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openSyncModal}
            className="bg-purple-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-purple-700 transition"
          >
            🔁 Sinkron
          </button>
          <button
            type="button"
            onClick={openAddForm}
            className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
          >
            + Tambah Rekap
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900 mb-4">
          Memuat data rekap...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-3 py-2 border">Tahun</th>
              <th className="px-3 py-2 border">Bulan</th>
              <th className="px-3 py-2 border">Saldo Sebelumnya</th>
              <th className="px-3 py-2 border">Pemasukan</th>
              <th className="px-3 py-2 border">Pengeluaran</th>
              <th className="px-3 py-2 border">Sisa Saldo</th>
              <th className="px-3 py-2 border">Kunci Sinkron</th>
              <th className="px-3 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.bulan} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 border text-center">{year}</td>
                <td className="px-3 py-2 border text-center">{row.label}</td>
                <td className="px-3 py-2 border text-right">
                  {rupiahFormat(row.saldo_sebelumnya)}
                </td>
                <td className="px-3 py-2 border text-right">
                  {rupiahFormat(row.pemasukan)}
                </td>
                <td className="px-3 py-2 border text-right">
                  {rupiahFormat(row.pengeluaran)}
                </td>
                <td className="px-3 py-2 border text-right font-semibold">
                  {rupiahFormat(row.sisa_saldo)}
                </td>
                <td className="px-3 py-2 border text-center">
                  {row.is_kunci_sinkron === 1 ? (
                    <span className="text-red-700 font-semibold">
                      🔒 Ya
                    </span>
                  ) : (
                    <span className="text-gray-400">Tidak</span>
                  )}
                </td>
                <td className="px-3 py-2 border text-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(row)}
                    className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow hover:bg-blue-700 transition"
                  >
                    ✏️ Perbarui Nominal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td className="px-3 py-2 border text-center" colSpan={3}>
                Total Tahun {year}
              </td>
              <td className="px-3 py-2 border text-right">
                {rupiahFormat(totalPemasukan)}
              </td>
              <td className="px-3 py-2 border text-right">
                {rupiahFormat(totalPengeluaran)}
              </td>
              <td className="px-3 py-2 border"></td>
              <td className="px-3 py-2 border"></td>
              <td className="px-3 py-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-xl font-bold text-center text-green-700 mb-4">
              Tambah Rekap Manual
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Tahun</label>
                <input
                  type="number"
                  value={formTahun}
                  onChange={(e) => setFormTahun(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contoh: 2023"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Bulan</label>
                <select
                  value={formBulan}
                  onChange={(e) => setFormBulan(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 bg-white rounded"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pemasukan</label>
                <input
                  type="number"
                  value={formPemasukan}
                  onChange={(e) => setFormPemasukan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contoh: 1500000"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pengeluaran</label>
                <input
                  type="number"
                  value={formPengeluaran}
                  onChange={(e) => setFormPengeluaran(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contoh: 500000"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contoh: Rekap dari buku kas lama"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold p-2 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTambahRekap}
                disabled={saving}
                className="flex-1 bg-green-600 text-white font-bold p-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-xl font-bold text-center text-blue-700 mb-1">
              Perbarui Nominal
            </h2>
            <p className="text-center text-sm text-gray-500 mb-4">
              {editRow.label} {year}
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Pemasukan</label>
                <CurrencyInput
                  id="editPemasukan"
                  name="editPemasukan"
                  placeholder="Contoh: Rp 1.500.000"
                  value={editPemasukan}
                  decimalsLimit={0}
                  groupSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  className="w-full p-2 border border-gray-300 rounded"
                  onValueChange={(value) => setEditPemasukan(value || "")}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Pengeluaran</label>
                <CurrencyInput
                  id="editPengeluaran"
                  name="editPengeluaran"
                  placeholder="Contoh: Rp 500.000"
                  value={editPengeluaran}
                  decimalsLimit={0}
                  groupSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                  className="w-full p-2 border border-gray-300 rounded"
                  onValueChange={(value) => setEditPengeluaran(value || "")}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Keterangan (opsional)
                </label>
                <input
                  type="text"
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Contoh: Koreksi data lampau"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">
                  Kunci Sinkron
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="editKunciSinkron"
                      checked={editKunciSinkron === true}
                      onChange={() => setEditKunciSinkron(true)}
                    />
                    Ya
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="editKunciSinkron"
                      checked={editKunciSinkron === false}
                      onChange={() => setEditKunciSinkron(false)}
                    />
                    Tidak
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jika "Ya", periode ini tidak akan dihitung ulang saat tombol
                  Sinkron dijalankan.
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="text-xs text-gray-500">
                  Saldo Sebelumnya: {rupiahFormat(editRow.saldo_sebelumnya)}
                </div>
                <div className="mt-1 flex justify-between font-semibold text-blue-800">
                  <span>Perkiraan Sisa Saldo</span>
                  <span>{rupiahFormat(previewSisaSaldo)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 italic">
                  Nilai final dihitung ulang oleh server setelah disimpan.
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 font-bold p-2 rounded-lg hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpanNominal}
                disabled={editSaving}
                className="flex-1 bg-blue-600 text-white font-bold p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
            <h2 className="text-xl font-bold text-center text-purple-700 mb-2">
              Sinkron Rekap
            </h2>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Menghitung ulang saldo sebelumnya &amp; sisa saldo untuk semua
              periode secara urut, dari periode awal sampai akhir.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 mb-1">Dari Tahun</label>
                <select
                  value={syncFromTahun}
                  onChange={(e) => setSyncFromTahun(e.target.value)}
                  className="w-full p-2 border border-gray-300 bg-white rounded"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Dari Bulan</label>
                <select
                  value={syncFromBulan}
                  onChange={(e) => setSyncFromBulan(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 bg-white rounded"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Sampai Tahun
                </label>
                <select
                  value={syncToTahun}
                  onChange={(e) => setSyncToTahun(e.target.value)}
                  className="w-full p-2 border border-gray-300 bg-white rounded"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">
                  Sampai Bulan
                </label>
                <select
                  value={syncToBulan}
                  onChange={(e) => setSyncToBulan(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 bg-white rounded"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                disabled={syncing}
                className="flex-1 bg-gray-200 text-gray-700 font-bold p-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSinkron}
                disabled={syncing}
                className="flex-1 bg-purple-600 text-white font-bold p-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? "Memproses..." : "Mulai Sinkron"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
