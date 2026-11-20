export interface VerifyWebhookSignatureOptions {
  /** Webhook secret shown in the dashboard for the phone number. */
  secret: string;
  /** Raw request body, exactly as received, before any JSON parsing. */
  rawBody: string;
  /** Value of the X-OTPIQ-Webhook-Timestamp header. */
  timestamp: string | null | undefined;
  /** Value of the X-OTPIQ-Webhook-Signature header ("sha256=<hex>"). */
  signature: string | null | undefined;
}

/**
 * Verifies the HMAC-SHA256 signature of a WhatsApp inbound webhook request.
 *
 * The signature is computed over `timestamp + "." + rawBody` with the webhook
 * secret as the key. Resolves to false for a missing or mismatching signature.
 */
export async function verifyWebhookSignature(
  options: VerifyWebhookSignatureOptions
): Promise<boolean> {
  const { secret, rawBody, timestamp, signature } = options;

  if (!secret || !timestamp || !signature) {
    return false;
  }

  const received = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${rawBody}`)
  );
  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, received.toLowerCase());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
