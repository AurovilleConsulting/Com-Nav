import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import DPPChecker from "@/components/checkers/DPPChecker";

export const Route = createFileRoute("/dpp")({
  head: () => ({ meta: [
    { title: "DPP Readiness Checker" },
    { name: "description", content: "Advanced DPP readiness assessment for exporters and manufacturers." },
  ]}),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen">
      <AppHeader active="dpp" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <DPPChecker />
      </main>
    </div>
  );
}
