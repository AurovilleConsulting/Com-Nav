exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: "Invalid JSON payload" }),
    };
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: "Google Sheet webhook not configured" }),
    };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => JSON.stringify({ ok: res.ok }));
    return {
      statusCode: res.ok ? 200 : res.status,
      body: text || JSON.stringify({ ok: res.ok }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    console.error("submit function error", err);
    return {
      statusCode: 502,
      body: JSON.stringify({ ok: false, message: "Failed to forward to webhook" }),
    };
  }
};
