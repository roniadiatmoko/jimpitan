import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ENDPOINT_BASE_URL } from "../../../shared/config";

const initialFormState = {
  nomor: "",
  nama: "",
  sudah_menghuni: 0,
  tanggal_huni: "",
  no_hp: "",
};

export default function RefWarga() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editNomor, setEditNomor] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga`);
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "Gagal memuat data warga");
      }
      setData(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal memuat data warga");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInputChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setIsEditing(false);
    setEditNomor(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  const saveWarga = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        nomor: form.nomor ? Number(form.nomor) : undefined,
        nama: form.nama,
        sudah_menghuni: Number(form.sudah_menghuni),
        tanggal_huni: form.tanggal_huni || null,
        no_hp: form.no_hp,
      };

      const url = isEditing
        ? `${ENDPOINT_BASE_URL}/api/ref-warga/${editNomor}`
        : `${ENDPOINT_BASE_URL}/api/ref-warga`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "Gagal menyimpan data warga");
      }
      await loadData();
      resetForm();
      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal menyimpan data warga");
    } finally {
      setLoading(false);
    }
  };

  const editWarga = (item) => {
    setForm({
      nomor: item.nomor ?? "",
      nama: item.nama || "",
      sudah_menghuni: item.sudah_menghuni || 0,
      tanggal_huni: item.tanggal_huni || "",
      no_hp: item.no_hp || "",
    });
    setIsEditing(true);
    setEditNomor(item.nomor);
    setShowFormModal(true);
  };

  const deleteWarga = async (nomor) => {
    if (!window.confirm("Hapus data warga ini?")) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${ENDPOINT_BASE_URL}/api/ref-warga/${nomor}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (!response.ok || result.status !== "OK") {
        throw new Error(result.message || "Gagal menghapus data warga");
      }
      await loadData();
      if (editNomor === nomor) resetForm();
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal menghapus data warga");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item) => {
      const isMenghuni = item.sudah_menghuni === 1;
      return statusFilter === "menghuni" ? isMenghuni : !isMenghuni;
    });
  }, [data, statusFilter]);

  return (
    <div className="m-4 bg-white shadow-md p-4 rounded-xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sky-700">
            Detail Database Warga
          </h1>
          <p className="text-sm text-gray-600">
            Kelola referensi warga lengkap dengan CRUD.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex-1">
          <h2 className="mb-4 text-lg font-semibold">Ringkasan</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-green-50 p-4 text-green-800">
              Total Data: <span className="font-semibold">{data.length}</span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 text-blue-800">
              Sudah Menghuni:{" "}
              <span className="font-semibold">
                {data.filter((item) => item.sudah_menghuni === 1).length}
              </span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-red-50 p-4 text-red-800">
              Belum Menghuni:{" "}
              <span className="font-semibold">
                {data.filter((item) => item.sudah_menghuni === 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openAddModal}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Tambah Warga
        </button>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {isEditing ? "Edit Warga" : "Tambah Warga"}
                </h2>
                <p className="text-sm text-slate-500">
                  Lengkapi data warga pada form berikut.
                </p>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {error}
              </div>
            )}

            <form onSubmit={saveWarga} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nomor Rumah
                  </label>
                  <input
                    type="number"
                    value={form.nomor}
                    onChange={(e) => handleInputChange("nomor", e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => handleInputChange("nama", e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={form.no_hp}
                  onChange={(e) => handleInputChange("no_hp", e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={form.sudah_menghuni}
                    onChange={(e) =>
                      handleInputChange(
                        "sudah_menghuni",
                        Number(e.target.value),
                      )
                    }
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2"
                  >
                    <option value={1}>Menghuni</option>
                    <option value={0}>Belum Dihuni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tanggal Huni
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_huni}
                    onChange={(e) =>
                      handleInputChange("tanggal_huni", e.target.value)
                    }
                    className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  disabled={loading}
                >
                  {isEditing ? "Simpan Perubahan" : "Tambah Warga"}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                  onClick={closeFormModal}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Daftar Warga</h2>
            <p className="text-sm text-gray-500">
              Data diambil dari API /api/ref-warga.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Filter status:
            </label>
            <select
              className="rounded border border-gray-300 bg-white px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="menghuni">Menghuni</option>
              <option value="belum">Belum Dihuni</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-sky-600 text-white">
              <tr>
                <th className="px-3 py-2 border">#</th>
                <th className="px-3 py-2 border">Nomor</th>
                <th className="px-3 py-2 border">Nama</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Tanggal Huni</th>
                <th className="px-3 py-2 border">No HP</th>
                <th className="px-3 py-2 border">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={item.nomor || index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-3 py-2 border text-center">{index + 1}</td>
                  <td className="px-3 py-2 border text-center">{item.nomor}</td>
                  <td className="px-3 py-2 border">{item.nama}</td>
                  <td className="px-3 py-2 border text-center">
                    <span
                      className={
                        item.sudah_menghuni === 1
                          ? "inline-flex rounded-full bg-green-200 px-3 py-1 text-xs font-bold text-green-800"
                          : "inline-flex rounded-full bg-red-200 px-3 py-1 text-xs font-bold text-red-800"
                      }
                    >
                      {item.sudah_menghuni === 1 ? "Menghuni" : "Belum"}
                    </span>
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {item.tanggal_huni
                      ? format(new Date(item.tanggal_huni), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {item.no_hp || "-"}
                  </td>
                  <td className="px-3 py-2 border text-center space-x-2">
                    <button
                      type="button"
                      className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700"
                      onClick={() => editWarga(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      onClick={() => deleteWarga(item.nomor)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 border text-center text-gray-500"
                    colSpan={7}
                  >
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
