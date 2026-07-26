const variants = {
  primary: "bg-accent text-white hover:bg-accent/90",
  secondary: "bg-white text-ink border border-line hover:bg-surface",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
