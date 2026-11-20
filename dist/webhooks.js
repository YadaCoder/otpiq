"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
/**
 * Verifies the HMAC-SHA256 signature of a WhatsApp inbound webhook request.
 *
 * The signature is computed over `timestamp + "." + rawBody` with the webhook
 * secret as the key. Resolves to false for a missing or mismatching signature.
 */
async function verifyWebhookSignature(options) {
    const { secret, rawBody, timestamp, signature } = options;
    if (!secret || !timestamp || !signature) {
        return false;
    }
    const received = signature.startsWith("sha256=")
        ? signature.slice("sha256=".length)
        : signature;
    const encoder = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
    const expected = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    return timingSafeEqual(expected, received.toLowerCase());
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
