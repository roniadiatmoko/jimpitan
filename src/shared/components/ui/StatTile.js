export default function StatTile({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "accent"
      ? "border-accent/20 bg-accent-soft"
      : "border-line bg-white";
  const valueToneClass = tone === "accent" ? "text-accent" : "text-ink";

  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${valueToneClass}`}>
        {value}
      </div>
    </div>
  );
}
