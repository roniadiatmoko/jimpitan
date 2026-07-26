import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ENDPOINT_BASE_URL } from "../../../shared/config";
import Card from "../../../shared/components/ui/Card";
import Button from "../../../shared/components/ui/Button";
import Badge from "../../../shared/components/ui/Badge";

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

  const inputClass =
    "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-ink">
          Detail Database Warga
        </h1>
        <p className="text-sm text-muted">
          Kelola referensi warga lengkap dengan CRUD.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Ringkasan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-4 text-ink">
            Total Data: <span className="font-semibold">{data.length}</span>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            Sudah Menghuni:{" "}
            <span className="font-semibold">
              {data.filter((item) => item.sudah_menghuni === 1).length}
            </span>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-red-800">
            Belum Menghuni:{" "}
            <span className="font-semibold">
              {data.filter((item) => item.sudah_menghuni === 0).length}
            </span>
          </div>
        </div>
      </Card>

      <Button onClick={openAddModal}>+ Tambah Warga</Button>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {isEditing ? "Edit Warga" : "Tambah Warga"}
                </h2>
                <p className="text-sm text-muted">
                  Lengkapi data warga pada form berikut.
                </p>
              </div>
              <Button variant="secondary" onClick={closeFormModal}>
                Tutup
              </Button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                {error}
              </div>
            )}

            <form onSubmit={saveWarga} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Nomor Rumah
                  </label>
                  <input
                    type="number"
                    value={form.nomor}
                    onChange={(e) => handleInputChange("nomor", e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => handleInputChange("nama", e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted">
                  Nomor HP
                </label>
                <input
                  type="text"
                  value={form.no_hp}
                  onChange={(e) => handleInputChange("no_hp", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-muted">
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
                    className={inputClass}
                  >
                    <option value={1}>Menghuni</option>
                    <option value={0}>Belum Dihuni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Tanggal Huni
                  </label>
                  <input
                    type="date"
                    value={form.tanggal_huni}
                    onChange={(e) =>
                      handleInputChange("tanggal_huni", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" disabled={loading}>
                  {isEditing ? "Simpan Perubahan" : "Tambah Warga"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeFormModal}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Daftar Warga</h2>
            <p className="text-sm text-muted">
              Data diambil dari API /api/ref-warga.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink">
              Filter status:
            </label>
            <select
              className="rounded-lg border border-line bg-white px-3 py-2 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="menghuni">Menghuni</option>
              <option value="belum">Belum Dihuni</option>
            </select>
          </div>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-center text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Nomor</th>
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Tanggal Huni</th>
                  <th className="px-3 py-3">No HP</th>
                  <th className="px-3 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.nomor || index} className="border-t border-line odd:bg-white even:bg-surface">
                    <td className="px-3 py-2 text-center">{index + 1}</td>
                    <td className="px-3 py-2 text-center">{item.nomor}</td>
                    <td className="px-3 py-2">{item.nama}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={item.sudah_menghuni === 1 ? "success" : "danger"}>
                        {item.sudah_menghuni === 1 ? "Menghuni" : "Belum"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.tanggal_huni
                        ? format(new Date(item.tanggal_huni), "dd MMM yyyy")
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.no_hp || "-"}
                    </td>
                    <td className="px-3 py-2 text-center space-x-2">
                      <Button
                        className="!px-3 !py-1"
                        onClick={() => editWarga(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="!px-3 !py-1"
                        onClick={() => deleteWarga(item.nomor)}
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-muted"
                      colSpan={7}
                    >
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
