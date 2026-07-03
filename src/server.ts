import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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
  const candidateEnv = env as Record<string, unknown> | undefined;
  const candidates = [
    candidateEnv?.GOOGLE_SHEETS_WEBHOOK_URL,
    candidateEnv?.VITE_GOOGLE_SHEETS_WEBHOOK_URL,
    typeof process !== "undefined" ? process.env.GOOGLE_SHEETS_WEBHOOK_URL : undefined,
    typeof process !== "undefined" ? process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
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

  const company = typeof body.company === "string" ? body.company.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const exposureCode = typeof body.exposure === "string" ? body.exposure : "";
  const sector = typeof body.sector === "string" ? body.sector : "";

  const EXPOSURE_LABELS: Record<string, string> = {
    yes: "Yes, currently – directly or through customers/traders",
    possibly: "Possibly – may reach the EU through the supply chain",
    future: "Not currently, but possible in future",
  };

  const exposure = EXPOSURE_LABELS[exposureCode] ?? exposureCode;

  if (!company || !email || !exposureCode || !sector) {
    return new Response(JSON.stringify({ ok: false, message: "Missing required form values" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const webhookUrl = readGoogleSheetWebhookUrl(env);
  if (!webhookUrl) {
    return new Response(JSON.stringify({ ok: false, message: "Google Sheet webhook not configured" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const sheetPayload = {
    company,
    email,
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
