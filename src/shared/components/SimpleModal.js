import { useEffect } from "react";

export default function SimpleModal({ content, onClose, maxWidth }) {
  // Kunci scroll body saat modal terbuka
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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`relative w-full ${
          maxWidth || "max-w-3xl lg:max-w-4xl"
        } bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-line`}
      >
        {/* Tombol tutup di pojok */}
        <button
          className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-slate-200 hover:text-ink transition"
          onClick={onClose}
          aria-label="Tutup modal"
        >
          ✕ Tutup
        </button>

        {/* Konten modal */}
        <div className="p-6 sm:p-8 pt-12">
          {content}
        </div>
      </div>
    </div>
  );
}
