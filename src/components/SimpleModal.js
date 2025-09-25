import { useEffect } from "react";

export default function SimpleModal({ content, onClose }) {
  // (Opsional tapi bagus) Kunci scroll body saat modal terbuka
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Tutup dengan tombol ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        // klik backdrop untuk menutup (jangan menutup saat klik isi modal)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl
                   max-h-[90vh] overflow-y-auto"
      >
        {/* Tombol tutup di pojok */}
        <button
          className="absolute right-3 top-3 rounded-md px-3 py-1 text-white bg-gray-600 hover:bg-blue-700"
          onClick={onClose}
          aria-label="Tutup modal"
        >
          Tutup
        </button>

        {/* Konten scrollable */}
        <div className="p-5 pt-12">
          {content}
        </div>

        {/* Footer (opsional). Bisa dibuat sticky */}
        {/* <div className="sticky bottom-0 bg-white p-4 border-t">
          <button className="px-4 py-2 rounded-md text-white bg-blue-600" onClick={onClose}>Tutup</button>
        </div> */}
      </div>
    </div>
  );
}
