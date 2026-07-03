import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, BatteryCharging, ArrowRight, Globe, FileBarChart, Trees, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { LogoMark } from "@/components/LogoMark";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "EU Compliance Checker — CBAM · DPP · EUDR" },
    { name: "description", content: "Check whether your company may need to comply with EU CBAM, DPP and EUDR market environmental regulations." },
  ]}),
  component: LandingPage,
});

function EUStarsMark() {
  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill="hsl(220 50% 40% / 0.08)" stroke="hsl(220 50% 40% / 0.35)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="38" fill="hsl(220 50% 40% / 0.10)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = 60 + Math.cos(a) * 38;
        const y = 60 + Math.sin(a) * 38;
        return (
          <g key={i} transform={`translate(${x} ${y})`} style={{ animation: `starTwinkle 2.4s ease-in-out ${i * 0.12}s infinite` }}>
            <polygon
              points="0,-4 1.18,-1.24 4,-1.24 1.7,0.47 2.47,3.24 0,1.5 -2.47,3.24 -1.7,0.47 -4,-1.24 -1.18,-1.24"
              fill="#c9a84c"
            />
          </g>
        );
      })}
      <g style={{ transformOrigin: "60px 60px", animation: "shieldPulse 3s ease-in-out infinite" }}>
        <foreignObject x="34" y="34" width="52" height="52">
          <LogoMark size={52} />
        </foreignObject>
      </g>
    </svg>
  );
}

function ChargingLoader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const duration = 3500;
    const tick = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        setTimeout(onDone, 200);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center gap-5 px-6 max-w-md w-full mx-auto animate-in fade-in duration-500">
      <BatteryCharging className="w-12 h-12 text-primary animate-pulse" strokeWidth={1.5} />
      <div>
        <p className="text-lg font-semibold text-foreground text-center">Loading your checker</p>
        <p className="mt-1 text-sm text-muted-foreground text-center">Preparing the EU Compliance Checker…</p>
      </div>
      <div className="w-full relative">
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden border border-border relative">
          <div
            className="h-full bg-gradient-to-r from-[#3b6fa0] to-[#c9a84c] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-100 ease-linear pointer-events-none"
          style={{ left: `calc(${progress}% - 12px)` }}
        >
          <div className="bg-card border border-border rounded-md shadow-sm p-0.5">
            <Package className="w-4 h-4 text-primary" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center tabular-nums">{Math.round(progress)}%</p>
      </div>
    </div>
  );
}

function LandingPage() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const start = () => navigate({ to: "/start" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes shieldPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      <AppHeader />
      <section className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#3b6fa0]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#c9a84c]/15 blur-3xl" />
        <div className="relative max-w-2xl mx-auto text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="flex items-center justify-center" style={{ animation: "floaty 4s ease-in-out infinite" }}>
            <EUStarsMark />
          </div>
          <h1 className="mt-5 text-3xl md:text-4xl font-bold text-foreground leading-tight tracking-tight">
            EU Compliance Checker
          </h1>
          <p className="mt-2 text-sm md:text-base font-medium text-primary">
            CBAM · DPP · DR · Readiness Decision Support
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Quickly check whether your company may need to comply with key EU market environmental regulations — and assess your readiness across each.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-2.5 py-1"><Globe className="h-3 w-3 text-[#c9a84c]" /> CBAM</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-2.5 py-1"><FileBarChart className="h-3 w-3 text-[#3b6fa0]" /> DPP</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-2.5 py-1"><Trees className="h-3 w-3 text-emerald-600" /> EUDR</span>
          </div>

          <div className="mt-8 min-h-[180px] flex items-center justify-center">
            {!ready ? (
              <ChargingLoader onDone={() => setReady(true)} />
            ) : (
              <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Button onClick={start} size="lg" className="px-8 shadow-md">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Start Assessment
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[11px] text-muted-foreground max-w-md leading-relaxed">
                  For manufacturers, exporters and MSMEs exploring EU market access and compliance readiness.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
