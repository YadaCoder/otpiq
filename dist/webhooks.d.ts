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
export declare function verifyWebhookSignature(options: VerifyWebhookSignatureOptions): Promise<boolean>;
