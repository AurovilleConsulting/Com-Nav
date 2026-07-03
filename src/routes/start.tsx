import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import ComplianceChecker from "@/components/checkers/ComplianceChecker";

export const Route = createFileRoute("/start")({
  head: () => ({ meta: [
    { title: "EU CBAM / DPP / EUDR Compliance Checker" },
    { name: "description", content: "Check whether your company may need to comply with EU CBAM, DPP and EUDR market environmental regulations." },
  ]}),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-2">
        <div className="relative mb-3 overflow-hidden rounded-xl border bg-gradient-to-br from-[#3b6fa0]/10 via-background to-[#c9a84c]/10 p-3">
          <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#3b6fa0]/20 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[#c9a84c]/20 blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 backdrop-blur px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3b6fa0] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3b6fa0]" />
              </span>
              Live readiness · CBAM · DPP · EUDR
            </span>
            <h1 className="font-display text-lg sm:text-xl text-foreground mt-1 leading-tight">
              EU Compliance Checker
            </h1>
            <p className="text-muted-foreground mt-0.5 max-w-2xl text-[11px] leading-relaxed">Quickly check whether your company may need to comply with key EU market environmental regulations.</p>
          </div>
        </div>
        <ComplianceChecker />
      </main>
    </div>
  );
}

