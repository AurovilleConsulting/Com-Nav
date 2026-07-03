import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trees, Send, Info, CheckCircle2, XCircle, AlertTriangle, Download } from "lucide-react";
import { downloadElementAsPdf } from "./downloadPdf";

type RiskLevel = "Medium" | "MediumHigh" | "High" | "Critical";
type Question = { id: number; label: string; options: string[]; risk: RiskLevel };
type Section = { title: string; questions: Question[] };

const YN = ["Yes","No","Not Sure"];
const YNP = ["Yes","Partial","No"];
const YNI = ["Yes","In Progress","No"];

const sections: Section[] = [
  { title: "A. Commodity Scope", questions: [
    { id: 1, label: "Do you handle any of the 7 EUDR commodities (cattle, cocoa, coffee, palm oil, rubber, soy, wood)?", options: YN, risk: "High" },
    { id: 2, label: "Do you export derived products (leather, chocolate, furniture, tyres, paper) to the EU?", options: YN, risk: "High" },
    { id: 3, label: "Have you mapped which of your SKUs fall in EUDR scope?", options: YNP, risk: "High" },
    { id: 4, label: "Do you know the HS codes of your in-scope products?", options: YNP, risk: "MediumHigh" },
    { id: 5, label: "Have you reviewed EUDR Annex I to confirm classification?", options: YN, risk: "Medium" },
    { id: 6, label: "Are you aware of EUDR enforcement timelines applicable to you?", options: YN, risk: "High" },
  ]},
  { title: "B. Supply Chain Mapping", questions: [
    { id: 7, label: "Can you trace your products back to the producing farm/plot?", options: YNP, risk: "High" },
    { id: 8, label: "Do you have a complete list of upstream suppliers/aggregators?", options: YNP, risk: "High" },
    { id: 9, label: "Do you have written supply contracts with all upstream tiers?", options: YNP, risk: "High" },
    { id: 10, label: "Do you maintain batch/lot identifiers from farm to export?", options: YNP, risk: "MediumHigh" },
    { id: 11, label: "Can you reconstruct the chain of custody on demand?", options: YNP, risk: "High" },
    { id: 12, label: "Do you map mixed-source vs single-source supply flows?", options: YNP, risk: "High" },
    { id: 13, label: "Do suppliers share traceability data digitally?", options: YNP, risk: "High" },
  ]},
  { title: "C. Geolocation Data", questions: [
    { id: 14, label: "Do you collect geolocation coordinates for every producing plot?", options: YNP, risk: "Critical" },
    { id: 15, label: "Are coordinates captured as polygons for plots > 4 hectares?", options: YNP, risk: "Critical" },
    { id: 16, label: "Are geolocation records dated and verifiable?", options: YNP, risk: "Critical" },
    { id: 17, label: "Are geolocation records stored in a structured format (GeoJSON/CSV)?", options: YNP, risk: "Critical" },
    { id: 18, label: "Are GPS data collection tools available to field teams?", options: YN, risk: "Medium" },
    { id: 19, label: "Do you validate coordinates against satellite/forest layers?", options: YNP, risk: "High" },
  ]},
  { title: "D. Deforestation-Free Verification", questions: [
    { id: 20, label: "Can you demonstrate plots were deforestation-free after 31 Dec 2020?", options: YNP, risk: "Critical" },
    { id: 21, label: "Do you have remote-sensing or third-party deforestation evidence?", options: YNP, risk: "Critical" },
    { id: 22, label: "Are deforestation checks performed for every batch?", options: YNP, risk: "Critical" },
    { id: 23, label: "Do you re-verify plots periodically?", options: YNP, risk: "High" },
    { id: 24, label: "Are deforestation verification records archived?", options: YNP, risk: "High" },
  ]},
  { title: "E. Legality", questions: [
    { id: 25, label: "Can you provide proof of legal land use rights at source?", options: YNP, risk: "High" },
    { id: 26, label: "Do you have evidence of compliance with national environmental laws?", options: YNP, risk: "Critical" },
    { id: 27, label: "Are labour rights and indigenous consent documented at source?", options: YNP, risk: "MediumHigh" },
    { id: 28, label: "Do you maintain tax and trade compliance records?", options: YNP, risk: "High" },
    { id: 29, label: "Have anti-corruption checks been performed in the supply chain?", options: YNP, risk: "High" },
  ]},
  { title: "F. Due Diligence System", questions: [
    { id: 30, label: "Do you have a formal EUDR due diligence procedure?", options: YNI, risk: "Critical" },
    { id: 31, label: "Have you performed a documented risk assessment?", options: YNP, risk: "Critical" },
    { id: 32, label: "Do you implement risk-mitigation measures where needed?", options: YNP, risk: "High" },
    { id: 33, label: "Can you generate a Due Diligence Statement (DDS) on demand?", options: YNI, risk: "Critical" },
    { id: 34, label: "Are DDS records retained for at least 5 years?", options: YN, risk: "MediumHigh" },
    { id: 35, label: "Is there a designated EUDR compliance officer?", options: YN, risk: "High" },
    { id: 36, label: "Are due diligence outputs reviewed by senior management?", options: YNP, risk: "Critical" },
  ]},
  { title: "G. EU Buyer Support", questions: [
    { id: 37, label: "Have you discussed DDS data needs with your EU buyers?", options: YNI, risk: "High" },
    { id: 38, label: "Do you have a buyer communication protocol for compliance?", options: YNP, risk: "MediumHigh" },
    { id: 39, label: "Can you submit DDS to the EU TRACES information system?", options: YNI, risk: "Critical" },
    { id: 40, label: "Can you provide DDS reference numbers to EU buyers?", options: YNI, risk: "Critical" },
    { id: 41, label: "Do you support buyer audits of EUDR data?", options: YNP, risk: "High" },
    { id: 42, label: "Have you aligned data formats with EU buyer requirements?", options: YNP, risk: "MediumHigh" },
    { id: 43, label: "Are you prepared for potential shipment holds during enforcement?", options: YNI, risk: "Critical" },
  ]},
  { title: "H. Technology & Data Systems", questions: [
    { id: 44, label: "Do you use a digital traceability platform?", options: YNP, risk: "MediumHigh" },
    { id: 45, label: "Can your systems store and export geolocation data?", options: YNP, risk: "Critical" },
    { id: 46, label: "Can your systems generate machine-readable DDS exports?", options: YNI, risk: "Critical" },
    { id: 47, label: "Do you have data quality controls in place?", options: YNP, risk: "Medium" },
    { id: 48, label: "Are supplier data captured through structured digital intake?", options: YNP, risk: "High" },
    { id: 49, label: "Do you integrate satellite/remote-sensing data feeds?", options: YNP, risk: "MediumHigh" },
  ]},
  { title: "I. Capacity Building", questions: [
    { id: 50, label: "Have internal teams been trained on EUDR requirements?", options: YNP, risk: "Medium" },
    { id: 51, label: "Have supplier awareness/onboarding programs been conducted?", options: YNP, risk: "High" },
    { id: 52, label: "Are MSME suppliers supported with traceability tools?", options: YNP, risk: "MediumHigh" },
    { id: 53, label: "Are cooperatives or producer groups engaged in compliance?", options: YNP, risk: "Medium" },
    { id: 54, label: "Have you allocated budget for EUDR compliance?", options: YNP, risk: "Medium" },
    { id: 55, label: "Have you piloted EUDR compliance for at least one product line?", options: YNI, risk: "MediumHigh" },
    { id: 56, label: "Is there a board-level mandate for EUDR readiness?", options: YN, risk: "High" },
    { id: 57, label: "Do you have an EUDR implementation roadmap with milestones?", options: YNI, risk: "High" },
  ]},
];

const riskWeights: Record<RiskLevel, number> = { Medium: 2, MediumHigh: 4, High: 6, Critical: 10 };
const negativeAnswers = new Set(["No","Not Sure","Partial","In Progress","","No System"]);
const allQuestions = sections.flatMap((s) => s.questions);

const EUDRChecker = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const fieldClass = "w-full px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-colors";

  const result = useMemo(() => {
    let totalRisk = 0, maxRisk = 0;
    const criticalGaps: number[] = [], highGaps: number[] = [];
    allQuestions.forEach((q) => {
      const w = riskWeights[q.risk]; maxRisk += w;
      const a = answers[q.id] ?? "";
      if (negativeAnswers.has(a)) { totalRisk += w; if (q.risk === "Critical") criticalGaps.push(q.id); if (q.risk === "High") highGaps.push(q.id); }
    });
    const readiness = maxRisk ? Math.round(((maxRisk - totalRisk) / maxRisk) * 100) : 0;
    let verdict;
    if (readiness >= 85) verdict = { hue: "172 66% 40%", label: "EUDR Ready", level: "Low", risk: "Strong compliance posture", Icon: CheckCircle2 };
    else if (readiness >= 60) verdict = { hue: "38 92% 50%", label: "Partially Ready", level: "Medium", risk: "Some gaps remain", Icon: AlertTriangle };
    else verdict = { hue: "0 72% 51%", label: "High EUDR Compliance Risk", level: "High", risk: "Significant gaps", Icon: XCircle };

    let priorityArea = "General Compliance";
    if (criticalGaps.includes(14) || criticalGaps.includes(15) || criticalGaps.includes(16)) priorityArea = "Geolocation Data";
    if (criticalGaps.includes(20) || criticalGaps.includes(21) || criticalGaps.includes(22)) priorityArea = "Deforestation Verification";
    if (criticalGaps.includes(30) || criticalGaps.includes(31) || criticalGaps.includes(33)) priorityArea = "Due Diligence System";
    if (criticalGaps.includes(39) || criticalGaps.includes(40)) priorityArea = "EU Buyer DDS Support";

    const findings: string[] = [];
    if (criticalGaps.includes(14) || criticalGaps.includes(15) || criticalGaps.includes(16)) findings.push("Farm geolocation data collection is incomplete or unavailable.");
    if (criticalGaps.includes(20) || criticalGaps.includes(21)) findings.push("Deforestation-free verification documentation is insufficient.");
    if (highGaps.includes(7) || highGaps.includes(11)) findings.push("Supply chain traceability to farm level is not fully established.");
    if (criticalGaps.includes(30) || criticalGaps.includes(31)) findings.push("Formal EUDR due diligence and risk assessment systems are missing.");
    if (criticalGaps.includes(39) || criticalGaps.includes(40)) findings.push("EU buyer DDS support processes are not fully prepared.");
    if (highGaps.includes(51) || highGaps.includes(57)) findings.push("Internal governance and EUDR implementation planning require strengthening.");
    if (findings.length === 0) findings.push("Your organisation demonstrates strong EUDR readiness capability.");

    let recommendations: string[];
    if (readiness < 50) recommendations = ["Immediately begin farm-level geolocation collection","Establish formal EUDR due diligence procedures","Create traceability linkage between farms and export batches","Engage EU buyers to confirm DDS data requirements","Develop centralized compliance document management system","Assign dedicated EUDR compliance responsibility internally"];
    else if (readiness < 80) recommendations = ["Improve supplier-level traceability validation","Strengthen land legality documentation processes","Digitize geolocation and compliance records","Test structured data export capabilities for DDS support","Conduct supplier awareness and onboarding programs"];
    else recommendations = ["Continue monitoring EUDR delegated acts and guidance updates","Maintain periodic supplier verification audits","Strengthen automated traceability integrations","Prepare for EU buyer compliance audits"];

    return { readiness, verdict, priorityArea, findings, recommendations };
  }, [answers]);

  const { readiness, verdict, priorityArea, findings, recommendations } = result;
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };
  const handleReset = () => { setAnswers({}); setSubmitted(false); };

  return (
    <div className="grid md:grid-cols-5 gap-5 animate-fade-in-up">
      <div className="md:col-span-3 bg-card border border-border rounded-xl p-6 lg:p-7 h-full">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Trees className="w-5 h-5 text-primary" /></div>
          <h3 className="font-display text-xl text-foreground">EUDR Readiness Checker</h3>
        </div>
        <p className="text-sm text-muted-foreground ml-12 mb-6">Risk-weighted self-assessment to evaluate your readiness against EUDR traceability, geolocation, and due diligence obligations.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          {sections.map((s) => (
            <div key={s.title}>
              <h4 className="text-sm font-semibold text-primary mb-3">{s.title}</h4>
              <div className="space-y-3">
                {s.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{q.label}</label>
                    <select value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} className={fieldClass}>
                      <option value="">Select an answer</option>
                      {q.options.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" variant="accent" className="px-6"><Send className="w-4 h-4" />Check EUDR Readiness</Button>
            <button type="button" onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">Reset</button>
          </div>
        </form>
      </div>

      <div className="md:col-span-2">
        <div ref={resultRef} className="bg-gradient-soft border border-border rounded-xl p-4 h-full sticky top-32">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display text-base text-accent-foreground">EUDR Readiness Report</h4>
            <span className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border">{submitted ? "Result" : "Sample"}</span>
          </div>
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: `hsl(${verdict.hue} / 0.35)` }}>
              <div className="px-3 py-2 flex items-center gap-2" style={{ background: `linear-gradient(90deg, hsl(${verdict.hue} / 0.95), hsl(${verdict.hue} / 0.7))` }}>
                <div className="w-7 h-7 rounded-md bg-white/20 backdrop-blur flex items-center justify-center shrink-0"><verdict.Icon className="w-4 h-4 text-white" /></div>
                <div className="min-w-0 flex-1"><p className="text-[9px] font-semibold uppercase tracking-widest text-white/80">EUDR Status</p><p className="font-display text-sm text-white leading-tight">{submitted ? verdict.label : "Awaiting Assessment"}</p></div>
                <div className="text-right shrink-0"><p className="text-[9px] font-semibold uppercase tracking-widest text-white/80">Score</p><p className="font-display text-sm text-white leading-tight">{submitted ? `${readiness}%` : "--"}</p></div>
              </div>
              <div className="grid grid-cols-2 divide-x" style={{ backgroundColor: `hsl(${verdict.hue} / 0.06)`, borderColor: `hsl(${verdict.hue} / 0.2)` }}>
                <div className="p-2.5"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</p><p className="font-display text-[13px] leading-tight mt-0.5" style={{ color: `hsl(${verdict.hue})` }}>{submitted ? verdict.level : "--"}</p><p className="text-[10px] text-muted-foreground mt-0.5">{verdict.risk}</p></div>
                <div className="p-2.5" style={{ borderColor: `hsl(${verdict.hue} / 0.2)` }}><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Priority Area</p><p className="font-display text-[13px] leading-tight mt-0.5" style={{ color: `hsl(${verdict.hue})` }}>{submitted ? priorityArea : "--"}</p><p className="text-[10px] text-muted-foreground mt-0.5">focus next</p></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Key findings</p>
              <div className="rounded-lg p-3 border" style={{ backgroundColor: `hsl(${verdict.hue} / 0.05)`, borderColor: `hsl(${verdict.hue} / 0.25)` }}>
                <ul className="space-y-1.5 text-[11px] text-foreground leading-snug">
                  {(submitted ? findings : ["Complete the assessment to generate findings."]).map((b) => (
                    <li key={b} className="flex gap-1.5"><span style={{ color: `hsl(${verdict.hue})` }}>•</span><span>{b}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Recommended next steps</p>
              <ul className="space-y-1 text-[11px] text-foreground leading-snug">
                {(submitted ? recommendations : ["Recommendations will appear after assessment."]).map((r) => (
                  <li key={r} className="flex gap-1.5"><CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: `hsl(${verdict.hue})` }} /><span>{r}</span></li>
                ))}
              </ul>
            </div>
            {!submitted && <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed pt-1"><Info className="w-3 h-3 shrink-0 mt-0.5" />Submit the form to generate a tailored, risk-weighted readiness report.</p>}
            {submitted && (
              <div data-html2canvas-ignore="true">
                <Button type="button" variant="accent" onClick={() => downloadElementAsPdf(null, "eudr-readiness-report.pdf")} className="w-full"><Download className="w-4 h-4" />Download PDF</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EUDRChecker;
