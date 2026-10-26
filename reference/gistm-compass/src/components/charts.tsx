import clsx from "clsx";

// Componentes de visualização "mão-na-massa" (sem biblioteca de gráficos),
// seguindo as diretrizes da skill de dataviz: cor por função (status para
// estado de conformidade, hue único para ranking de magnitude), rótulos
// diretos, legenda sempre presente para 2+ séries, sem eixo duplo, sem
// "rainbow chart".

const STATUS_COLORS = {
  good: "#3f6212",
  warning: "#c2870f",
  serious: "#ec835a",
  critical: "#a52a2a",
  muted: "#c3c2b7",
};

export interface DistributionSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function StatusDistributionBar({
  segments,
  total,
}: {
  segments: DistributionSegment[];
  total: number;
}) {
  const safeTotal = total || 1;
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-mineral-100">
        {segments.map((seg, i) => {
          const pct = (seg.value / safeTotal) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className={clsx(
                "h-full first:rounded-l-full last:rounded-r-full",
                i > 0 && "border-l-2 border-white"
              )}
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${seg.value}`}
            />
          );
        })}
      </div>
      <ul className="mt-4 space-y-2">
        {segments.map((seg) => (
          <li key={seg.key} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
              aria-hidden
            />
            <span className="text-mineral-600">{seg.label}</span>
            <span className="ml-auto shrink-0 font-medium tabular-nums text-mineral-900">
              {seg.value}
            </span>
            <span className="shrink-0 text-mineral-500 tabular-nums">
              ({Math.round((seg.value / safeTotal) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface RankedBarItem {
  key: string;
  label: string;
  value: number;
  badge?: string;
  badgeColor?: string;
}

export function RankedBarList({
  items,
  maxValue = 100,
  valueSuffix = "%",
  hue = "#2a78d6",
}: {
  items: RankedBarItem[];
  maxValue?: number;
  valueSuffix?: string;
  hue?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = Math.max(0, Math.min(100, (item.value / maxValue) * 100));
        return (
          <div key={item.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-mineral-600">{item.label}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: item.badgeColor ?? "#94a3b8" }}
                  >
                    {item.badge}
                  </span>
                )}
                <span className="font-medium tabular-nums text-mineral-900">
                  {Math.round(item.value)}
                  {valueSuffix}
                </span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-mineral-100">
              <div
                className="h-2 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: hue }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CriticalityBars({
  alta,
  media,
  baixa,
}: {
  alta: number;
  media: number;
  baixa: number;
}) {
  const items: RankedBarItem[] = [
    { key: "alta", label: "Criticidade alta", value: alta },
    { key: "media", label: "Criticidade média", value: media },
    { key: "baixa", label: "Criticidade baixa", value: baixa },
  ];
  const max = Math.max(alta, media, baixa, 1);
  const colors = [STATUS_COLORS.critical, STATUS_COLORS.warning, STATUS_COLORS.good];

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = Math.max(4, (item.value / max) * 100);
        return (
          <div key={item.key}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-mineral-600">{item.label}</span>
              <span className="font-medium tabular-nums text-mineral-900">
                {item.value}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-mineral-100">
              <div
                className="h-2 rounded-full"
                style={{ width: `${pct}%`, backgroundColor: colors[i] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { STATUS_COLORS };
