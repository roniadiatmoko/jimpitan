/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0F172A",
          soft: "#1E293B",
        },
        accent: {
          DEFAULT: "#2563EB",
          soft: "#DBEAFE",
        },
        surface: "#F8FAFC",
        line: "#E2E8F0",
        muted: "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
