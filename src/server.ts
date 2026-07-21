import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type { ScorecardEmailRequest } from "./lib/scorecard-email";
import { buildScorecardEmailHtml, sendBrevoEmail, type BrevoConfig } from "./services/brevo";
import { generateScorecardPdfBase64 } from "./services/scorecard-pdf";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function readGoogleSheetWebhookUrl(env: unknown): string | undefined {
  // Hardcoded webhook for production availability
  // NOTE: this embeds the webhook URL in source — review if you prefer an env var instead.
  const HARDCODED_GOOGLE_SHEETS_WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbxI2V3ZPfxDjTMZj1AvCALb_5ekxUEWGd0N2NfGd4GtR6Rnax-UfH-2zjGrrytLJhnb7w/exec";
  return HARDCODED_GOOGLE_SHEETS_WEBHOOK_URL;
}

function readEnvValue(env: unknown, key: string): string | undefined {
  if (env && typeof env === "object") {
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    const envGetter = (env as { get?: (name: string) => unknown }).get;
    if (typeof envGetter === "function") {
      const getterValue = envGetter(key);
      if (typeof getterValue === "string" && getterValue.trim()) {
        return getterValue.trim();
      }
    }
  }

  const processValue = globalThis.process?.env?.[key];
  if (typeof processValue === "string" && processValue.trim()) {
    return processValue.trim();
  }

  const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  const metaValue = metaEnv?.[key];
  return typeof metaValue === "string" && metaValue.trim() ? metaValue.trim() : undefined;
}

function readBrevoConfig(env: unknown): { config: BrevoConfig | null; missingKeys: string[] } {
  // Hardcoded fallback credentials
  const HARDCODED_BREVO_API_KEY = "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";
  const HARDCODED_BREVO_SENDER_EMAIL = "azhaa.talam@gmail.com";
  const HARDCODED_BREVO_SENDER_NAME = "Compliance Team";

  const apiKey = readEnvValue(env, "BREVO_API_KEY") ?? HARDCODED_BREVO_API_KEY;
  const senderEmail =
    readEnvValue(env, "BREVO_SENDER_EMAIL") ??
    readEnvValue(env, "BREVO_FROM_EMAIL") ??
    HARDCODED_BREVO_SENDER_EMAIL;
  const senderName =
    readEnvValue(env, "BREVO_SENDER_NAME") ??
    readEnvValue(env, "BREVO_FROM_NAME") ??
    HARDCODED_BREVO_SENDER_NAME;

  const missingKeys: string[] = [];
  if (!apiKey) missingKeys.push("BREVO_API_KEY");
  if (!senderEmail) missingKeys.push("BREVO_SENDER_EMAIL");
  if (!senderName) missingKeys.push("BREVO_SENDER_NAME");

  if (missingKeys.length > 0) {
    return { config: null, missingKeys };
  }

  return {
    config: { apiKey: apiKey!, senderEmail: senderEmail!, senderName: senderName! },
    missingKeys: [],
  };
}

async function handleComplianceSubmission(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Invalid JSON payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const companyName =
    typeof body.companyName === "string"
      ? body.companyName.trim()
      : typeof body.company === "string"
        ? body.company.trim()
        : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const pincode = typeof body.pincode === "string" ? body.pincode.trim() : "";
  const exposure = typeof body.exposure === "string" ? body.exposure : "";
  const sector = typeof body.sector === "string" ? body.sector : "";

  if (!companyName || !email || !pincode || !exposure || !sector) {
    return new Response(JSON.stringify({ ok: false, message: "Missing required form values" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const webhookUrl = readGoogleSheetWebhookUrl(env);
  if (!webhookUrl) {
    return new Response(
      JSON.stringify({ ok: false, message: "Google Sheet webhook not configured" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }

  const sheetPayload = {
    company: companyName,
    companyName,
    email,
    pincode,
    exposure,
    sector,
    submittedAt: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(sheetPayload),
  });

  const responseText = await response.text();
  return new Response(responseText || JSON.stringify({ ok: response.ok }), {
    status: response.ok ? 200 : response.status,
    headers: { "content-type": "application/json" },
  });
}

function isScorecardSection(value: unknown): value is ScorecardEmailRequest["sections"][number] {
  if (!value || typeof value !== "object") return false;
  const section = value as Record<string, unknown>;
  return (
    typeof section.id === "string" &&
    typeof section.title === "string" &&
    typeof section.score === "number" &&
    typeof section.max === "number" &&
    typeof section.pct === "number"
  );
}

function isScorecardField(value: unknown): value is ScorecardEmailRequest["profileFields"][number] {
  if (!value || typeof value !== "object") return false;
  const field = value as Record<string, unknown>;
  return typeof field.label === "string" && typeof field.value === "string";
}

function isValidScorecardEmailRequest(body: unknown): body is ScorecardEmailRequest {
  if (!body || typeof body !== "object") return false;

  const payload = body as Record<string, unknown>;
  return (
    (payload.regulation === "CBAM" ||
      payload.regulation === "DPP" ||
      payload.regulation === "EUDR") &&
    typeof payload.recipientEmail === "string" &&
    typeof payload.recipientName === "string" &&
    typeof payload.scorecardTitle === "string" &&
    typeof payload.scorecardSubtitle === "string" &&
    typeof payload.generatedAt === "string" &&
    Array.isArray(payload.profileFields) &&
    payload.profileFields.every(isScorecardField) &&
    Array.isArray(payload.overallMetrics) &&
    payload.overallMetrics.every(isScorecardField) &&
    Array.isArray(payload.sections) &&
    payload.sections.every(isScorecardSection) &&
    (payload.recommendation === undefined || typeof payload.recommendation === "string") &&
    (payload.conclusion === undefined || typeof payload.conclusion === "string") &&
    (payload.pdfBase64 === undefined || typeof payload.pdfBase64 === "string")
  );
}

async function handleScorecardEmailSubmission(request: Request, env: unknown): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Invalid JSON payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!isValidScorecardEmailRequest(body)) {
    return new Response(JSON.stringify({ ok: false, message: "Invalid scorecard email payload" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const recipientEmail = body.recipientEmail.trim();
  const recipientName = body.recipientName.trim();

  if (!recipientEmail || !recipientName) {
    return new Response(JSON.stringify({ ok: false, message: "Recipient details are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const { config: brevoConfig, missingKeys } = readBrevoConfig(env);
  if (!brevoConfig) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: `Brevo email configuration is missing: ${missingKeys.join(", ")}`,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }

  try {
    const base64Pdf =
      typeof body.pdfBase64 === "string" && body.pdfBase64
        ? body.pdfBase64
        : generateScorecardPdfBase64({
            ...body,
            recipientEmail,
            recipientName,
          });

    await sendBrevoEmail(brevoConfig, {
      to: [{ email: recipientEmail }],
      subject: "Your EU Compliance Scorecard",
      htmlContent: buildScorecardEmailHtml(recipientName),
      attachment: [
        {
          content: base64Pdf,
          name: "scorecard.pdf",
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : "Failed to send scorecard email";

    return new Response(JSON.stringify({ ok: false, message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, message: "Scorecard email sent successfully" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname === "/api/submit") {
      return handleComplianceSubmission(request, env);
    }
    if (url.pathname === "/api/send-scorecard-email") {
      return handleScorecardEmailSubmission(request, env);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};