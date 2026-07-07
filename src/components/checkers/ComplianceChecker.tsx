import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, Info, ArrowRight, Globe, FileBarChart, Trees } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

const regIcons: Record<string, LucideIcon> = {
  CBAM: Globe,
  DPP: FileBarChart,
  EUDR: Trees,
};

const regSubtitles: Record<string, string> = {
  CBAM: "Carbon Border Adjustment Mechanism",
  DPP: "Digital Product Passport",
  EUDR: "EU Deforestation Regulation",
};

type Exposure = "yes" | "possibly" | "future" | "";

// Per-sector applicability matrix
// "now" = Currently applicable | number = Expected applicability year | null = No applicability indicated
type Applicability = "now" | number | null;
type SectorRow = { name: string; dpp: Applicability; eudr: Applicability; cbam: Applicability };

const SECTOR_MATRIX: SectorRow[] = [
  { name: "Iron and steel sector",                                                                  dpp: "now",  eudr: null,  cbam: "now"  },
  { name: "Aluminum sector",                                                                        dpp: "now",  eudr: null,  cbam: "now"  },
  { name: "Textiles, garments and footwear sector",                                                 dpp: "now",  eudr: null,  cbam: 2028   },
  { name: "Furniture sector",                                                                       dpp: 2030,   eudr: "now", cbam: null   },
  { name: "Tyres and rubber products sector",                                                       dpp: "now",  eudr: "now", cbam: null   },
  { name: "Detergents and cleaning products sector",                                                dpp: "now",  eudr: null,  cbam: null   },
  { name: "Paints, coatings and varnishes sector",                                                  dpp: "now",  eudr: null,  cbam: null   },
  { name: "Lubricants and greases sector",                                                          dpp: "now",  eudr: null,  cbam: null   },
  { name: "Petrochemicals and basic chemicals sector",                                              dpp: "now",  eudr: null,  cbam: "now"  },
  { name: "Energy-related products with ecodesign requirements",                                    dpp: "now",  eudr: null,  cbam: 2028   },
  { name: "Information and communication technology products & other electronics sector",           dpp: "now",  eudr: null,  cbam: null   },
  { name: "Livestock and animal husbandry sector",                                                  dpp: null,   eudr: "now", cbam: null   },
  { name: "Leather and leather products sector",                                                    dpp: 2030,   eudr: "now", cbam: null   },
  { name: "Processed / derived meat products (Cattle)",                                             dpp: null,   eudr: "now", cbam: null   },
  { name: "Meat processing sector (cattle-based products)",                                         dpp: null,   eudr: "now", cbam: null   },
  { name: "Tropical commodities and derived products sector (coffee, palm oil, rubber, cocoa, soya)", dpp: null, eudr: "now", cbam: null   },
  { name: "Wood and wood products sector (excluding Furniture)",                                    dpp: null,   eudr: "now", cbam: null   },
  { name: "Cement sector",                                                                          dpp: null,   eudr: null,  cbam: "now"  },
  { name: "Fertilisers sector",                                                                     dpp: null,   eudr: null,  cbam: "now"  },
  { name: "Electricity generation and supply sector",                                               dpp: null,   eudr: null,  cbam: "now"  },
  { name: "Hydrogen production sector",                                                             dpp: null,   eudr: null,  cbam: "now"  },
  { name: "Plastics and polymers sector",                                                           dpp: null,   eudr: null,  cbam: "now"  },
];

const SECTORS = SECTOR_MATRIX.map((s) => s.name);

type Tone = "red" | "amber" | "green" | "grey";
type Verdict = { reg: string; status: string; tone: Tone; message: string; timeline?: string; advancedUrl?: string };

const placeholderResults: Verdict[] = [
  { reg: "CBAM", status: "Currently applicable", tone: "red", message: "Run the checker to see whether CBAM reporting obligations may apply to your sector and EU exposure.", advancedUrl: "/cbam" },
  { reg: "DPP", status: "Likely relevant from 2027", tone: "amber", message: "Run the checker to see whether your products will fall under upcoming Digital Product Passport requirements.", advancedUrl: "/dpp" },
  { reg: "EUDR", status: "No immediate action indicated", tone: "green", message: "Run the checker to confirm whether deforestation-free due diligence obligations may apply to your goods.", advancedUrl: "/eudr" },
];

const regMeta = {
  cbam: { reg: "CBAM", advancedUrl: "/cbam",  nowMsg: "Your company may already be in scope for CBAM reporting obligations if these products are exported to the EU directly or through your customers.", futureMsg: (y: number) => `CBAM obligations are expected to apply to your sector from ${y}. Begin preparing data and reporting workflows now.`, noneMsg: "Based on your selected sector, no CBAM applicability is currently indicated." },
  dpp:  { reg: "DPP",  advancedUrl: "/dpp",   nowMsg: "Prepare for product-level data, traceability, durability, repairability, recycled content, and environmental performance disclosure requirements.", futureMsg: (y: number) => `DPP requirements are expected to apply to your sector from ${y}. Start aligning product data systems ahead of enforcement.`, noneMsg: "Based on your selected sector, no DPP applicability is currently indicated." },
  eudr: { reg: "EUDR", advancedUrl: "/eudr",  nowMsg: "Your company may need to provide traceability, geolocation, deforestation-free evidence, and due diligence information for relevant products entering the EU.", futureMsg: (y: number) => `EUDR requirements are expected to apply to your sector from ${y}.`, noneMsg: "Based on your selected sector, no EUDR applicability is currently indicated." },
} as const;

const buildVerdict = (kind: "cbam" | "dpp" | "eudr", appl: Applicability, exposure: Exposure): Verdict => {
  const m = regMeta[kind];
  // If no EU exposure path at all, surface as not indicated regardless of sector
  const hasExposure = exposure === "yes" || exposure === "possibly" || exposure === "future";
  if (!hasExposure || appl === null) {
    return { reg: m.reg, status: "No immediate action indicated", tone: "green", message: m.noneMsg, timeline: "No action now", advancedUrl: m.advancedUrl };
  }
  if (appl === "now") {
    // Future-only exposure softens "currently applicable" into amber preparation
    if (exposure === "future") {
      return { reg: m.reg, status: "Prepare ahead — already in force", tone: "amber", message: `This regulation is already in force for your sector. ${m.nowMsg}`, timeline: "Active now", advancedUrl: m.advancedUrl };
    }
    return { reg: m.reg, status: "Currently applicable", tone: "red", message: m.nowMsg, timeline: "Active now", advancedUrl: m.advancedUrl };
  }
  // numeric year
  return { reg: m.reg, status: `Likely relevant from ${appl}`, tone: "amber", message: m.futureMsg(appl), timeline: `From ${appl}`, advancedUrl: m.advancedUrl };
};

const evaluate = (exposure: Exposure, sector: string): Verdict[] => {
  const row = SECTOR_MATRIX.find((s) => s.name === sector);
  if (!row) return placeholderResults;
  return [
    buildVerdict("cbam", row.cbam, exposure),
    buildVerdict("dpp",  row.dpp,  exposure),
    buildVerdict("eudr", row.eudr, exposure),
  ];
};

const toneStyles: Record<Tone, { card: string; badge: string; iconWrap: string; icon: React.ReactNode }> = {
  red:   { card: "border-rose-200 bg-white",     badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",         iconWrap: "bg-rose-50 text-rose-600",       icon: <AlertCircle className="w-3.5 h-3.5" /> },
  amber: { card: "border-amber-200 bg-white",    badge: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",      iconWrap: "bg-amber-50 text-amber-600",     icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  green: { card: "border-emerald-200 bg-white",  badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",iconWrap: "bg-emerald-50 text-emerald-600", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  grey:  { card: "border-slate-200 bg-white",    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",     iconWrap: "bg-slate-100 text-slate-600",    icon: <HelpCircle className="w-3.5 h-3.5" /> },
};

const STORAGE_KEY = "eu-compliance-checker";

const ComplianceChecker = () => {
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [exposure, setExposure] = useState<Exposure>("");
  const [sector, setSector] = useState("");
  const [results, setResults] = useState<Verdict[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setCompany(v.company || ""); setEmail(v.email || ""); setExposure(v.exposure || ""); setSector(v.sector || "");
        if (v.results) setResults(v.results);
      }
    } catch {}
  }, []);

  const persistSubmission = async (payload: { company: string; email: string; exposure: Exposure; sector: string }) => {
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.warn("Compliance submission save failed", text);
      }
    } catch (error) {
      console.warn("Compliance submission save error", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const trimmedCompany = company.trim();
    const trimmedEmail = email.trim();
    if (!trimmedCompany) errs.company = "Company name is required";
    if (!trimmedEmail) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errs.email = "Enter a valid email";
    if (!exposure) errs.exposure = "Please select EU market exposure";
    if (!sector) errs.sector = "Please select a sector";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const v = evaluate(exposure, sector);
    setResults(v);
    setIsSubmitting(true);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ company: trimmedCompany, email: trimmedEmail, exposure, sector, results: v, at: new Date().toISOString() })); } catch {}
    void persistSubmission({ company: trimmedCompany, email: trimmedEmail, exposure, sector });
  };

  const handleReset = () => { setCompany(""); setEmail(""); setExposure(""); setSector(""); setResults(null); setErrors({}); try { localStorage.removeItem(STORAGE_KEY); } catch {} };
  const fieldClass = (err?: string) => `w-full px-3 py-2.5 pr-9 bg-card border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/30 focus-visible:border-[#0f766e] transition-colors truncate ${err ? "border-destructive" : "border-border"}`;
  const selectClass = (err?: string) => `${fieldClass(err)} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-no-repeat bg-[right_0.75rem_center]`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-3 animate-fade-in-up">
      {/* Left column — form */}
      <div className="bg-card border border-border rounded-xl p-4 h-fit shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#0f766e]/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-[#0f766e]" /></div>
          <h3 className="font-display text-base text-foreground">Company Profile</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
          <div>
            <label htmlFor="cc-company" className="block text-xs font-medium text-foreground mb-1">Company name <span className="text-destructive">*</span></label>
            <input id="cc-company" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Enter company name" className={fieldClass(errors.company)} />
            {errors.company && <p className="text-xs text-destructive mt-1">{errors.company}</p>}
          </div>
          <div>
            <label htmlFor="cc-email" className="block text-xs font-medium text-foreground mb-1">Email ID <span className="text-destructive">*</span></label>
            <input id="cc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={fieldClass(errors.email)} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="cc-exposure" className="block text-xs font-medium text-foreground mb-1">Do your products reach the EU market, directly or through customers? <span className="text-destructive">*</span></label>
            <select id="cc-exposure" value={exposure} onChange={(e) => setExposure(e.target.value as Exposure)} className={selectClass(errors.exposure)}>
              <option value="">Select an option</option>
              <option value="yes">Yes, currently – directly or through customers/traders</option>
              <option value="possibly">Possibly – may reach the EU through the supply chain</option>
              <option value="future">Not currently, but possible in future</option>
            </select>
            {errors.exposure && <p className="text-xs text-destructive mt-1">{errors.exposure}</p>}
          </div>
          <div>
            <label htmlFor="cc-sector" className="block text-xs font-medium text-foreground mb-1">Sector <span className="text-destructive">*</span></label>
            <select id="cc-sector" value={sector} onChange={(e) => setSector(e.target.value)} className={selectClass(errors.sector)}>
              <option value="">Select a sector</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.sector && <p className="text-xs text-destructive mt-1">{errors.sector}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f766e] text-white text-sm font-semibold shadow-sm hover:bg-[#115e59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/40 transition-colors disabled:cursor-not-allowed disabled:opacity-70">
              <CheckCircle2 className="w-4 h-4" />{isSubmitting ? "Saving…" : "Check Compliance"}
            </button>
            <button type="button" onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors">Reset</button>
          </div>
        </form>
      </div>

      {/* Right column — results */}
      <div ref={resultRef} className="bg-card border border-border rounded-xl p-4 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-display text-base text-foreground leading-tight">Preliminary Compliance Results</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Indicative readiness across the three regulations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {(results ?? placeholderResults).map((r) => {
            const t = toneStyles[r.tone];
            const RegIcon = regIcons[r.reg];
            return (
              <div key={r.reg} className={`rounded-lg border ${t.card} p-3.5 flex flex-col shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-start gap-2.5 mb-2.5">
                  {RegIcon && <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${t.iconWrap}`}><RegIcon className="w-4 h-4" strokeWidth={1.75} /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm text-foreground leading-tight">{r.reg}</p>
                    <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{regSubtitles[r.reg]}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 self-start text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${t.badge}`}>
                  <span className="shrink-0">{t.icon}</span>
                  {r.status}
                </span>
                <p className="text-[11.5px] text-foreground/80 leading-snug flex-1">{r.message}</p>
                {r.advancedUrl && (
                  <div className="mt-3 pt-2.5 border-t border-border/60">
                    <Link to={r.advancedUrl} className="inline-flex w-full items-center justify-center gap-1 px-2.5 py-1.5 rounded-md border border-[#0f766e]/30 bg-[#0f766e]/5 text-[#0f766e] text-[11px] font-semibold hover:bg-[#0f766e]/10 transition-colors">
                      Proceed<ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-border/70">
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            This result is indicative and does not replace a detailed legal or technical assessment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecker;
