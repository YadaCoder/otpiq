const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const {
  OTPiqClient,
  generateRandomCode,
  verifyWebhookSignature,
  InsufficientCreditError,
  SpendingThresholdError,
  RateLimitError,
  TrialModeError,
  SenderIdError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  OTPiqError,
} = require("../dist");

const realFetch = globalThis.fetch;
let calls;
let nextResponse;

function respond(status, body) {
  nextResponse = { status, body };
}

beforeEach(() => {
  calls = [];
  respond(200, {});
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: new URL(url),
      method: init.method,
      headers: init.headers,
      body: init.body ? JSON.parse(init.body) : undefined,
    });
    const text =
      typeof nextResponse.body === "string"
        ? nextResponse.body
        : JSON.stringify(nextResponse.body);
    return new Response(text, { status: nextResponse.status });
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const client = new OTPiqClient({ apiKey: "sk_test" });

test("sends the API key and targets the production base URL", async () => {
  respond(200, { projectName: "Demo", credit: 15000 });
  const info = await client.getProjectInfo();

  assert.deepEqual(info, { projectName: "Demo", credit: 15000 });
  assert.equal(calls[0].url.href, "https://api.otpiq.com/api/info");
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].headers.Authorization, "Bearer sk_test");
  assert.equal(calls[0].headers["Content-Type"], undefined);
});

test("baseUrl can be overridden", async () => {
  const custom = new OTPiqClient({ apiKey: "k", baseUrl: "http://localhost:3000/api/" });
  await custom.getProjectInfo();
  assert.equal(calls[0].url.href, "http://localhost:3000/api/info");
});

test("getCredits returns the credit number", async () => {
  respond(200, { projectName: "Demo", credit: 420 });
  assert.equal(await client.getCredits(), 420);
});

test("verification generates a code and returns it", async () => {
  respond(200, { smsId: "sms-1", cost: 80 });
  const res = await client.sendSMS({ phoneNumber: "9647501234567", smsType: "verification" });

  assert.match(res.verificationCode, /^\d{6}$/);
  assert.equal(res.smsId, "sms-1");
  assert.deepEqual(calls[0].body, {
    phoneNumber: "9647501234567",
    smsType: "verification",
    verificationCode: res.verificationCode,
    provider: "auto",
  });
  assert.equal(calls[0].headers["Content-Type"], "application/json");
});

test("verification passes a given code, digit count, sender ID and fallback route", async () => {
  await client.sendSMS({
    phoneNumber: "9647501234567",
    smsType: "verification",
    verificationCode: 4821,
    senderId: "MyBrand",
    provider: "whatsapp-telegram-sms",
    deliveryReport: { webhookUrl: "https://example.com/hook", deliveryReportType: "final" },
  });
  assert.deepEqual(calls[0].body, {
    phoneNumber: "9647501234567",
    smsType: "verification",
    verificationCode: "4821",
    senderId: "MyBrand",
    provider: "whatsapp-telegram-sms",
    deliveryReport: { webhookUrl: "https://example.com/hook", deliveryReportType: "final" },
  });

  const res = await client.sendSMS({ phoneNumber: "1", smsType: "verification", digitCount: 4 });
  assert.match(res.verificationCode, /^\d{4}$/);
});

test("custom message defaults to the SMS provider and does not need a sender ID", async () => {
  const res = await client.sendSMS({
    phoneNumber: "9647501234567",
    smsType: "custom",
    customMessage: "Your order is ready",
  });
  assert.equal(res.verificationCode, undefined);
  assert.deepEqual(calls[0].body, {
    phoneNumber: "9647501234567",
    smsType: "custom",
    customMessage: "Your order is ready",
    provider: "sms",
  });

  await assert.rejects(
    client.sendSMS({ phoneNumber: "1", smsType: "custom" }),
    ValidationError
  );
  assert.equal(calls.length, 1);
});

test("sendCustomMessage, sendWhatsApp and sendTelegram set type and provider", async () => {
  await client.sendCustomMessage({ phoneNumber: "1", customMessage: "Hi", senderId: "MyBrand" });
  assert.equal(calls[0].body.smsType, "custom");
  assert.equal(calls[0].body.senderId, "MyBrand");

  await client.sendWhatsApp({ phoneNumber: "1", smsType: "verification" });
  assert.equal(calls[1].body.provider, "whatsapp");

  await client.sendTelegram({ phoneNumber: "1", smsType: "verification" });
  assert.equal(calls[2].body.provider, "telegram");
});

test("sendWhatsAppTemplate sends template fields and validates required ones", async () => {
  await client.sendWhatsAppTemplate({
    phoneNumber: "9647501234567",
    templateName: "order_update",
    whatsappAccountId: "acc1",
    whatsappPhoneId: "ph1",
    templateParameters: { body: { 1: "A-1042" } },
  });
  assert.deepEqual(calls[0].body, {
    phoneNumber: "9647501234567",
    smsType: "whatsapp-template",
    templateName: "order_update",
    whatsappAccountId: "acc1",
    whatsappPhoneId: "ph1",
    templateParameters: { body: { 1: "A-1042" } },
    provider: "whatsapp",
  });

  await assert.rejects(
    client.sendSMS({ phoneNumber: "1", smsType: "whatsapp-template", templateName: "t" }),
    /whatsappAccountId is required/
  );
});

test("rejects an unknown smsType without calling the API", async () => {
  await assert.rejects(client.sendSMS({ phoneNumber: "1", smsType: "nope" }), OTPiqError);
  assert.equal(calls.length, 0);
});

test("trackSMS returns the channel flow", async () => {
  const body = {
    smsId: "sms-abc",
    phoneNumber: "964750123456",
    status: "sent",
    cost: 200,
    isFinalStatus: false,
    lastChannel: "whatsapp",
    channelFlow: [{ channel: "whatsapp", tried: true, success: true }, { channel: "sms", tried: false }],
  };
  respond(200, body);
  assert.deepEqual(await client.trackSMS("sms-abc"), body);
  assert.equal(calls[0].url.pathname, "/api/sms/track/sms-abc");

  await client.getSMSStatus("a/b");
  assert.equal(calls[1].url.pathname, "/api/sms/track/a%2Fb");
});

test("getInternationalPricing sends only the filters that are set", async () => {
  await client.getInternationalPricing({ countryIso: "IQ", limit: 50 });
  assert.equal(calls[0].url.pathname, "/api/international-sms-pricing");
  assert.equal(calls[0].url.search, "?limit=50&countryIso=IQ");

  await client.getInternationalPricing();
  assert.equal(calls[1].url.search, "");
});

test("reports: generate converts dates, list joins statuses", async () => {
  await client.generateReport({
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: "2026-01-31T23:59:59.999Z",
    statuses: ["delivered", "failed"],
  });
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].url.pathname, "/api/reports/generate");
  assert.deepEqual(calls[0].body, {
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-01-31T23:59:59.999Z",
    statuses: ["delivered", "failed"],
  });

  respond(200, []);
  assert.deepEqual(await client.listReports({ status: ["available", "expired"], limit: 10 }), []);
  assert.equal(calls[1].url.searchParams.get("status"), "available,expired");
  assert.equal(calls[1].url.searchParams.get("limit"), "10");
});

test("getWhatsAppResources passes includeTemplateComponents", async () => {
  await client.getWhatsAppResources({ includeTemplateComponents: true });
  assert.equal(calls[0].url.pathname, "/api/whatsapp/resources");
  assert.equal(calls[0].url.search, "?includeTemplateComponents=true");
});

test("campaign methods hit the documented routes", async () => {
  const id = "65a0a0a0a0a0a0a0a0a0a0a0";
  const recipients = [{ phoneNumber: "9647712345678", templateParameters: { body: { 1: "Ali" } } }];

  await client.createCampaign({
    name: "Launch",
    templateId: "t1",
    phoneNumberId: "p1",
    scheduleType: "schedule",
    scheduledFor: new Date("2030-01-01T09:00:00.000Z"),
  });
  await client.listCampaigns({ status: "draft", page: 1, limit: 20 });
  await client.getCampaign(id, { status: "failed", limit: 100 });
  await client.updateCampaign(id, { name: "Launch v2", scheduledFor: null });
  await client.addCampaignRecipients(id, recipients);
  await client.sendCampaignSample(id, recipients);
  await client.startCampaign(id);
  await client.deleteCampaign(id);
  await client.getCampaignRecipientSchema({ templateId: "t1" });
  await client.getCampaignRecipientSchema({ campaignId: id });

  const seen = calls.map((c) => `${c.method} ${c.url.pathname}${c.url.search}`);
  assert.deepEqual(seen, [
    "POST /api/whatsapp/campaigns",
    "GET /api/whatsapp/campaigns?status=draft&page=1&limit=20",
    `GET /api/whatsapp/campaigns/${id}?limit=100&status=failed`,
    `PATCH /api/whatsapp/campaigns/${id}`,
    `POST /api/whatsapp/campaigns/${id}/recipients`,
    `POST /api/whatsapp/campaigns/${id}/sample`,
    `POST /api/whatsapp/campaigns/${id}/start`,
    `DELETE /api/whatsapp/campaigns/${id}`,
    "GET /api/whatsapp/campaigns/recipient-payload?templateId=t1",
    `GET /api/whatsapp/campaigns/recipient-payload?_id=${id}`,
  ]);
  assert.deepEqual(calls[0].body, {
    name: "Launch",
    templateId: "t1",
    phoneNumberId: "p1",
    scheduleType: "schedule",
    scheduledFor: "2030-01-01T09:00:00.000Z",
  });
  assert.deepEqual(calls[3].body, { name: "Launch v2", scheduledFor: null });
  assert.deepEqual(calls[4].body, { recipients });
  assert.equal(calls[6].body, undefined);
});

test("maps API errors to error classes", async () => {
  const send = () => client.sendSMS({ phoneNumber: "1", smsType: "verification" });

  respond(400, { error: "Insufficient credit", yourCredit: 100, requiredCredit: 200, canCover: false });
  await assert.rejects(send(), (e) => e instanceof InsufficientCreditError && e.requiredCredit === 200 && e.canCover === false);

  respond(400, { error: "threshold", currentSpending: 9500, spendingThreshold: 10000, cost: 200 });
  await assert.rejects(send(), (e) => e instanceof SpendingThresholdError && e.spendingThreshold === 10000);

  respond(400, { error: "Account is in trial mode, add credit" });
  await assert.rejects(send(), TrialModeError);

  respond(400, { error: "SenderID not found" });
  await assert.rejects(send(), SenderIdError);

  respond(400, { error: "Phone must be a valid number" });
  await assert.rejects(send(), (e) => e instanceof ValidationError && e.message === "Phone must be a valid number" && e.statusCode === 400);

  respond(400, { message: "countryIso must be a 2-letter ISO code" });
  await assert.rejects(client.getInternationalPricing({ countryIso: "IRQ" }), (e) => e instanceof ValidationError && /countryIso/.test(e.message));

  respond(401, { message: "Unauthorized, please use your project api key" });
  await assert.rejects(send(), (e) => e instanceof UnauthorizedError && e.statusCode === 401);

  respond(403, { message: "Your IP address is not whitelisted for this project" });
  await assert.rejects(send(), (e) => e instanceof ForbiddenError && /whitelisted/.test(e.message));

  respond(404, { message: "SMS not found" });
  await assert.rejects(client.trackSMS("sms-x"), (e) => e instanceof NotFoundError && e.message === "SMS not found");

  respond(404, { error: "No data found for the specified date range" });
  await assert.rejects(client.listReports(), (e) => e instanceof NotFoundError && /No data found/.test(e.message));

  respond(429, { message: "Rate limit exceeded", waitMinutes: 8, maxRequests: 10, timeWindowMinutes: 10 });
  await assert.rejects(send(), (e) => e instanceof RateLimitError && e.waitMinutes === 8);

  respond(500, { message: "Internal server error" });
  await assert.rejects(send(), (e) => e instanceof OTPiqError && e.statusCode === 500 && e.message === "Internal server error");

  respond(502, "<html>Bad Gateway</html>");
  await assert.rejects(send(), (e) => e instanceof OTPiqError && e.statusCode === 502);
});

test("generateRandomCode returns digits of the requested length", () => {
  for (const length of [1, 4, 6, 20]) {
    assert.match(generateRandomCode(length), new RegExp(`^\\d{${length}}$`));
  }
  assert.match(generateRandomCode(), /^\d{6}$/);
  assert.throws(() => generateRandomCode(0), RangeError);
  assert.throws(() => generateRandomCode(2.5), RangeError);

  const digits = new Set(Array.from({ length: 200 }, () => generateRandomCode(6)).join(""));
  assert.equal(digits.size, 10);
});

test("verifyWebhookSignature accepts a valid signature and rejects anything else", async () => {
  const secret = "otpiq_live_sk" + "ab".repeat(32);
  const rawBody = JSON.stringify({ event: "whatsapp.inbound_message.received", text: "سڵاو" });
  const timestamp = "1767225600";
  const hex = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  assert.equal(await verifyWebhookSignature({ secret, rawBody, timestamp, signature: `sha256=${hex}` }), true);
  assert.equal(await verifyWebhookSignature({ secret, rawBody, timestamp, signature: hex }), true);
  assert.equal(await verifyWebhookSignature({ secret, rawBody: rawBody + " ", timestamp, signature: `sha256=${hex}` }), false);
  assert.equal(await verifyWebhookSignature({ secret, rawBody, timestamp: "1767225601", signature: `sha256=${hex}` }), false);
  assert.equal(await verifyWebhookSignature({ secret: "wrong", rawBody, timestamp, signature: `sha256=${hex}` }), false);
  assert.equal(await verifyWebhookSignature({ secret, rawBody, timestamp, signature: undefined }), false);
  assert.equal(await verifyWebhookSignature({ secret, rawBody, timestamp: null, signature: `sha256=${hex}` }), false);
});
