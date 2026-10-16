export const handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, message: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
    if (typeof body.companyName === "string" && !body.company) body.company = body.companyName;
    if (typeof body.company === "string" && !body.companyName) body.companyName = body.company;
    if (typeof body.pincode !== "string") body.pincode = "";
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: "Invalid JSON payload" }),
    };
  }

  // Hardcoded webhook for production availability
  // NOTE: this embeds the webhook URL in source — review if you prefer an env var instead.
  const webhookUrl = "https://script.google.com/macros/s/AKfycbxI2V3ZPfxDjTMZj1AvCALb_5ekxUEWGd0N2NfGd4GtR6Rnax-UfH-2zjGrrytLJhnb7w/exec";

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
