import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Download, FileBarChart, Lightbulb, Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadialGauge } from "@/components/RadialGauge";
import { RiskPill, MicroTag } from "@/components/RiskPill";
import { downloadElementAsPdf } from "./downloadPdf";
import {
  CBAM_QUESTIONS,
  CBAM_SECTIONS,
  CBAM_SCORE,
  cbamScore,
  cbamRiskLabel,
  cbamRecommendation,
  cbamBandFromTotal,
  bandFromPct,
  type CbamAns,
  type Sector,
} from "@/lib/assessment-data";

const CC_KEY = "eu-compliance-checker";
const CBAM_KEY = "cbam-assessment-v1";

type Saved = { org: string; sector: Sector | ""; euExport: string; answers: Record<string, CbamAns> };

const STATUS_TAG: Record<Exclude<CbamAns, "">, { label: string; tone: string }> = {
  Yes: { label: "Compliant", tone: "strong-green" },
  Partial: { label: "In progress", tone: "amber" },
  No: { label: "Gap identified", tone: "red" },
};

const TAG_STYLE: Record<string, { bg: string; fg: string; bd: string }> = {
  "strong-green": { bg: "color-mix(in oklab, var(--risk-strong-green) 14%, white)", fg: "var(--risk-strong-green)", bd: "color-mix(in oklab, var(--risk-strong-green) 35%, white)" },
  amber: { bg: "color-mix(in oklab, var(--risk-amber) 18%, white)", fg: "color-mix(in oklab, var(--risk-amber) 60%, black)", bd: "color-mix(in oklab, var(--risk-amber) 45%, white)" },
  red: { bg: "color-mix(in oklab, var(--risk-red) 14%, white)", fg: "var(--risk-red)", bd: "color-mix(in oklab, var(--risk-red) 40%, white)" },
};

const CBAM_PHASE = "Active from 2026 (definitive phase)";

function loadInitial(): Saved {
  let org = "", sector: Sector | "" = "", euExport = "Not specified", answers: Record<string, CbamAns> = {};
  try {
    const cc = JSON.parse(localStorage.getItem(CC_KEY) || "{}");
    if (cc.company) org = cc.company;
    if (cc.sector) sector = cc.sector;
    if (cc.exposure === "yes") euExport = "Yes – directly or through customers";
    else if (cc.exposure === "possibly") euExport = "Possibly – via supply chain";
    else if (cc.exposure === "future") euExport = "Planned (future)";
  } catch {}
  try {
    const saved = JSON.parse(localStorage.getItem(CBAM_KEY) || "{}");
    if (saved.org) org = saved.org;
    if (saved.sector) sector = saved.sector;
    if (saved.euExport) euExport = saved.euExport;
    if (saved.answers) answers = saved.answers;
  } catch {}
  return { org, sector, euExport, answers };
}

export default function CBAMChecker() {
  const initial = useMemo(loadInitial, []);
  const [step, setStep] = useState<2 | 3>(2);
  const [org, setOrg] = useState(initial.org);
  const [sector, setSector] = useState<Sector | "">(initial.sector);
  const [euExport] = useState(initial.euExport);
  const [answers, setAnswers] = useState<Record<string, CbamAns>>(initial.answers);
  const [open, setOpen] = useState<Record<string, boolean>>({ A: true, B: true, C: true, D: true, E: true });
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(CBAM_KEY, JSON.stringify({ org, sector, euExport, answers })); } catch {}
  }, [org, sector, euExport, answers]);

  const score = useMemo(() => cbamScore(answers), [answers]);
  const pct = score.pct;
  const setAns = (id: string, v: CbamAns) => setAnswers((p) => ({ ...p, [id]: v }));

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {[
          { n: 1, label: "Applicability", href: "/" as const },
          { n: 2, label: "CBAM Assessment", href: null },
          { n: 3, label: "Score Card", href: "/cbam-scorecard" as const },
          { n: 4, label: "Knowledge Hub", href: "/resources" as const },
        ].map((s, i) => {
          const active = s.n === 2;
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

      {/* Main page header */}
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">CBAM Readiness Assessment</h1>
        <p className="text-sm text-muted-foreground mt-1">Evaluate your organisation's readiness for the EU Carbon Border Adjustment Mechanism.</p>
      </div>

      {step === 2 ? (
        <Step2
          org={org}
          setOrg={setOrg}
          sector={sector}
          euExport={euExport}
          answers={answers}
          setAns={setAns}
          open={open}
          setOpen={setOpen}
          score={score}
          onViewDashboard={() => { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          dashRef={dashRef}
        />
      ) : (
        <Step3
          dashRef={dashRef}
          org={org}
          sector={sector}
          score={score}
          pct={pct}
          onBack={() => setStep(2)}
        />
      )}
    </div>
  );
}

/* ---------------- STEP 2 ---------------- */
function Step2({
  org, setOrg, sector, euExport, answers, setAns, open, setOpen, score, onViewDashboard, dashRef,
}: {
  org: string; setOrg: (v: string) => void; sector: Sector | ""; euExport: string;
  answers: Record<string, CbamAns>; setAns: (id: string, v: CbamAns) => void;
  open: Record<string, boolean>; setOpen: (v: Record<string, boolean>) => void;
  score: ReturnType<typeof cbamScore>; onViewDashboard: () => void;
  dashRef: React.RefObject<HTMLDivElement | null>;
}) {
  const sections: ("A" | "B" | "C" | "D" | "E")[] = ["A", "B", "C", "D", "E"];
  const [activeSection, setActiveSection] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [showErrors, setShowErrors] = useState(false);
  const navigate = useNavigate();
  const activeIdx = sections.indexOf(activeSection);
  const sec = activeSection;
  const title = CBAM_SECTIONS[sec];
  const qs = CBAM_QUESTIONS.filter((q) => q.section === sec);
  const isLast = activeIdx === sections.length - 1;
  const unansweredIds = qs.filter((q) => !answers[q.id]).map((q) => q.id);
  const hasUnanswered = unansweredIds.length > 0;

  const goToSection = (next: "A" | "B" | "C" | "D" | "E") => {
    setShowErrors(false);
    setActiveSection(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdvance = () => {
    if (hasUnanswered) {
      setShowErrors(true);
      toast.error(`Please answer all questions in Section ${sec} before continuing.`, {
        description: `${unansweredIds.length} question${unansweredIds.length === 1 ? "" : "s"} still unanswered.`,
      });
      return;
    }
    if (isLast) {
      navigate({ to: "/cbam-scorecard" });
    } else {
      goToSection(sections[activeIdx + 1]);
    }
  };
  const choices: { v: CbamAns; label: string }[] = [
    { v: "Yes", label: "Yes" },
    { v: "Partial", label: "Partial" },
    { v: "No", label: "No" },
  ];

  return (
    <div ref={dashRef} className="space-y-5 pb-16">
      {/* Section tabs */}
      <div className="flex items-center gap-2">
        {sections.map((s) => {
          const isActive = s === activeSection;
          return (
            <button
              key={s}
              type="button"
              onClick={() => goToSection(s)}
              className={`flex-1 min-w-0 inline-flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted/40"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0 ${isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>{s}</span>
              <span className="hidden sm:inline truncate">{CBAM_SECTIONS[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Active section */}
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/70">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold">{sec}</span>
          <h3 className="font-display text-base leading-none">Section {sec} — {title}</h3>
        </div>
        {showErrors && hasUnanswered && (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Please answer all {qs.length} questions in this section before continuing. {unansweredIds.length} remaining.
            </span>
          </div>
        )}
        <div className="px-5 divide-y divide-border/60">
          {qs.map((q, idx) => {
            const a = answers[q.id];
            const isMissing = showErrors && !a;
            return (
              <div key={q.id} className={`py-4 grid gap-3 sm:gap-6 sm:grid-cols-[1fr_320px] items-center ${isMissing ? "-mx-5 px-5 bg-destructive/5 border-l-2 border-destructive" : ""}`}>
                <p className="text-sm leading-relaxed flex gap-2">
                  <span className="text-muted-foreground tabular-nums shrink-0 w-5 text-right">{idx + 1}.</span>
                  <span className="flex-1">{q.text}</span>
                </p>
                <div className="grid grid-cols-3 gap-2 w-full sm:w-[320px] sm:justify-self-end">
                  {choices.map((c) => {
                    const selected = a === c.v;
                    return (
                      <button
                        key={c.v}
                        type="button"
                        onClick={() => setAns(q.id, c.v)}
                        aria-pressed={selected}
                        className={`inline-flex items-center justify-center gap-1.5 h-9 rounded-md text-sm border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : isMissing
                              ? "bg-card text-foreground border-destructive/50 hover:border-destructive hover:bg-destructive/5"
                              : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 pt-2 no-print">
        <Button
          variant="outline"
          onClick={() => goToSection(sections[Math.max(0, activeIdx - 1)])}
          disabled={activeIdx === 0}
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        {isLast ? (
          <Button variant="accent" size="lg" className="px-8" onClick={handleAdvance}>
            <FileBarChart className="w-5 h-5" /> Go to Score Card
          </Button>
        ) : (
          <Button onClick={handleAdvance}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
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
function StatusTag({ value }: { value: CbamAns | undefined }) {
  if (!value) return <span />;
  const cfg = STATUS_TAG[value];
  const s = TAG_STYLE[cfg.tone];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border text-xs px-2.5 py-1 font-medium" style={{ background: s.bg, color: s.fg, borderColor: s.bd }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.fg }} />
      {cfg.label}
    </span>
  );
}

/* ---------------- STEP 3: DASHBOARD ---------------- */
function Step3({
  dashRef, org, sector, score, pct, onBack,
}: {
  dashRef: React.RefObject<HTMLDivElement | null>; org: string; sector: Sector | "";
  score: ReturnType<typeof cbamScore>; pct: number; onBack: () => void;
}) {
  const riskLabel = cbamRiskLabel(score.total);
  const recommendation = cbamRecommendation(score.total);
  const sections = (["A", "B", "C", "D", "E"] as const).map((id) => {
    const sScore = score.bySection[id];
    const sMax = 6;
    const sPct = (sScore / sMax) * 100;
    return { id, title: CBAM_SECTIONS[id], qCount: 3, max: sMax, score: sScore, pct: sPct };
  });

  const conclusion =
    score.total >= 25
      ? "Your organisation shows very low CBAM compliance risk with strong foundations across data, calculation, governance, and supply-chain coordination."
      : score.total > 15
      ? "Your organisation shows moderate CBAM compliance risk. Prioritise closing gaps in emissions data, calculation methodology, and supplier engagement."
      : "Your organisation shows very high CBAM compliance risk. Immediate action is required to build awareness, emissions data systems, and internal compliance ownership.";

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight">CBAM Readiness Report</h1>
          <p className="text-sm text-muted-foreground">Results update automatically as you change your answers.</p>
        </div>
        <button onClick={onBack} className="text-sm text-primary hover:underline">&larr; Back to questionnaire</button>
      </div>

      <div ref={dashRef} className="space-y-6">
        {/* 3.1 Summary band */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <SummaryCol label="Organisation" value={org || "—"} />
          <SummaryCol label="Sector" value={sector || "—"} />
          <SummaryCol label="CBAM Phase" value={CBAM_PHASE} />
        </div>

        {/* 3.2 KPI card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Overall CBAM Readiness</p>
            <p className="font-display text-5xl sm:text-6xl tabular-nums mt-2" style={{ color: `var(--risk-${cbamBandFromTotal(score.total)})` }}>
              {score.total.toFixed(score.total % 1 ? 1 : 0)}<span className="text-2xl text-muted-foreground">/30</span>
            </p>
            <p className="text-sm mt-1">CBAM Readiness: <span className="font-semibold tabular-nums">{pct.toFixed(2)}%</span></p>
          </div>
          <div className="justify-self-center">
            <RadialGauge pct={pct} size={220} label="Readiness" tone={cbamBandFromTotal(score.total)} />
          </div>
          <div className="md:text-right space-y-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Risk Level</p>
            <div className="inline-block"><RiskPill pct={pct} label={riskLabel} tone={cbamBandFromTotal(score.total)} /></div>
            <p className="text-xs text-muted-foreground max-w-xs md:ml-auto">Risk band derived from your weighted score across all 15 questions.</p>
          </div>
        </div>

        {/* 3.3 Section scores: table + mini-cards */}
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-card overflow-x-auto">
            <h3 className="font-display text-base mb-3">Section Scores</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-semibold">Section</th>
                  <th className="py-2 pr-3 font-semibold">Area</th>
                  <th className="py-2 pr-3 font-semibold text-right">Qs</th>
                  <th className="py-2 pr-3 font-semibold text-right">Max</th>
                  <th className="py-2 pr-3 font-semibold text-right">Score</th>
                  <th className="py-2 font-semibold text-right">Readiness %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sections.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-3 font-semibold">{s.id}</td>
                    <td className="py-2.5 pr-3">{s.title}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.qCount}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.max}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{s.score}</td>
                    <td className="py-2.5 text-right tabular-nums" style={{ color: `var(--risk-${bandFromPct(s.pct)})` }}>{s.pct.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="bg-muted/30">
                  <td className="py-2.5 pr-3 font-semibold">Total</td>
                  <td className="py-2.5 pr-3 font-medium">Overall</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-medium">15</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-medium">30</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums font-semibold">{score.total}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold" style={{ color: `var(--risk-${cbamBandFromTotal(score.total)})` }}>{pct.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 content-start">
            {sections.map((s) => {
              const tone = bandFromPct(s.pct);
              return (
                <div key={s.id} className="bg-card border border-border rounded-2xl p-4 shadow-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-semibold">{s.id}</span>
                    <MicroTag pct={s.pct} />
                  </div>
                  <p className="text-sm font-medium leading-tight mt-1">{s.title}</p>
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
        </div>

        {/* 3.4 Executive summary */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base">Executive Summary</h3>
          </div>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
            <SummaryRow label="Organisation Name" value={org || "—"} />
            <SummaryRow label="Sector" value={sector || "—"} />
            <SummaryRow label="CBAM Phase" value={CBAM_PHASE} />
            <SummaryRow label="Overall Weighted Score" value={`${score.total} / 30`} />
            <SummaryRow label="Compliance Readiness %" value={`${pct.toFixed(2)}%`} />
            <SummaryRow label="Risk Level" value={riskLabel} />
          </dl>
          <div className="mt-5 flex gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Recommendations</p>
              <p className="text-sm leading-relaxed">{recommendation}</p>
            </div>
          </div>
        </div>

        {/* 3.5 Conclusion */}
        <div className="rounded-2xl border border-border bg-gradient-soft p-5 sm:p-6 flex items-start justify-between gap-4 flex-wrap shadow-card">
          <div className="flex items-start gap-3 max-w-2xl">
            <RiskIcon total={score.total} />
            <p className="text-sm leading-relaxed">{conclusion}</p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <Button variant="accent" onClick={() => downloadElementAsPdf(null, `cbam-readiness-${(org || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`)}>
              <Download className="w-4 h-4" /> Download full report (PDF)
            </Button>
            <Button variant="outline" onClick={onBack}>Plan next steps</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCol({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 sm:px-5 first:pl-2 last:pr-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-display text-lg mt-1 leading-tight">{value}</p>
    </div>
  );
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right sm:text-left">{value}</dd>
    </>
  );
}
function RiskIcon({ total }: { total: number }) {
  if (total >= 25) return <CheckCircle2 className="w-5 h-5 text-[var(--risk-strong-green)] shrink-0 mt-0.5" />;
  if (total > 15) return <AlertTriangle className="w-5 h-5 text-[var(--risk-orange)] shrink-0 mt-0.5" />;
  return <XCircle className="w-5 h-5 text-[var(--risk-red)] shrink-0 mt-0.5" />;
}
