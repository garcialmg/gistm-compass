"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { complianceColor } from "@/lib/compliance-color";
import type { WheelTheme } from "@/lib/report";

const SIZE = 440;
const CENTER = SIZE / 2;
const R_OUTER = 205;
const R_INNER = 96;
const GAP_DEG = 3;

// Arredonda para 2 casas decimais: precisão de sobra para um SVG de ~440px,
// e evita hydration mismatch — Math.cos/Math.sin podem divergir no último
// bit entre o V8 do servidor (Node) e o do navegador, o que sem isso vira
// uma string de path ligeiramente diferente entre SSR e client.
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function polar(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round2(CENTER + r * Math.cos(rad)), y: round2(CENTER + r * Math.sin(rad)) };
}

function donutWedge(startAngle: number, endAngle: number) {
  const p1 = polar(R_OUTER, startAngle);
  const p2 = polar(R_OUTER, endAngle);
  const p3 = polar(R_INNER, endAngle);
  const p4 = polar(R_INNER, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return (
    `M ${p1.x} ${p1.y} A ${R_OUTER} ${R_OUTER} 0 ${largeArc} 1 ${p2.x} ${p2.y} ` +
    `L ${p3.x} ${p3.y} A ${R_INNER} ${R_INNER} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`
  );
}

export function CompassWheel({
  themes,
  installationId,
  center,
  size = SIZE,
  lang,
}: {
  themes: WheelTheme[];
  installationId: string;
  center: ReactNode;
  size?: number;
  lang?: "pt" | "en";
}) {
  const router = useRouter();
  const count = themes.length;
  const step = 360 / count;
  const wedgeDeg = step - GAP_DEG;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="Bússola de conformidade GISTM por princípio"
      >
        <circle cx={CENTER} cy={CENTER} r={R_OUTER + 1} fill="none" stroke="#e3e4e1" strokeWidth={1} />
        {themes.map((theme, i) => {
          const start = i * step;
          const end = start + wedgeDeg;
          const hasData = theme.validatedCount > 0;
          const color = hasData ? complianceColor(theme.value) : "#dcdde3";
          const label = `Princípio ${theme.number} · ${theme.name} — ${
            hasData ? `${Math.round(theme.value)}% atendimento` : "sem avaliação"
          } (${theme.validatedCount}/${theme.requirementCount} validado(s))`;
          return (
            <path
              key={theme.id}
              d={donutWedge(start, end)}
              fill={color}
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() =>
                router.push(
                  `/instalacoes/${installationId}/requisitos?theme=${theme.id}` +
                    (lang === "en" ? "&lang=en" : "")
                )
              }
              role="button"
              aria-label={label}
            >
              <title>{label}</title>
            </path>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto">{center}</div>
      </div>
    </div>
  );
}
