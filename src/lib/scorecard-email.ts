import { generateScorecardPdfBase64 } from "@/services/scorecard-pdf";

export type ScorecardRegulation = "CBAM" | "DPP" | "EUDR";

export type ScorecardProfileField = {
  label: string;
  value: string;
};

export type ScorecardOverallMetric = {
  label: string;
  value: string;
};

export type ScorecardSection = {
  id: string;
  title: string;
  score: number;
  max: number;
  pct: number;
};

export type ScorecardPdfContent = {
  regulation: ScorecardRegulation;
  scorecardTitle: string;
  scorecardSubtitle: string;
  generatedAt: string;
  profileFields: ScorecardProfileField[];
  overallMetrics: ScorecardOverallMetric[];
  sections: ScorecardSection[];
  recommendation?: string;
  conclusion?: string;
};

export type ScorecardEmailRequest = ScorecardPdfContent & {
  recipientEmail: string;
  recipientName: string;
  pdfBase64?: string;
};

export type ScorecardEmailResponse = {
  ok: boolean;
  message: string;
};

export async function sendScorecardEmail(
  payload: ScorecardEmailRequest,
): Promise<ScorecardEmailResponse> {
  const payloadWithPdf: ScorecardEmailRequest = payload.pdfBase64
    ? payload
    : {
        ...payload,
        pdfBase64: generateScorecardPdfBase64(payload),
      };

  const response = await fetch("/api/send-scorecard-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadWithPdf),
  });

  let responseBody: ScorecardEmailResponse | null = null;
  try {
    responseBody = (await response.json()) as ScorecardEmailResponse;
  } catch {
    responseBody = null;
  }

  if (!response.ok || !responseBody?.ok) {
    throw new Error(responseBody?.message || "Failed to send scorecard email");
  }

  return responseBody;
}
