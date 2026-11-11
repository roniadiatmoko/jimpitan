export const rupiahFormat = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(number);
};

export const terbilang = (n) => {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return "Nol Rupiah";
  const satuan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  function konversi(num) {
    if (num < 12) return satuan[num];
    if (num < 20) return konversi(num - 10) + " Belas";
    if (num < 100)
      return (
        konversi(Math.floor(num / 10)) +
        " Puluh" +
        (num % 10 ? " " + konversi(num % 10) : "")
      );
    if (num < 200)
      return "Seratus" + (num - 100 ? " " + konversi(num - 100) : "");
    if (num < 1000)
      return (
        konversi(Math.floor(num / 100)) +
        " Ratus" +
        (num % 100 ? " " + konversi(num % 100) : "")
      );
    if (num < 2000)
      return "Seribu" + (num - 1000 ? " " + konversi(num - 1000) : "");
    if (num < 1000000)
      return (
        konversi(Math.floor(num / 1000)) +
        " Ribu" +
        (num % 1000 ? " " + konversi(num % 1000) : "")
      );
    if (num < 1000000000)
      return (
        konversi(Math.floor(num / 1000000)) +
        " Juta" +
        (num % 1000000 ? " " + konversi(num % 1000000) : "")
      );
    if (num < 1000000000000)
      return (
        konversi(Math.floor(num / 1000000000)) +
        " Miliar" +
        (num % 1000000000 ? " " + konversi(num % 1000000000) : "")
      );
    return (
      konversi(Math.floor(num / 1000000000000)) +
      " Triliun" +
      (num % 1000000000000 ? " " + konversi(num % 1000000000000) : "")
    );
  }

  return konversi(n).trim() + " Rupiah";
};
