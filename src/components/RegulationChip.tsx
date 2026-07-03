const STYLES: Record<string, { bg: string; fg: string; border: string }> = {
  DPP: { bg: "var(--dpp-soft)", fg: "var(--dpp)", border: "color-mix(in oklab, var(--dpp) 25%, white)" },
  EUDR: { bg: "var(--eudr-soft)", fg: "var(--eudr)", border: "color-mix(in oklab, var(--eudr) 25%, white)" },
  CBAM: { bg: "var(--cbam-soft)", fg: "var(--cbam)", border: "color-mix(in oklab, var(--cbam) 25%, white)" },
};

export function RegulationChip({ reg, suffix }: { reg: "DPP" | "EUDR" | "CBAM"; suffix?: string }) {
  const s = STYLES[reg];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold"
      style={{ background: s.bg, color: s.fg, borderColor: s.border }}
    >
      {reg}
      {suffix && <span className="text-xs font-normal opacity-80">{suffix}</span>}
    </span>
  );
}