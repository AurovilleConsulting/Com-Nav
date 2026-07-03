import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Download, Play, FileText, HelpCircle, BookOpen, Mail } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources for CBAM, DPP and DR" },
      { name: "description", content: "Watch introductory videos and download practical guidance on CBAM, DPP, and DR compliance." },
    ],
  }),
  component: ResourcesPage,
});

type Reg = "CBAM" | "DPP" | "DR";

const REG_STYLES: Record<Reg, { var: string; soft: string; label: string }> = {
  CBAM: { var: "var(--cbam)", soft: "var(--cbam-soft)", label: "CBAM" },
  DPP: { var: "var(--dpp)", soft: "var(--dpp-soft)", label: "DPP" },
  DR: { var: "var(--eudr)", soft: "var(--eudr-soft)", label: "DR" },
};

const VIDEOS: { tag: Reg; title: string; desc: string; duration: string }[] = [
  { tag: "CBAM", title: "CBAM in 5 minutes", desc: "What the Carbon Border Adjustment Mechanism means for exporters.", duration: "5:12" },
  { tag: "DPP", title: "Intro to Digital Product Passports", desc: "How DPPs will reshape product transparency in the EU.", duration: "6:40" },
  { tag: "DR", title: "Deforestation Regulation basics", desc: "Key obligations under the EU Deforestation Regulation.", duration: "4:55" },
  { tag: "CBAM", title: "Reporting embedded emissions", desc: "Practical steps to measure and report emissions data.", duration: "7:20" },
  { tag: "DPP", title: "Preparing your product data", desc: "Data points and supply chain info you'll need to collect.", duration: "5:48" },
  { tag: "DR", title: "Geolocation & due diligence", desc: "Traceability requirements for in-scope commodities.", duration: "6:05" },
];

const DOC_TYPES = [
  { key: "intro", title: "Introduction", desc: "A plain-language overview of the regulation.", icon: BookOpen },
  { key: "faq", title: "FAQ", desc: "Answers to the most common questions.", icon: HelpCircle },
  { key: "factsheet", title: "Fact Sheet", desc: "Key facts, dates, and obligations at a glance.", icon: FileText },
] as const;

function RegTag({ reg }: { reg: Reg }) {
  const s = REG_STYLES[reg];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.soft, color: s.var }}
    >
      {s.label}
    </span>
  );
}

function VideoCard({ v }: { v: (typeof VIDEOS)[number] }) {
  const s = REG_STYLES[v.tag];
  return (
    <a
      href="#"
      className="group flex flex-col h-full rounded-2xl border bg-card shadow-card overflow-hidden hover:shadow-elevated hover:-translate-y-0.5 transition-all"
    >
      <div
        className="relative aspect-video flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${s.soft} 0%, color-mix(in oklab, ${s.var} 22%, white) 100%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(circle at 70% 30%, color-mix(in oklab, ${s.var} 18%, transparent), transparent 60%)` }}
        />
        <div
          className="relative h-16 w-16 rounded-full grid place-items-center shadow-elevated transition-transform group-hover:scale-110"
          style={{ background: "var(--resources-green)", color: "white" }}
        >
          <Play className="w-7 h-7 translate-x-0.5" fill="currentColor" />
        </div>
        <div className="absolute top-3 left-3">
          <RegTag reg={v.tag} />
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {v.duration}
          </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-foreground leading-snug text-base">{v.title}</h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{v.desc}</p>
      </div>
    </a>
  );
}

function PdfCard({ reg, type }: { reg: Reg; type: (typeof DOC_TYPES)[number] }) {
  const s = REG_STYLES[reg];
  const Icon = type.icon;
  return (
    <div
      className="rounded-2xl border bg-card p-5 sm:p-6 flex flex-col h-full shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
      style={{ borderColor: `color-mix(in oklab, ${s.var} 18%, var(--border))` }}
    >
      <div className="flex items-start gap-3.5">
        <div
          className="h-12 w-12 rounded-xl grid place-items-center shrink-0"
          style={{ background: s.soft, color: s.var }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground leading-tight text-base">{type.title}</p>
          <p className="text-[11px] uppercase tracking-wider font-semibold mt-1" style={{ color: s.var }}>
            PDF · {reg}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 flex-1 leading-relaxed">{type.desc}</p>
      <Button asChild className="mt-5 w-full h-11" style={{ background: "var(--resources-green)", color: "white" }}>
        <a href="#" download>
          <Download className="w-4 h-4" /> Download PDF
        </a>
      </Button>
    </div>
  );
}

function ResourceGroup({ reg }: { reg: Reg }) {
  const s = REG_STYLES[reg];
  return (
    <section
      className="rounded-3xl border p-6 sm:p-8 shadow-card"
      style={{
        borderColor: `color-mix(in oklab, ${s.var} 22%, var(--border))`,
        background: `linear-gradient(180deg, color-mix(in oklab, ${s.var} 6%, var(--card)) 0%, var(--card) 100%)`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full" style={{ background: s.var }} />
          {reg} resources
        </h3>
        <RegTag reg={reg} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {DOC_TYPES.map((t) => (
          <PdfCard key={t.key} reg={reg} type={t} />
        ))}
      </div>
    </section>
  );
}

function ResourcesPage() {
  return (
    <div className="min-h-dvh bg-background">
      <style>{`:root { --resources-green: oklch(0.6 0.15 155); --resources-soft: oklch(0.97 0.03 155); }`}</style>
      <AppHeader active="none" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-20 text-center border shadow-elevated"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--resources-green) 14%, white) 0%, var(--resources-soft) 55%, var(--card) 100%)",
            borderColor: "color-mix(in oklab, var(--resources-green) 20%, var(--border))",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
            style={{ background: "color-mix(in oklab, var(--resources-green) 35%, transparent)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "color-mix(in oklab, var(--resources-green) 25%, transparent)" }}
          />
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mb-4"
            style={{ background: "white", color: "var(--resources-green)", border: "1px solid color-mix(in oklab, var(--resources-green) 25%, white)" }}
          >
            Knowledge hub
          </span>
          <h1 className="relative text-4xl sm:text-5xl lg:text-6xl font-display tracking-tight text-foreground">
            Resources for CBAM, DPP and DR
          </h1>
          <p className="relative text-base sm:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto leading-relaxed">
            Watch short introductory videos and download practical guidance documents to help your business prepare for EU compliance requirements.
          </p>
        </section>

        {/* Videos */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display tracking-tight text-foreground">Watch & learn</h2>
              <p className="text-base text-muted-foreground mt-2">Quick explainers on each regulation.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {VIDEOS.map((v, i) => (
              <VideoCard key={i} v={v} />
            ))}
          </div>
        </section>

        {/* Downloads */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-display tracking-tight text-foreground">Download guidance</h2>
            <p className="text-base text-muted-foreground mt-2">PDF introductions, FAQs, and fact sheets for each regulation.</p>
          </div>
          <div className="space-y-6 sm:space-y-8">
            <ResourceGroup reg="CBAM" />
            <ResourceGroup reg="DPP" />
            <ResourceGroup reg="DR" />
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 sm:py-16 text-center border shadow-elevated"
          style={{
            background: "linear-gradient(135deg, color-mix(in oklab, var(--resources-green) 85%, white) 0%, var(--resources-green) 55%, color-mix(in oklab, var(--resources-green) 75%, var(--eudr)) 100%)",
            borderColor: "transparent",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-30 blur-3xl bg-white"
          />
          <h2 className="relative text-3xl sm:text-4xl font-display tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Need help understanding which regulation applies to your business?
          </h2>
          <p className="relative text-base sm:text-lg text-white/90 mt-4 max-w-xl mx-auto leading-relaxed">
            Our experts can guide you through CBAM, DPP, and DR requirements specific to your sector.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90 h-12 px-7 text-base font-semibold shadow-elevated">
              <a href="mailto:ghg@aurovilleconsulting.com">
                <Mail className="w-5 h-5" /> Contact our experts
              </a>
            </Button>
            <Button asChild variant="ghost" className="text-white/90 hover:bg-white/10 hover:text-white h-12 px-4 text-sm font-medium underline-offset-4 hover:underline">
              <Link to="/">← Back to home</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}