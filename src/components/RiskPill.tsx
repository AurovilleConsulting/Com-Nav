import { bandFromPct } from "@/lib/assessment-data";

const STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  "strong-green": { bg: "color-mix(in oklab, var(--risk-strong-green) 14%, white)", fg: "var(--risk-strong-green)", border: "color-mix(in oklab, var(--risk-strong-green) 35%, white)" },
  "light-green": { bg: "color-mix(in oklab, var(--risk-light-green) 18%, white)", fg: "color-mix(in oklab, var(--risk-strong-green) 80%, black)", border: "color-mix(in oklab, var(--risk-light-green) 45%, white)" },
  amber: { bg: "color-mix(in oklab, var(--risk-amber) 18%, white)", fg: "color-mix(in oklab, var(--risk-amber) 60%, black)", border: "color-mix(in oklab, var(--risk-amber) 45%, white)" },
  orange: { bg: "color-mix(in oklab, var(--risk-orange) 16%, white)", fg: "var(--risk-orange)", border: "color-mix(in oklab, var(--risk-orange) 40%, white)" },
  red: { bg: "color-mix(in oklab, var(--risk-red) 14%, white)", fg: "var(--risk-red)", border: "color-mix(in oklab, var(--risk-red) 40%, white)" },
};

export function RiskPill({ pct, label, size = "md", tone: forceTone }: { pct: number; label: string; size?: "sm" | "md"; tone?: string }) {
  const tone = forceTone ?? bandFromPct(pct);
  const s = STYLES[tone];
  const cls = size === "sm" ? "text-xs px-2.5 py-1" : "text-sm px-3.5 py-1.5";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-medium ${cls}`}
      style={{ background: s.bg, color: s.fg, borderColor: s.border, transition: "all 300ms" }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: s.fg }} />
      {label}
    </span>
  );
}

export function MicroTag({ pct }: { pct: number }) {
  const tag = pct >= 80 ? "Strong" : pct >= 60 ? "On track" : pct >= 40 ? "Needs improvement" : "Priority gap";
  return <RiskPill pct={pct} label={tag} size="sm" />;
}