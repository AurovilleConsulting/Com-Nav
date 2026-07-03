import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import DRReadinessChecker from "@/components/checkers/DRReadinessChecker";

export const Route = createFileRoute("/eudr")({
  head: () => ({ meta: [
    { title: "DR Readiness Assessment" },
    { name: "description", content: "Advanced DR readiness assessment for exporters and manufacturers." },
  ]}),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen">
      <AppHeader active="eudr" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <DRReadinessChecker />
      </main>
    </div>
  );
}
