// Interpolação de cor contínua entre os três tons de status já usados no
// resto da plataforma (crítico → atenção → bom), para qualquer visual que
// precise expressar "nível de conformidade" como gradiente (0-100%) em vez
// de categorias discretas — a Bússola GISTM e o mapa de calor de instalações.

const CRITICAL = { r: 0xa5, g: 0x2a, b: 0x2a }; // #a52a2a — state-bad
const WARNING = { r: 0xc2, g: 0x87, b: 0x0f }; // #c2870f — state-warn (gráfico)
const GOOD = { r: 0x3f, g: 0x62, b: 0x12 }; // #3f6212 — state-ok
const MUTED = "#b3bfc1"; // mineral-300

function mix(a: typeof CRITICAL, b: typeof CRITICAL, t: number) {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** pct em [0,100]. null/undefined = sem dado (cinza neutro). */
export function complianceColor(pct: number | null | undefined): string {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return MUTED;
  const clamped = Math.max(0, Math.min(100, pct));
  if (clamped <= 50) return mix(CRITICAL, WARNING, clamped / 50);
  return mix(WARNING, GOOD, (clamped - 50) / 50);
}
