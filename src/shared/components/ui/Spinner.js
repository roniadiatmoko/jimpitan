export default function Spinner({ label = "Memuat data..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-accent"
        role="status"
        aria-label={label}
      />
      {label}
    </div>
  );
}
