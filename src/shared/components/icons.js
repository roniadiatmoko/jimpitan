const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconRapel(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function IconHitungUlang(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4v6h6" />
      <path d="M4.5 13a8 8 0 1 0 2-8.4L4 10" />
    </svg>
  );
}

export function IconPengeluaran(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 8h14l-1.5 10.5a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.5L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function IconLaporan(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19V5a1 1 0 0 1 1-1h9l6 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M14 4v5h6" />
      <path d="M8 13h4M8 16h8" />
    </svg>
  );
}

export function IconRekap(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

export function IconKekurangan(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconWarga(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.5 14a5 5 0 0 1 5.5 5" />
    </svg>
  );
}

export function IconKalender(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </svg>
  );
}

export function IconBroadcast(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11v2a2 2 0 0 0 2 2h1l3 4v-4h6a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2Z" />
    </svg>
  );
}

export function IconChevron(props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg {...base} strokeWidth={2} {...props}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
