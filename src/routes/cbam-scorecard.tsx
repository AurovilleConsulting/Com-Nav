import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileBarChart, Download, Info, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadElementAsPdf, generateElementPdfBase64 } from "@/components/checkers/downloadPdf";
import { RadialGauge } from "@/components/RadialGauge";
import { RiskPill, MicroTag } from "@/components/RiskPill";
import { PdfHeader, PdfFooter } from "@/components/PdfFrame";
import {
  getStoredCompanyName,
  getStoredExposureSummary,
  readStoredComplianceProfile,
} from "@/lib/compliance-profile";
import { sendScorecardEmail } from "@/lib/scorecard-email";
import {
  CBAM_SECTIONS,
  cbamScore,
  cbamRiskLabel,
  bandFromPct,
  type CbamAns,
  type Sector,
} from "@/lib/assessment-data";

const CBAM_KEY = "cbam-assessment-v1";
const CBAM_PHASE = "Active from 2026 (definitive phase)";
const CBAM_PENDING_EMAIL_KEY = "pending-cbam-scorecard-email";

type Saved = {
  org: string;
  sector: Sector | "";
  euExport: string;
  answers: Record<string, CbamAns>;
};

function loadInitial(): Saved {
  let org = "",
    sector: Sector | "" = "",
    euExport = "Not specified",
    answers: Record<string, CbamAns> = {};
  const cc = readStoredComplianceProfile();
  const companyName = getStoredCompanyName(cc);
  if (companyName) org = companyName;
  if (cc.sector) sector = cc.sector as Sector;
  euExport = getStoredExposureSummary(cc);
  try {
    const saved = JSON.parse(localStorage.getItem(CBAM_KEY) || "{}");
    if (saved.org) org = saved.org;
    if (saved.sector) sector = saved.sector;
    if (saved.euExport) euExport = saved.euExport;
    if (saved.answers) answers = saved.answers;
  } catch {}
  return { org, sector, euExport, answers };
}

export const Route = createFileRoute("/cbam-scorecard")({
  head: () => ({
    meta: [
      { title: "CBAM Readiness Score Card" },
      {
        name: "description",
        content: "View your company profile, section scores, and overall CBAM readiness score.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const [data, setData] = useState<Saved>({
    org: "",
    sector: "",
    euExport: "Not specified",
    answers: {},
  });

  useEffect(() => {
    setData(loadInitial());
  }, []);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const pdfAreaRef = useRef<HTMLDivElement>(null);

  const { org, sector, euExport, answers } = data;
  const score = useMemo(() => cbamScore(answers), [answers]);
  const pct = score.pct;
  const riskLabel = cbamRiskLabel(score.total);
  const sections = (["A", "B", "C", "D", "E"] as const).map((id) => {
    const sScore = score.bySection[id];
    const sMax = 6;
    const sPct = (sScore / sMax) * 100;
    return { id, title: CBAM_SECTIONS[id], qCount: 3, max: sMax, score: sScore, pct: sPct };
  });

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await downloadElementAsPdf(
        null,
        `cbam-scorecard-${(org || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const shouldSendEmail = sessionStorage.getItem(CBAM_PENDING_EMAIL_KEY) === "1";
    if (!shouldSendEmail || isSendingEmail || !pdfAreaRef.current) return;

    const sendScorecard = async () => {
      const complianceProfile = readStoredComplianceProfile();
      const recipientEmail = complianceProfile.email?.trim() ?? "";

      if (!recipientEmail) {
        toast.error("Enter an email address in the company profile before continuing.");
        sessionStorage.removeItem(CBAM_PENDING_EMAIL_KEY);
        return;
      }

      setIsSendingEmail(true);
      try {
        const pdfBase64 = await generateElementPdfBase64(pdfAreaRef.current);
        await sendScorecardEmail({
          regulation: "CBAM",
          recipientEmail,
          recipientName: getStoredCompanyName(complianceProfile) || org || "there",
          scorecardTitle: "CBAM Readiness Score Card",
          scorecardSubtitle: "Your company profile, section scores, and overall CBAM readiness.",
          generatedAt: new Date().toISOString(),
          profileFields: [
            { label: "Organisation Name", value: org || getStoredCompanyName(complianceProfile) || "—" },
            { label: "Email", value: recipientEmail },
            { label: "Pincode", value: complianceProfile.pincode?.trim() || "Not provided" },
            { label: "Export to EU", value: euExport },
            { label: "Sector", value: sector || "Not selected" },
            { label: "CBAM Phase", value: CBAM_PHASE },
          ],
          overallMetrics: [
            { label: "Overall Weighted Score", value: score.total + " / 30" },
            { label: "Readiness", value: pct.toFixed(2) + "%" },
            { label: "Risk Level", value: riskLabel },
          ],
          sections: sections.map((section) => ({
            id: section.id,
            title: section.title,
            score: section.score,
            max: section.max,
            pct: section.pct,
          })),
          recommendation:
            score.total >= 25
              ? "You are strongly prepared for CBAM, so the priority is to keep your information up to date, follow any changes in the rules and be ready to share your data with EU buyers when needed"
              : score.total > 15
                ? "You are at a moderate level of CBAM readiness and now need to organise your existing practices, document them, and try at least one complete emissions calculation for a main export product."
                : "Your CBAM preparation is at a very early stage, so you should first understand the basic requirements and start collecting simple data on energy use, production and exports",
          pdfBase64,
        });

        toast.success("Scorecard PDF emailed successfully.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send the scorecard email.");
      } finally {
        sessionStorage.removeItem(CBAM_PENDING_EMAIL_KEY);
        setIsSendingEmail(false);
      }
    };

    void sendScorecard();
  }, [euExport, isSendingEmail, org, pct, riskLabel, score.total, sector, sections]);

  return (
    <div className="min-h-screen">
      <AppHeader active="cbam" />

      {/* Stepper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <ol className="flex items-center gap-2 text-xs">
          {[
            { n: 1, label: "Applicability", href: "/" as const },
            { n: 2, label: "CBAM Assessment", href: "/cbam" as const },
            { n: 3, label: "Score Card", href: null },
            { n: 4, label: "Knowledge Hub", href: "/resources" as const },
          ].map((s, i) => {
            const active = s.n === 3;
            const Wrapper: any = s.href ? Link : "div";
            const wrapperProps = s.href
              ? {
                  to: s.href,
                  className: "flex items-center gap-2 hover:opacity-80 transition-opacity",
                }
              : { className: "flex items-center gap-2" };
            return (
              <li key={s.n} className="flex items-center gap-2">
                <Wrapper {...wrapperProps}>
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-semibold border ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-primary/15 text-primary border-primary/30"
                    }`}
                  >
                    {s.n}
                  </span>
                  <span
                    className={
                      active ? "font-medium text-foreground" : "text-primary hover:underline"
                    }
                  >
                    {s.label}
                  </span>
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
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
                CBAM Readiness Score Card
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your company profile, section scores, and overall CBAM readiness.
              </p>
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

        <div id="pdf-export-area" ref={pdfAreaRef} className="space-y-6">
          <PdfHeader title="CBAM Readiness Score Card" />
          {/* Company Profile */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg">Company Profile</h2>
                <p className="text-xs text-muted-foreground">
                  Organisation details from the applicability check.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Organisation Name">
                <ReadOnly value={org || "—"} />
              </Field>
              <Field label="Export to EU">
                <ReadOnly value={euExport} />
              </Field>
              <Field label="Sector">
                <ReadOnly value={sector || "Not selected"} />
              </Field>
              <Field label="CBAM Phase">
                <ReadOnly value={CBAM_PHASE} accent />
              </Field>
            </div>
          </div>

          {/* Overall score KPI */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-elevated grid md:grid-cols-[auto_1fr] gap-6 items-center">
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground text-center">
                Overall CBAM Readiness
              </p>
              <RadialGauge pct={pct} size={220} label="Readiness" tone={bandFromPct(pct)} />
            </div>
            {(() => {
              const item =
                pct < 20
                  ? {
                      range: "0–19%",
                      label: "Very low CBAM readiness",
                      desc: "Your CBAM preparation is at a very early stage, so you should first understand the basic requirements and start collecting simple data on energy use, production and exports.",
                      color: "var(--risk-red)",
                      bg: "color-mix(in oklab, var(--risk-red) 10%, white)",
                    }
                  : pct < 40
                    ? {
                        range: "20–39%",
                        label: "Low CBAM readiness",
                        desc: "You have made some initial efforts, but your CBAM systems are still weak and need clearer responsibilities and more regular data collection.",
                        color: "var(--risk-orange)",
                        bg: "color-mix(in oklab, var(--risk-orange) 10%, white)",
                      }
                    : pct < 60
                      ? {
                          range: "40–59%",
                          label: "Moderate CBAM readiness",
                          desc: "You are at a moderate level of CBAM readiness and now need to organise your existing practices, document them, and try at least one complete emissions calculation for a main export product.",
                          color: "var(--risk-amber)",
                          bg: "color-mix(in oklab, var(--risk-amber) 10%, white)",
                        }
                      : pct < 80
                        ? {
                            range: "60–79%",
                            label: "High CBAM readiness",
                            desc: "You are generally well prepared for CBAM and should now focus on using the same process across all relevant products and checking the quality of your data at regular intervals.",
                            color: "var(--risk-light-green)",
                            bg: "color-mix(in oklab, var(--risk-light-green) 12%, white)",
                          }
                        : {
                            range: "80–100%",
                            label: "Very high CBAM readiness",
                            desc: "You are strongly prepared for CBAM, so the priority is to keep your information up to date, follow any changes in the rules and be ready to share your data with EU buyers when needed.",
                            color: "var(--risk-strong-green)",
                            bg: "color-mix(in oklab, var(--risk-strong-green) 12%, white)",
                          };
              return (
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: item.bg,
                    borderColor: `color-mix(in oklab, ${item.color} 30%, var(--border))`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-bold text-white"
                      style={{ background: item.color }}
                    >
                      {item.range}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: item.color }}>
                      {item.label}
                    </span>
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
                A: "Assesses the company's awareness of CBAM scope, buyer requests for emissions data, and the use of default EU emission values when actual data is not provided.",
                B: "Assesses the company's ability to access reliable factory data, collect it efficiently across departments, and obtain CBAM-relevant input data from key suppliers.",
                C: "Assesses whether the company uses recognised emissions methods, documents them, and can calculate emissions at product or installation level.",
                D: "Assesses whether the company has clear CBAM responsibility, basic staff training, and a regular process to keep CBAM data and calculations up to date.",
                E: "Assesses whether the company coordinates CBAM data with EU buyers, requests necessary data from suppliers, and plans for third-party verification of emissions data.",
              };
              return (
                <div
                  key={s.id}
                  className="bg-card border border-border rounded-2xl p-4 shadow-card"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                      {s.id}
                    </span>
                    <MicroTag pct={s.pct} />
                  </div>
                  <p className="text-sm font-medium leading-tight mt-1">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {sectionDesc[s.id]}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span
                      className="font-display text-xl tabular-nums"
                      style={{ color: `var(--risk-${tone})` }}
                    >
                      {s.pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {s.score}/{s.max}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(2, s.pct)}%`, background: `var(--risk-${tone})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <PdfFooter />
        </div>

        {/* Download PDF */}
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
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
function ReadOnly({ value, accent }: { value: string; accent?: boolean }) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-sm ${accent ? "bg-primary/5 border-primary/25 text-primary font-medium" : "bg-muted/40 border-border text-foreground"}`}
    >
      {value}
    </div>
  );
}
