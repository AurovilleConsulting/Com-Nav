export const SCORECARD_DISCLAIMER =
  "This is a self-assessment based on information provided by the industry. The score is indicative only and does not imply compliance, certification, eligibility, or regulatory approval.";

export function ScorecardDisclaimer() {
  return (
    <div className="border border-border rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed font-semibold">
      {SCORECARD_DISCLAIMER}
    </div>
  );
}
