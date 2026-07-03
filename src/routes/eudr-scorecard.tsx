import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useEffect, useMemo, useState } from "react";
import { FileBarChart, Download, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadElementAsPdf } from "@/components/checkers/downloadPdf";
import { RadialGauge } from "@/components/RadialGauge";
import { MicroTag } from "@/components/RiskPill";
import { PdfHeader, PdfFooter } from "@/components/PdfFrame";
import {
  DR_SECTIONS,
  DR_MAX_TOTAL,
  drScore,
  drRiskLabel,
  drBandFromTotal,
  bandFromPct,
  type DrAns,
  type Sector,
} from "@/lib/assessment-data";

const CC_KEY = "eu-compliance-checker";
const DR_KEY = "dr-assessment-v1";
const EUDR_PHASE = "In force from 30 Dec 2025 (large operators)";

type Saved = { org: string; sector: Sector | ""; euExport: string; answers: Record<string, DrAns> };

function loadInitial(): Saved {
  let org = "", sector: Sector | "" = "", euExport = "Not specified", answers: Record<string, DrAns> = {};
  try {
    const cc = JSON.parse(localStorage.getItem(CC_KEY) || "{}");
    if (cc.company) org = cc.company;
    if (cc.sector) sector = cc.sector;
    if (cc.exposure === "yes") euExport = "Yes – directly or through customers";
    else if (cc.exposure === "possibly") euExport = "Possibly – via supply chain";
    else if (cc.exposure === "future") euExport = "Planned (future)";
  } catch {}
  try {
    const saved = JSON.parse(localStorage.getItem(DR_KEY) || "{}");
    if (saved.org) org = saved.org;
    if (saved.sector) sector = saved.sector;
    if (saved.euExport) euExport = saved.euExport;
    if (saved.answers) answers = saved.answers;
  } catch {}
  return { org, sector, euExport, answers };
}

export const Route = createFileRoute("/eudr-scorecard")({
  head: () => ({ meta: [
    { title: "EUDR Readiness Score Card" },
    { name: "description", content: "View your company profile, section scores, and overall EUDR readiness score." },
  ]}),
  component: Page,
});

function Page() {
  const [data, setData] = useState<Saved>({ org: "", sector: "", euExport: "Not specified", answers: {} });
  const [isExporting, setIsExporting] = useState(false);
  useEffect(() => { setData(loadInitial()); }, []);

  const { org, sector, euExport, answers } = data;
  const score = useMemo(() => drScore(answers), [answers]);
  const pct = score.pct;
  const riskLabel = drRiskLabel(score.total);
  const sectionIds = Object.keys(DR_SECTIONS) as Array<keyof typeof DR_SECTIONS>;
  const sections = sectionIds.map((id) => {
    const sScore = score.bySection[id];
    const sMax = 6;
    const sPct = (sScore / sMax) * 100;
    return { id, title: DR_SECTIONS[id], qCount: 3, max: sMax, score: sScore, pct: sPct };
  });

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadElementAsPdf(null, `eudr-scorecard-${(org || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader active="eudr" />

      {/* Stepper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <ol className="flex items-center gap-2 text-xs">
          {[
            { n: 1, label: "Applicability", href: "/" as const },
            { n: 2, label: "EUDR Assessment", href: "/eudr" as const },
            { n: 3, label: "Score Card", href: null },
            { n: 4, label: "Knowledge Hub", href: "/resources" as const },
          ].map((s, i) => {
            const active = s.n === 3;
            const Wrapper: any = s.href ? Link : "div";
            const wrapperProps = s.href ? { to: s.href, className: "flex items-center gap-2 hover:opacity-80 transition-opacity" } : { className: "flex items-center gap-2" };
            return (
              <li key={s.n} className="flex items-center gap-2">
                <Wrapper {...wrapperProps}>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold border ${
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-primary/15 text-primary border-primary/30"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span className={active ? "font-medium text-foreground" : "text-primary hover:underline"}>{s.label}</span>
                </Wrapper>
                {i < 3 && <span className="mx-1 h-px w-8 bg-border" />}
              </li>
            );
          })}
        </ol>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-10 space-y-6">
        <div className="text-center sm:text-left py-2 no-print">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight">EUDR Readiness Score Card</h1>
              <p className="text-sm text-muted-foreground mt-1">Your company profile, section scores, and overall EUDR readiness.</p>
            </div>
            <Button
              variant="accent"
              size="lg"
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 no-print"
            >
              <Download className="w-5 h-5" /> Export PDF
            </Button>
          </div>
        </div>

        <div id="pdf-export-area" className="space-y-6">
        <PdfHeader title="EUDR Readiness Score Card" />
        {/* Company Profile */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileBarChart className="w-5 h-5 text-primary" /></div>
            <div>
              <h2 className="font-display text-lg">Company Profile</h2>
              <p className="text-xs text-muted-foreground">Organisation details from the applicability check.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Organisation Name"><ReadOnly value={org || "—"} /></Field>
            <Field label="Export to EU"><ReadOnly value={euExport} /></Field>
            <Field label="Sector"><ReadOnly value={sector || "Not selected"} /></Field>
            <Field label="EUDR Phase"><ReadOnly value={EUDR_PHASE} accent /></Field>
          </div>
        </div>

        {/* Overall score KPI */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated grid md:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-center">Overall EUDR Readiness</p>
            <RadialGauge pct={pct} size={220} label="Readiness" tone={bandFromPct(pct)} />
          </div>
          {(() => {
            const item =
              pct < 20
                ? { range: "0–19%", label: "Very low EUDR readiness", desc: "Critical non-compliance risk. Traceability, geolocation, due diligence, and documentation systems are absent or highly inadequate. Immediate remediation required.", color: "var(--risk-red)", bg: "color-mix(in oklab, var(--risk-red) 10%, white)" }
                : pct < 40
                ? { range: "20–39%", label: "Low EUDR readiness", desc: "High probability of non-compliance and potential disruption to EU exports unless corrective measures are implemented urgently.", color: "var(--risk-orange)", bg: "color-mix(in oklab, var(--risk-orange) 10%, white)" }
                : pct < 60
                ? { range: "40–59%", label: "Moderate EUDR readiness", desc: "Significant compliance gaps identified. Limited visibility across supply chain and incomplete due diligence systems may create market access risks.", color: "var(--risk-amber)", bg: "color-mix(in oklab, var(--risk-amber) 10%, white)" }
                : pct < 80
                ? { range: "60–79%", label: "High EUDR readiness", desc: "Partial compliance achieved. Core systems exist, but gaps remain. Improvement actions recommended before full EU alignment.", color: "var(--risk-light-green)", bg: "color-mix(in oklab, var(--risk-light-green) 12%, white)" }
                : { range: "80–100%", label: "Very high EUDR readiness", desc: "Strong EUDR compliance posture. Suitable for EU market access with minimal corrective actions required.", color: "var(--risk-strong-green)", bg: "color-mix(in oklab, var(--risk-strong-green) 12%, white)" };
            return (
              <div className="rounded-xl p-4 border" style={{ background: item.bg, borderColor: `color-mix(in oklab, ${item.color} 30%, var(--border))` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: item.color }}>{item.range}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })()}
        </div>

        {/* Section scores */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((s) => {
            const tone = bandFromPct(s.pct);
            const sectionDesc: Record<string, string> = {
              A: "Identify whether your products and exports fall within EUDR's regulated commodity categories.",
              B: "Map your sourcing chain from farm to shipment and establish batch-level traceability.",
              C: "Collect and verify GPS coordinates for every plot of land supplying your commodities.",
              D: "Confirm that all sourcing land was forest-free after December 2020 and legally compliant.",
              E: "Align with your EU buyers on data requirements and support their Due Diligence Statement submission.",
              F: "Assess your organisation's readiness, training, and internal ownership of EUDR compliance.",
            };
            return (
              <div key={s.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-semibold">{s.id}</span>
                  <MicroTag pct={s.pct} />
                </div>
                <p className="text-sm font-medium leading-tight mt-1">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sectionDesc[s.id]}</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-display text-xl tabular-nums" style={{ color: `var(--risk-${tone})` }}>{s.pct.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{s.score}/{s.max}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, s.pct)}%`, background: `var(--risk-${tone})` }} />
                </div>
              </div>
            );
          })}
        </div>
        <PdfFooter />
        </div>

        <div className="flex justify-center pt-4 no-print gap-3">
          <Button
            variant="accent"
            size="lg"
            onClick={handleExport}
            disabled={isExporting}
            className="px-6"
          >
            <Download className="w-5 h-5" /> Export PDF
          </Button>
          <Button variant="outline" size="lg" className="px-6" asChild>
            <Link to="/resources">
              <ExternalLink className="w-5 h-5" /> Knowledge Hub
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
      {children}
    </div>
  );
}
function ReadOnly({ value, accent }: { value: string; accent?: boolean }) {
  return (
    <div className={`px-3 py-2 rounded-lg border text-sm ${accent ? "bg-primary/5 border-primary/25 text-primary font-medium" : "bg-muted/40 border-border text-foreground"}`}>
      {value}
    </div>
  );
}