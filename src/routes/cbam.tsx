import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import CBAMChecker from "@/components/checkers/CBAMChecker";

export const Route = createFileRoute("/cbam")({
  head: () => ({ meta: [
    { title: "CBAM Readiness Checker" },
    { name: "description", content: "Advanced CBAM readiness assessment for exporters and manufacturers." },
  ]}),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen">
      <AppHeader active="cbam" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <CBAMChecker />
      </main>
    </div>
  );
}
