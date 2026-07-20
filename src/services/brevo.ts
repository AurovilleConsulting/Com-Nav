type BrevoSender = {
  email: string;
  name: string;
};

type BrevoRecipient = {
  email: string;
};

type BrevoAttachment = {
  content: string;
  name: string;
};

type BrevoEmailPayload = {
  sender: BrevoSender;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  attachment: BrevoAttachment[];
};

export type BrevoConfig = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
};

export function buildScorecardEmailHtml(name: string): string {
  return `
    <p>Hello ${escapeHtml(name)},</p>
    <p>Thank you for completing the EU Compliance Assessment.</p>
    <p>Please find your compliance scorecard attached.</p>
    <p>Regards,<br />Compliance Team</p>
  `.trim();
}

export async function sendBrevoEmail(
  config: BrevoConfig,
  payload: Omit<BrevoEmailPayload, "sender">,
): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      sender: {
        email: config.senderEmail,
        name: config.senderName,
      },
      ...payload,
    } satisfies BrevoEmailPayload),
  });

  if (response.ok) return;

  const errorText = await response.text();
  throw new Error(errorText || "Brevo email request failed");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
