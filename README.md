# otpiq

[![npm version](https://img.shields.io/npm/v/otpiq.svg)](https://www.npmjs.com/package/otpiq)
[![license](https://img.shields.io/npm/l/otpiq.svg)](LICENSE)

TypeScript client for the [OTPiq](https://otpiq.com) messaging API. Send verification codes and messages over SMS, WhatsApp and Telegram, track delivery, and run WhatsApp campaigns.

The API itself is documented at [docs.otpiq.com](https://docs.otpiq.com).

## Install

```bash
npm install otpiq
```

Requires Node.js 20 or later. The package has no runtime dependencies; it uses the built-in `fetch` and Web Crypto.

## Quick start

```typescript
import { OTPiqClient } from "otpiq";

const client = new OTPiqClient({ apiKey: process.env.OTPIQ_API_KEY! });

const result = await client.sendSMS({
  phoneNumber: "9647501234567",
  smsType: "verification",
});

console.log(result.verificationCode); // the code that was sent, e.g. "481920"
console.log(result.smsId, result.cost, result.remainingCredit);
```

Phone numbers are in international format, digits only, without a leading `+`.

Keep the API key on the server. Store `verificationCode` yourself and compare it with what the user enters; the API does not check codes for you.

## Sending messages

### Verification codes

A code is generated when you don't pass one. Use `digitCount` to change its length (default 6), or `verificationCode` to send your own.

```typescript
await client.sendSMS({
  phoneNumber: "9647501234567",
  smsType: "verification",
  verificationCode: "482910",
  provider: "whatsapp-sms",
  senderId: "MyBrand",
});
```

### Providers

`provider` picks the channel, or a route that falls back from one channel to the next.

| Provider | Behaviour |
| --- | --- |
| `auto` | OTPiq chooses the channel. Default for verification codes. |
| `sms` | SMS only. |
| `whatsapp` | WhatsApp only. |
| `telegram` | Telegram only. |
| `whatsapp-sms` | WhatsApp, then SMS. |
| `telegram-sms` | Telegram, then SMS. |
| `whatsapp-telegram-sms` | WhatsApp, then Telegram, then SMS. |

`client.sendWhatsApp(options)` and `client.sendTelegram(options)` are shortcuts that set the provider for you.

### Custom messages

```typescript
await client.sendCustomMessage({
  phoneNumber: "9647501234567",
  customMessage: "Your order A-1042 is ready for pickup.",
  senderId: "MyBrand",
});
```

Custom messages go out over SMS unless you call `sendSMS` with `smsType: "custom"` and a different `provider`. Messages can be up to 1000 characters.

### WhatsApp templates

Send an approved template from your own connected WhatsApp Business account. The account ID, phone ID and template names come from `getWhatsAppResources()`.

```typescript
await client.sendWhatsAppTemplate({
  phoneNumber: "9647501234567",
  templateName: "order_update",
  whatsappAccountId: "68c46fecc504cdcec8fb3ef2",
  whatsappPhoneId: "68c46ff3c504cdcec8fb3f5e",
  templateParameters: {
    body: { "1": "A-1042" },
  },
});
```

## Tracking delivery

```typescript
const status = await client.trackSMS("sms-1234567890abcdef12345678");

status.status;        // "pending" | "sent" | "delivered" | "read" | "failed"
status.isFinalStatus; // true once no more attempts will be made
status.lastChannel;   // "sms" | "whatsapp" | "telegram"
status.channelFlow;   // [{ channel: "whatsapp", tried: true, success: false, error: "..." }, { channel: "sms", tried: true, success: true }]
```

## Webhooks

### Delivery status

Add `deliveryReport` to any send call to have status updates posted to your server.

```typescript
await client.sendSMS({
  phoneNumber: "9647501234567",
  smsType: "verification",
  deliveryReport: {
    webhookUrl: "https://example.com/webhooks/otpiq",
    deliveryReportType: "final", // "all" (default) or "final"
    webhookSecret: process.env.OTPIQ_WEBHOOK_SECRET,
  },
});
```

Each request carries your secret in the `X-OTPIQ-Webhook-Secret` header and a JSON body typed as `WebhookPayload`.

```typescript
import express from "express";
import type { WebhookPayload } from "otpiq";

const app = express();

app.post("/webhooks/otpiq", express.json(), (req, res) => {
  if (req.get("x-otpiq-webhook-secret") !== process.env.OTPIQ_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }

  const payload: WebhookPayload = req.body;
  if (payload.status === "failed") {
    console.error(payload.smsId, payload.channel, payload.reason);
  }

  res.sendStatus(200);
});
```

Respond with a 2xx status within 10 seconds. The same update can arrive more than once, so key your handling on `smsId` and `status`.

### Inbound WhatsApp messages

Inbound message webhooks are configured per phone number in the dashboard and are signed with HMAC-SHA256. `verifyWebhookSignature` checks the signature against the raw request body.

```typescript
import express from "express";
import { verifyWebhookSignature } from "otpiq";

const app = express();

app.post(
  "/webhooks/whatsapp",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const rawBody = req.body.toString("utf8");

    const valid = await verifyWebhookSignature({
      secret: process.env.OTPIQ_INBOUND_WEBHOOK_SECRET!,
      rawBody,
      timestamp: req.get("x-otpiq-webhook-timestamp"),
      signature: req.get("x-otpiq-webhook-signature"),
    });
    if (!valid) {
      return res.sendStatus(401);
    }

    const event = JSON.parse(rawBody);
    const eventId = req.get("x-otpiq-webhook-event-id"); // use this to skip duplicates
    // handle the event

    res.sendStatus(200);
  }
);
```

## Project, sender IDs and pricing

```typescript
const { projectName, credit } = await client.getProjectInfo();
const balance = await client.getCredits(); // IQD

const { data: senderIds } = await client.getSenderIds();
// [{ senderId: "MyBrand", status: "accepted", pricePerSms: { korekTelecom, asiaCell, zainIraq, others } }]

const pricing = await client.getInternationalPricing({ countryIso: "TR", limit: 50 });
// pricing.items: [{ country, network, price }] where price is IQD per SMS segment
```

## Delivery report exports

Generate a CSV of messages in a date range. Files stay available for 30 days.

```typescript
const report = await client.generateReport({
  startDate: new Date("2026-01-01"),
  endDate: new Date("2026-01-31"),
  statuses: ["delivered", "failed"], // optional
  phoneNumbers: ["9647501234567"],   // optional
});

console.log(report.downloadUrl, report.recordCount);

const reports = await client.listReports({ status: "available" });
```

## WhatsApp campaigns

Campaigns send one template to many recipients from your own WhatsApp Business account.

```typescript
// 1. Find the template and phone number to send from
const { data } = await client.getWhatsAppResources();
const account = data.businesses[0].whatsappAccounts![0];
const template = account.templates!.find((t) => t.name === "spring_offer")!;
const phone = account.phoneNumbers![0];

// 2. Create the campaign
const { data: campaign } = await client.createCampaign({
  name: "Spring offer",
  templateId: template.id!,
  phoneNumberId: phone.id!,
});

// 3. See which variables the template needs
const schema = await client.getCampaignRecipientSchema({ templateId: template.id! });
console.log(schema.data.fields, schema.data.exampleRecipient);

// 4. Add recipients (up to 1000 per campaign)
await client.addCampaignRecipients(campaign._id, [
  { phoneNumber: "9647712345678", templateParameters: { body: { "1": "Ali" } } },
  { phoneNumber: "9647509876543", templateParameters: { body: { "1": "Sara" } } },
]);

// 5. Optionally send a test to yourself, then start
await client.sendCampaignSample(campaign._id, [
  { phoneNumber: "9647501234567", templateParameters: { body: { "1": "Test" } } },
]);
await client.startCampaign(campaign._id);

// 6. Follow progress
const { data: detail } = await client.getCampaign(campaign._id, { status: "failed" });
console.log(detail.sentCount, detail.deliveredCount, detail.failedCount, detail.recipients);
```

To send later, create the campaign with `scheduleType: "schedule"` and a future `scheduledFor`. It starts on its own, so don't call `startCampaign`.

`listCampaigns`, `updateCampaign` and `deleteCampaign` cover the rest. Only draft and scheduled campaigns can be changed or deleted.

## Errors

Every failed request throws an `OTPiqError` or one of its subclasses. All of them carry `statusCode`.

| Class | When | Extra fields |
| --- | --- | --- |
| `ValidationError` | 400, invalid input | |
| `InsufficientCreditError` | 400, not enough credit | `yourCredit`, `requiredCredit`, `canCover` |
| `SpendingThresholdError` | 400, project spending limit reached | `currentSpending`, `spendingThreshold`, `cost` |
| `SenderIdError` | 400, the sender ID was rejected | |
| `TrialModeError` | 400, trial accounts can only message their own number | |
| `UnauthorizedError` | 401, missing or invalid API key | |
| `ForbiddenError` | 403, for example IP not on the project allowlist | |
| `NotFoundError` | 404 | |
| `RateLimitError` | 429 | `waitMinutes`, `maxRequests`, `timeWindowMinutes` |

```typescript
import { InsufficientCreditError, RateLimitError, OTPiqError } from "otpiq";

try {
  await client.sendSMS({ phoneNumber: "9647501234567", smsType: "verification" });
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Try again in ${error.waitMinutes} minutes`);
  } else if (error instanceof InsufficientCreditError) {
    console.log(`Need ${error.requiredCredit} IQD, have ${error.yourCredit}`);
  } else if (error instanceof OTPiqError) {
    console.log(error.statusCode, error.message);
  } else {
    throw error;
  }
}
```

## Testing with a dev key

OTPiq dev keys deliver every message to one development phone number that you set in the dashboard, whatever number the request contains. Use one as `apiKey` in development to avoid messaging real users. See [How Dev Keys Work](https://docs.otpiq.com/useful-articles/how-dev-key-works).

## Method reference

| Method | Endpoint |
| --- | --- |
| `getProjectInfo()`, `getCredits()` | `GET /info` |
| `getSenderIds()` | `GET /sender-ids` |
| `getInternationalPricing(options?)` | `GET /international-sms-pricing` |
| `sendSMS(options)`, `sendWhatsApp`, `sendTelegram`, `sendCustomMessage`, `sendWhatsAppTemplate` | `POST /sms` |
| `trackSMS(smsId)`, `getSMSStatus(smsId)` | `GET /sms/track/{smsId}` |
| `generateReport(options)` | `POST /reports/generate` |
| `listReports(options?)` | `GET /reports` |
| `getWhatsAppResources(options?)` | `GET /whatsapp/resources` |
| `createCampaign(options)` | `POST /whatsapp/campaigns` |
| `listCampaigns(options?)` | `GET /whatsapp/campaigns` |
| `getCampaign(id, options?)` | `GET /whatsapp/campaigns/{id}` |
| `updateCampaign(id, options)` | `PATCH /whatsapp/campaigns/{id}` |
| `deleteCampaign(id)` | `DELETE /whatsapp/campaigns/{id}` |
| `addCampaignRecipients(id, recipients)` | `POST /whatsapp/campaigns/{id}/recipients` |
| `sendCampaignSample(id, recipients)` | `POST /whatsapp/campaigns/{id}/sample` |
| `startCampaign(id)` | `POST /whatsapp/campaigns/{id}/start` |
| `getCampaignRecipientSchema(target)` | `GET /whatsapp/campaigns/recipient-payload` |

All request and response types are exported from the package.

## Development

```bash
npm install
npm test
```

## License

MIT
