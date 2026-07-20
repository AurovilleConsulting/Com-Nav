import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStoredCompanyName,
  getStoredExposureSummary,
  readStoredComplianceProfile,
} from "@/lib/compliance-profile";
import {
  DPP_QUESTIONS,
  DPP_SECTIONS,
  dppRecommendation,
  dppRiskLabel,
  dppRequirementDate,
  dppScore,
  type YPN,
  type Sector,
} from "@/lib/assessment-data";

const DPP_KEY = "dpp-assessment-v1";
const DPP_PENDING_EMAIL_KEY = "pending-dpp-scorecard-email";

type Saved = { org: string; sector: Sector | ""; euExport: string; answers: Record<string, YPN> };

function loadInitial(): Saved {
  let org = "",
    sector: Sector | "" = "",
    euExport = "Not specified",
    answers: Record<string, YPN> = {};
  const cc = readStoredComplianceProfile();
  const companyName = getStoredCompanyName(cc);
  if (companyName) org = companyName;
  if (cc.sector) sector = cc.sector as Sector;
  euExport = getStoredExposureSummary(cc);
  try {
    const saved = JSON.parse(localStorage.getItem(DPP_KEY) || "{}");
    if (saved.org) org = saved.org;
    if (saved.sector) sector = saved.sector;
    if (saved.euExport) euExport = saved.euExport;
    if (saved.answers) answers = saved.answers;
  } catch (error) {
    console.warn("Failed to load saved DPP assessment", error);
  }
  return { org, sector, euExport, answers };
}

export default function DPPChecker() {
  const initial = useMemo(loadInitial, []);
  const [org] = useState(initial.org);
  const [sector] = useState<Sector | "">(initial.sector);
  const [euExport] = useState(initial.euExport);
  const [answers, setAnswers] = useState<Record<string, YPN>>(initial.answers);
  const [showErrors, setShowErrors] = useState(false);
  const [isSendingScorecardEmail, setIsSendingScorecardEmail] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(DPP_KEY, JSON.stringify({ org, sector, euExport, answers }));
    } catch (error) {
      console.warn("Failed to save DPP assessment", error);
    }
  }, [org, sector, euExport, answers]);

  const score = useMemo(() => dppScore(answers), [answers]);
  const setAns = (id: string, v: YPN) => setAnswers((p) => ({ ...p, [id]: v }));

  const sections: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
  const [activeSection, setActiveSection] = useState<"A" | "B" | "C" | "D">("A");
  const activeIdx = sections.indexOf(activeSection);
  const sec = activeSection;
  const meta = DPP_SECTIONS[sec];
  const qs = DPP_QUESTIONS.filter((q) => q.section === sec);
  const isLast = activeIdx === sections.length - 1;
  const unansweredIds = qs.filter((q) => !answers[q.id]).map((q) => q.id);
  const hasUnanswered = unansweredIds.length > 0;

  const goToSection = (next: "A" | "B" | "C" | "D") => {
    setShowErrors(false);
    setActiveSection(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdvance = async () => {
    if (hasUnanswered) {
      setShowErrors(true);
      toast.error(`Please answer all questions in Section ${sec} before continuing.`, {
        description: `${unansweredIds.length} question${unansweredIds.length === 1 ? "" : "s"} still unanswered.`,
      });
      return;
    }
    if (isLast) {
      const complianceProfile = readStoredComplianceProfile();
      const recipientEmail = complianceProfile.email?.trim() ?? "";

      if (!recipientEmail) {
        toast.error("Enter an email address in the company profile before continuing.");
        return;
      }

      setIsSendingScorecardEmail(true);
      try {
        sessionStorage.setItem(DPP_PENDING_EMAIL_KEY, "1");
      } catch (error) {
        console.warn("Failed to queue DPP scorecard email", error);
      }
      navigate({ to: "/dpp-scorecard" });
    } else {
      goToSection(sections[activeIdx + 1]);
    }
  };
  const choices: { v: YPN; label: string }[] = [
    { v: "Yes", label: "Yes" },
    { v: "Partial", label: "Partial" },
    { v: "No", label: "No" },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-xs">
        {[
          { n: 1, label: "Applicability", href: "/" as const },
          { n: 2, label: "DPP Assessment", href: null },
          { n: 3, label: "Score Card", href: "/dpp-scorecard" as const },
          { n: 4, label: "Knowledge Hub", href: "/resources" as const },
        ].map((s, i) => {
          const active = s.n === 2;
          return (
            <li key={s.n} className="flex items-center gap-2">
              {s.href ? (
                <Link
                  to={s.href}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
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
                </Link>
              ) : (
                <div className="flex items-center gap-2">
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
                </div>
              )}
              {i < 3 && <span className="mx-1 h-px w-8 bg-border" />}
            </li>
          );
        })}
      </ol>

      {/* Main page header */}
      <div className="text-center sm:text-left">
        <h1 className="font-display text-2xl sm:text-3xl tracking-tight">
          DPP Readiness Assessment
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluate your organisation's readiness for the EU Digital Product Passport.
        </p>
      </div>

      <div className="space-y-5 pb-16">
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
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold shrink-0 ${isActive ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}
                >
                  {s}
                </span>
                <span className="hidden sm:inline truncate">{DPP_SECTIONS[s].title}</span>
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/70">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-semibold">
              {sec}
            </span>
            <h3 className="font-display text-base leading-none">
              Section {sec} — {meta.title}
            </h3>
          </div>
          {showErrors && hasUnanswered && (
            <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Please answer all {qs.length} questions in this section before continuing.{" "}
                {unansweredIds.length} remaining.
              </span>
            </div>
          )}
          <div className="px-5 divide-y divide-border/60">
            {qs.map((q, idx) => {
              const a = answers[q.id];
              const isMissing = showErrors && !a;
              return (
                <div
                  key={q.id}
                  className={`py-4 grid gap-3 sm:gap-6 sm:grid-cols-[1fr_320px] items-center ${isMissing ? "-mx-5 px-5 bg-destructive/5 border-l-2 border-destructive" : ""}`}
                >
                  <p className="text-sm leading-relaxed flex gap-2">
                    <span className="text-muted-foreground tabular-nums shrink-0 w-5 text-right">
                      {idx + 1}.
                    </span>
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
            <Button
              variant="accent"
              size="lg"
              className="px-8"
              onClick={() => void handleAdvance()}
              disabled={isSendingScorecardEmail}
            >
              <FileBarChart className="w-5 h-5" />{" "}
              {isSendingScorecardEmail ? "Sending scorecard…" : "Go to Score Card"}
            </Button>
          ) : (
            <Button onClick={() => void handleAdvance()}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
