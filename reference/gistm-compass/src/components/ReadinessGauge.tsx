import { complianceColor } from "@/lib/compliance-color";
import { readinessLabel } from "@/lib/readiness-score";

export function ReadinessGauge({
  score,
  size = 156,
  showLabel = true,
}: {
  score: number;
  size?: number;
  showLabel?: boolean;
}) {
  const stroke = Math.max(8, size * 0.09);
  const r = size / 2 - stroke;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = complianceColor(score);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e3e4e1"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="50%"
          y={showLabel ? "46%" : "52%"}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.26}
          fontWeight={700}
          fill="#171d2b"
          className="tabular-nums"
        >
          {score}
        </text>
        {showLabel && (
          <text
            x="50%"
            y="66%"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.09}
            fill={color}
            fontWeight={600}
          >
            {readinessLabel(score)}
          </text>
        )}
      </svg>
    </div>
  );
}
