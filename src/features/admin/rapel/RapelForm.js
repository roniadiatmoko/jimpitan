import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import Select from "react-select";
import { ENDPOINT_BASE_URL, homeList, months } from "../../../shared/config";
import { getDaysInMonth } from "../../../shared/helpers/DateHelper";
import { rupiahFormat } from "../../../shared/helpers/MoneyHeper";
import Button from "../../../shared/components/ui/Button";
import DatePicker from "react-datepicker";

// Komponen terpisah untuk formulir Rapel Jimpitan
const parsePeriodToDate = (period) => {
  if (!period) return null;
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return null;
  return new Date(year, month - 1, 1);
};

export default function RapelForm({
  onSuccess,
  onCancel,
  nomorRumah = null,
  initialPeriod,
  wargaList: propWargaList,
}) {
  const [wargaList, setWargaList] = useState(propWargaList || homeList);
  const [rapelNominal, setRapelNominal] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    parsePeriodToDate(initialPeriod) || new Date()
  );
  const [selectedHouse, setSelectedHouse] = useState("");
  const [isLunaskan, setIsLunaskan] = useState(false);
  const [loadingKebutuhan, setLoadingKebutuhan] = useState(false);
  const [kebutuhanInfo, setKebutuhanInfo] = useState(null);

  // Ambil ref-warga terkini jika belum diberikan via props
  useEffect(() => {
    if (propWargaList && propWargaList.length > 0) {
      setWargaList(propWargaList);
      return;
    }

    const fetchRefWarga = async () => {
      try {
        const res = await fetch(`${ENDPOINT_BASE_URL}/api/ref-warga`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "OK" && Array.isArray(json.data) && json.data.length > 0) {
            const sorted = [...json.data].sort(
              (a, b) => Number(a.nomor) - Number(b.nomor)
            );
            setWargaList(sorted);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat ref-warga di RapelForm:", err);
      }
    };
    fetchRefWarga();
  }, [propWargaList]);

  const houseOptions = useMemo(() => {
    return wargaList.map((h) => ({
      value: Number(h.nomor),
      label: `No. ${h.nomor} — ${h.nama}`,
    }));
  }, [wargaList]);

  useEffect(() => {
    if (nomorRumah) {
      const match = houseOptions.find(
        (opt) => opt.value === Number(nomorRumah)
      );
      if (match) setSelectedHouse(match.value);
    }
  }, [nomorRumah, houseOptions]);

  useEffect(() => {
    const parsed = parsePeriodToDate(initialPeriod);
    if (parsed) {
      setSelectedMonth(parsed);
    }
  }, [initialPeriod]);

  // Efek untuk otomatis mengambil kebutuhan nominal lunas saat checklist "Lunaskan bulan ini" aktif
  useEffect(() => {
    let cancelled = false;

    if (!isLunaskan || !selectedHouse) {
      if (!isLunaskan) setKebutuhanInfo(null);
      return;
    }

    const fetchKebutuhan = async () => {
      setLoadingKebutuhan(true);
      try {
        const periodStr = `${selectedMonth.getFullYear()}-${(
          selectedMonth.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`;
        const res = await fetch(
          `${ENDPOINT_BASE_URL}/api/rapel/kebutuhan-lunas/${selectedHouse}/${periodStr}`
        );
        const data = await res.json();
        if (!cancelled && data.status === "OK") {
          setKebutuhanInfo(data);
          setRapelNominal(String(data.nominal_lunas));
        }
      } catch (err) {
        console.error("Gagal mengambil kebutuhan lunas:", err);
      } finally {
        if (!cancelled) setLoadingKebutuhan(false);
      }
    };

    fetchKebutuhan();

    return () => {
      cancelled = true;
    };
  }, [isLunaskan, selectedHouse, selectedMonth]);

  const handleRapelSubmit = async () => {
    if (!selectedHouse) {
      Swal.fire("Pilih Rumah!", "Silakan pilih nomor rumah terlebih dahulu.", "error");
      return;
    }

    if (!rapelNominal || parseInt(rapelNominal) <= 0) {
      Swal.fire("Isi Nominal!", "Nominal rapel harus lebih dari 0.", "error");
      return;
    }

    if (parseInt(rapelNominal) % 500 !== 0) {
      Swal.fire(
        "Nominal Tidak Valid!",
        "Nominal rapel harus kelipatan Rp 500.",
        "warning"
      );
      return;
    }

    try {
      const formattedMonth = `${selectedMonth.getFullYear()}-${(
        selectedMonth.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;

      const response = await fetch(`${ENDPOINT_BASE_URL}/api/rapel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomor_rumah: selectedHouse,
          nominal: parseInt(rapelNominal),
          bulan: formattedMonth,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          title: "Berhasil!",
          text: `Rapel untuk rumah no ${selectedHouse} berhasil disimpan.`,
          icon: "success",
        });
        setRapelNominal("");
        setIsLunaskan(false);
        setKebutuhanInfo(null);
        onSuccess?.();
      } else {
        throw new Error(result.message || "Gagal mencatat rapel");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal Disimpan!", err.message, "error");
    }
  };

  const selectedMonthObj = months.find(
    (m) => m.value === selectedMonth.getMonth() + 1
  );
  const daysCount = getDaysInMonth(
    (selectedMonth.getMonth() + 1).toString().padStart(2, "0"),
    selectedMonth.getFullYear()
  );

  return (
    <div>
      {/* Header Modal */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-ink">Formulir Rapel Jimpitan</h1>
        <p className="mt-1 text-xs text-muted">
          Catat pelunasan jimpitan warga secara fleksibel per bulan
        </p>
      </div>

      {/* Grid 3 Kolom Responsif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Kolom 1: Nomor Rumah */}
        <div className="flex flex-col">
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            Nomor Rumah <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="Pilih Rumah..."
            options={houseOptions}
            value={
              houseOptions.find((opt) => opt.value === selectedHouse) || null
            }
            onChange={(selected) => setSelectedHouse(selected ? selected.value : "")}
            isClearable
            className="text-sm"
            styles={{
              control: (base, state) => ({
                ...base,
                borderRadius: "0.5rem",
                borderColor: state.isFocused ? "#2563eb" : "#cbd5e1",
                boxShadow: state.isFocused ? "0 0 0 2px rgba(37,99,235,0.2)" : "none",
                minHeight: "42px",
              }),
            }}
          />
        </div>

        {/* Kolom 2: Nominal */}
        <div className="flex flex-col">
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            Nominal Rapel <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={rapelNominal}
            onChange={(e) => {
              setRapelNominal(e.target.value);
              if (isLunaskan) setIsLunaskan(false);
            }}
            className="w-full rounded-lg border border-line p-2.5 text-ink text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Contoh: 15000"
          />

          {/* Checklist Lunaskan Bulan Ini */}
          <div className="mt-2.5 flex items-center gap-2">
            <input
              type="checkbox"
              id="checkbox-lunaskan"
              checked={isLunaskan}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsLunaskan(checked);
                if (checked && !selectedHouse) {
                  Swal.fire({
                    title: "Pilih Rumah Terlebih Dahulu",
                    text: "Silakan pilih nomor rumah terlebih dahulu agar sistem dapat menghitung kebutuhan rapel pelunasan.",
                    icon: "info",
                  });
                }
              }}
              className="h-4 w-4 rounded border-line text-accent focus:ring-accent cursor-pointer"
            />
            <label
              htmlFor="checkbox-lunaskan"
              className="text-xs font-semibold text-ink cursor-pointer select-none flex items-center gap-1.5"
            >
              <span>Lunaskan bulan ini</span>
              {loadingKebutuhan && (
                <span className="text-[10px] text-muted font-normal animate-pulse">
                  (menghitung...)
                </span>
              )}
            </label>
          </div>

          {/* Keterangan kebutuhan lunas */}
          {kebutuhanInfo && (
            <div className="mt-1.5 text-xs">
              {kebutuhanInfo.sisa_hari === 0 ? (
                <span className="font-semibold text-emerald-600 block">
                  ✨ Rumah ini sudah LUNAS untuk bulan ini (0 hari kosong).
                </span>
              ) : (
                <span className="text-accent font-medium block">
                  Kurang <b>{kebutuhanInfo.sisa_hari} hari</b> ({rupiahFormat(kebutuhanInfo.nominal_lunas)}) untuk lunas penuh.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kolom 3: Bulan */}
        <div className="flex flex-col">
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            Periode Bulan <span className="text-red-500">*</span>
          </label>
          <DatePicker
            customInput={
              <input
                inputMode="none"
                onKeyDown={(e) => e.preventDefault()}
                autoComplete="off"
              />
            }
            selected={selectedMonth}
            onChange={(date) => setSelectedMonth(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            wrapperClassName="w-full"
            className="w-full rounded-lg border border-line p-2.5 text-ink text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          />
        </div>
      </div>

      {/* Ringkasan Informasi */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-center text-xs text-blue-950 mb-6 leading-relaxed">
        Bulan <b>{selectedMonthObj?.label} {selectedMonth.getFullYear()}</b> terdapat <b>{daysCount} hari</b> ({rupiahFormat(daysCount * 500)}).
        <br />
        Nominal di atas akan mengisi{" "}
        <span className="font-bold text-accent">
          {rapelNominal ? Math.floor(parseInt(rapelNominal) / 500) : 0} hari
        </span>{" "}
        jimpitan kosong.
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleRapelSubmit} className="flex-1 py-3 text-sm font-semibold">
          Simpan Rapel
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} className="py-3 px-6 text-sm">
            Tutup
          </Button>
        )}
      </div>
    </div>
  );
}
