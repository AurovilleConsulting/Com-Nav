import { bandFromPct } from "@/lib/assessment-data";

const TONE_COLOR: Record<string, string> = {
  "strong-green": "var(--risk-strong-green)",
  "light-green": "var(--risk-light-green)",
  amber: "var(--risk-amber)",
  orange: "var(--risk-orange)",
  red: "var(--risk-red)",
};

interface Props { pct: number; size?: number; label?: string; thickness?: number; tone?: string; }

/**
 * Semi-circular gauge. SVG arc with smooth transition driven by stroke-dashoffset.
 */
export function RadialGauge({ pct, size = 240, label, thickness = 22, tone: forceTone }: Props) {
  const clamped = Math.max(0, Math.min(100, isFinite(pct) ? pct : 0));
  const tone = forceTone ?? bandFromPct(clamped);
  const color = TONE_COLOR[tone];
  const w = size;
  const h = size / 2 + thickness;
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = Math.PI * r; // half circle
  const offset = circ * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center select-none" style={{ width: w }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <path
          d={`M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${w - thickness / 2} ${cy}`}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        <path
          d={`M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${w - thickness / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.7,.3,1), stroke 300ms" }}
        />
      </svg>
      <div className="-mt-12 flex flex-col items-center">
        <div className="text-4xl font-semibold tabular-nums" style={{ color }}>
          {clamped.toFixed(0)}%
        </div>
        {label && <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{label}</div>}
      </div>
    </div>
  );
}