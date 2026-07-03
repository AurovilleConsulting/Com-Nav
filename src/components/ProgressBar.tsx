import { bandFromPct } from "@/lib/assessment-data";

const COLORS: Record<string, string> = {
  "strong-green": "var(--risk-strong-green)",
  "light-green": "var(--risk-light-green)",
  amber: "var(--risk-amber)",
  orange: "var(--risk-orange)",
  red: "var(--risk-red)",
};

export function ProgressBar({ pct, height = 8, useRiskColor = true, color }: { pct: number; height?: number; useRiskColor?: boolean; color?: string }) {
  const v = Math.max(0, Math.min(100, isFinite(pct) ? pct : 0));
  const fill = color ?? (useRiskColor ? COLORS[bandFromPct(v)] : "var(--primary)");
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: "var(--muted)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${v}%`, background: fill, transition: "width 500ms ease, background 300ms" }}
      />
    </div>
  );
}