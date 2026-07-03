# Google Sheets Webhook Setup

This repo already sends form submissions from `src/components/checkers/ComplianceChecker.tsx` to `/api/submit`.
The server handler in `src/server.ts` forwards those requests to a webhook URL configured by environment variables.

## Files added

- `.env.example` — sample env configuration
- `.gitignore` — updated to ignore local `.env`

## How to configure

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Set your webhook URL in `.env`:
   ```env
   GOOGLE_SHEETS_WEBHOOK_URL=https://your-webhook-endpoint.example.com
   ```

3. If needed, also set the VITE-prefixed version:
   ```env
   VITE_GOOGLE_SHEETS_WEBHOOK_URL=${GOOGLE_SHEETS_WEBHOOK_URL}
   ```

4. For local development, start the app normally:
   ```bash
   npm run dev
   ```

5. For Cloudflare deployment, configure the same variable in your deployment environment.
   - Use `wrangler secret put GOOGLE_SHEETS_WEBHOOK_URL` if you deploy with Wrangler
   - Or configure it in the Cloudflare dashboard

## Webhook expectations

The webhook must accept a JSON POST request containing:

- `company`
- `email`
- `exposure`
- `sector`
- `submittedAt`

The server sends these fields exactly as JSON.

## Example Google Apps Script webhook

Use this code in a Google Apps Script attached to a sheet:

```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID").getSheetByName("Sheet1");
  sheet.appendRow([
    new Date().toISOString(),
    data.company || "",
    data.email || "",
    data.exposure || "",
    data.sector || "",
    data.submittedAt || "",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

## Notes

- The app will not save to a Google Sheet until `GOOGLE_SHEETS_WEBHOOK_URL` is configured and the webhook endpoint is live.
- The current backend route is `/api/submit` and is already wired to forward valid submissions to that webhook.
