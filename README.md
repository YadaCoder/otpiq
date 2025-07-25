# OTPiq Client

A TypeScript/JavaScript client for the OTPiq SMS service. This package provides a clean and type-safe way to interact with the OTPiq API, supporting verification codes, custom messages, sender IDs, and message tracking.

[![npm version](https://badge.fury.io/js/otpiq.svg)](https://www.npmjs.com/package/otpiq)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

- 📱 SMS verification code sending with auto-generation
- 💬 Custom message support with sender IDs
- 🎲 Automatic or custom verification code generation
- ✨ Multi-provider support: SMS, WhatsApp, Telegram
- ✅ Full TypeScript support with strict typing
- 🔄 Real-time SMS delivery tracking
- 💳 Credit balance and spending management
- ⚡ Promise-based API with async/await
- 🛡️ Comprehensive error handling with specific error types
- 📊 Carrier-specific pricing information
- 🚦 Built-in rate limit handling
- 💰 Spending threshold protection
- 🔔 Webhook support for real-time delivery notifications

## Installation

```bash
npm install otpiq
# or
yarn add otpiq
# or
pnpm add otpiq
```

## Quick Start

```typescript
import { OTPiqClient } from "otpiq";

// Initialize the client
const client = new OTPiqClient({
  apiKey: "your_api_key_here",
});

// Send verification SMS with auto-generated code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
});

console.log("Generated code:", response.verificationCode);
console.log("SMS ID:", response.smsId);
console.log("Cost:", response.cost, "IQD");
console.log("Remaining credit:", response.remainingCredit, "IQD");

// Send custom message with sender ID
const customResponse = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "custom",
  customMessage: "Welcome to our service!",
  senderId: "MyBrand",
});
```

## Handling Verification Codes

### Auto-generated Codes

When no verification code is provided, the client automatically generates one:

```typescript
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  digitCount: 6, // Optional: customize length (default: 6)
});

const generatedCode = response.verificationCode;
```

### Custom Verification Codes

You can provide your own verification code:

```typescript
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  verificationCode: "123456",
});
```

## Sending Custom Messages

Custom messages require a sender ID and will automatically use the SMS provider:

```typescript
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "custom",
  customMessage: "Your appointment is confirmed for tomorrow at 2 PM",
  senderId: "MyBrand",
});
```

## Managing Sender IDs

Retrieve all your approved sender IDs:

```typescript
const senderIds = await client.getSenderIds();
console.log("Available sender IDs:", senderIds.data);
```

## Next.js Example

Here's a complete Next.js API route implementation:

```typescript
// pages/api/send-verification.ts
import { OTPiqClient } from "otpiq";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const client = new OTPiqClient({
    apiKey: process.env.OTPIQ_API_KEY!,
  });

  try {
    const response = await client.sendSMS({
      phoneNumber: req.body.phoneNumber,
      smsType: "verification",
    });

    // Store the code securely (e.g., in your database or session)
    await storeVerificationCode({
      phoneNumber: req.body.phoneNumber,
      code: response.verificationCode,
      smsId: response.smsId,
    });

    res.status(200).json({
      message: "Verification code sent",
      smsId: response.smsId,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
}
```

## API Reference

### Initialization

```typescript
const client = new OTPiqClient({
  apiKey: "your_api_key_here",
});
```

### Methods

#### Send SMS

```typescript
// Verification SMS with auto-generated code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  digitCount: 6, // Optional
  provider: "auto", // Optional: 'auto' | 'sms' | 'whatsapp' | 'telegram'
});

// Verification SMS with custom code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  verificationCode: "123456",
  provider: "whatsapp", // Optional
});

// Custom message with sender ID (always uses SMS provider)
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "custom",
  customMessage: "Your message here",
  senderId: "MyBrand",
});
```

#### Convenience Methods

```typescript
// Send via WhatsApp
const response = await client.sendWhatsApp({
  phoneNumber: "9647701234567",
  smsType: "verification",
  verificationCode: "123456", // Optional
});

// Send via Telegram
const response = await client.sendTelegram({
  phoneNumber: "9647701234567",
  smsType: "verification",
});

// Send custom message (simplified method)
const response = await client.sendCustomMessage({
  phoneNumber: "9647701234567",
  customMessage: "Your order is ready for pickup!",
  senderId: "MyBrand",
});

// Get just the credit balance
const credits = await client.getCredits();
console.log(`Available credits: ${credits} IQD`);

// Alias for trackSMS
const status = await client.getSMSStatus("sms-1234567890");
```

#### Track SMS Status

```typescript
const status = await client.trackSMS("sms-1234567890");
console.log("Delivery status:", status.status);
console.log("Cost:", status.cost);
```

#### Get Project Info

```typescript
const info = await client.getProjectInfo();
console.log("Project name:", info.projectName);
console.log("Available credits:", info.credit);
```

#### Get Sender IDs

```typescript
const senderIds = await client.getSenderIds();
console.log("Available sender IDs:", senderIds.data);
```

### Type Definitions

#### SendSMSOptions

```typescript
interface SendSMSOptions {
  phoneNumber: string;
  smsType: "verification" | "custom";
  verificationCode?: string | number;
  customMessage?: string;
  senderId?: string;
  provider?: "auto" | "sms" | "whatsapp" | "telegram";
  digitCount?: number;
  deliveryReport?: DeliveryReport;
}
```

#### DeliveryReport

```typescript
interface DeliveryReport {
  webhookUrl: string;
  deliveryReportType?: "all" | "final";
  webhookSecret?: string;
}
```

#### SMSResponse

```typescript
interface SMSResponse {
  message: string;
  smsId: string;
  remainingCredit: number;
  cost: number;
  canCover: boolean;
  paymentType: "prepaid" | "postpaid";
  verificationCode?: string; // Only included for verification SMS
}
```

#### SMSTrackingResponse

```typescript
interface SMSTrackingResponse {
  status: "pending" | "sent" | "delivered" | "failed" | "expired";
  phoneNumber: string;
  smsId: string;
  cost: number;
}
```

#### SenderId

```typescript
interface SenderId {
  _id: string;
  senderId: string;
  status: "accepted" | "pending" | "rejected";
  pricePerSms: {
    korekTelecom: number;
    asiaCell: number;
    zainIraq: number;
    others: number;
  };
}
```

## Webhooks

Configure webhooks to receive real-time delivery status updates for your messages:

### Basic Webhook Setup

```typescript
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  deliveryReport: {
    webhookUrl: "https://your-app.com/webhooks/sms-status",
    deliveryReportType: "all", // or "final" for final status only
    webhookSecret: "your_secret_123" // optional, for security
  }
});
```

### Webhook Payload Structure

Your webhook endpoint will receive POST requests with the following payload:

```typescript
interface WebhookPayload {
  smsId: string;
  deliveryReportType: "all" | "final";
  isFinal: boolean;
  channel: "sms" | "whatsapp" | "telegram";
  status: "sent" | "delivered" | "failed";
  senderId?: string; // Only for SMS with custom sender IDs
  reason?: string; // Only when status is 'failed'
}
```

### Example Webhook Implementation (Express.js)

```typescript
app.post('/webhooks/sms-status', (req, res) => {
  const payload: WebhookPayload = req.body;
  const webhookSecret = req.headers['x-otpiq-webhook-secret'];
  
  // Verify webhook secret if configured
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }
  
  // Process the webhook
  console.log(`SMS ${payload.smsId} status: ${payload.status}`);
  
  if (payload.status === 'delivered') {
    // Handle successful delivery
  } else if (payload.status === 'failed') {
    console.error(`Delivery failed: ${payload.reason}`);
    // Handle failure
  }
  
  // Always respond quickly (within 10 seconds)
  res.status(200).send('OK');
});
```

### Webhook Configuration Options

- **webhookUrl**: HTTPS URL to receive status updates (required)
- **deliveryReportType**: 
  - `"all"` - Receive all status updates (sent, delivered, failed)
  - `"final"` - Receive only final status (delivered or failed)
- **webhookSecret**: Optional secret for webhook authentication

### Security Best Practices

1. Always use HTTPS for webhook URLs
2. Implement webhook secret validation
3. Respond within 10 seconds to avoid timeouts
4. Implement idempotency to handle duplicate webhooks
5. Log all webhook requests for debugging

## Error Handling

The package includes built-in error classes for common API errors:

```typescript
import {
  OTPiqError,
  InsufficientCreditError,
  RateLimitError,
  SpendingThresholdError,
  SenderIdError,
  TrialModeError,
  ValidationError,
  NotFoundError,
  UnauthorizedError
} from "otpiq";

try {
  await client.sendSMS({
    phoneNumber: "9647701234567",
    smsType: "verification",
  });
} catch (error) {
  if (error instanceof InsufficientCreditError) {
    console.log(
      `Need more credits! Required: ${error.requiredCredit}, ` +
        `Available: ${error.yourCredit}, Can cover: ${error.canCover}`
    );
  } else if (error instanceof RateLimitError) {
    console.log(
      `Rate limit exceeded. Try again in ${error.waitMinutes} minutes. ` +
        `Limit: ${error.maxRequests} requests per ${error.timeWindowMinutes} minutes`
    );
  } else if (error instanceof SpendingThresholdError) {
    console.log(
      `Spending threshold exceeded! Current: ${error.currentSpending}, ` +
        `Threshold: ${error.spendingThreshold}, Transaction cost: ${error.cost}`
    );
  } else if (error instanceof TrialModeError) {
    console.log("Trial mode: Can only send to your own phone number");
  } else if (error instanceof SenderIdError) {
    console.log("Sender ID error:", error.message);
  } else if (error instanceof ValidationError) {
    console.log("Validation error:", error.message);
  } else if (error instanceof NotFoundError) {
    console.log("Not found:", error.message);
  } else if (error instanceof UnauthorizedError) {
    console.log("Unauthorized:", error.message);
  } else if (error instanceof OTPiqError) {
    console.log("API Error:", error.message);
  }
}
```

## Best Practices

1. **Error Handling**: Always implement proper error handling to catch and handle specific error types.
2. **Verification Codes**: Never send verification codes back to the client. Store them securely server-side.
3. **Provider Selection**:
   - Use 'auto' provider for verification codes to let the system choose the best option
   - Custom messages always use SMS provider (enforced by the API)
   - Use WhatsApp/Telegram for verification codes when targeting specific platforms
4. **Custom Messages**: Always use an approved sender ID when sending custom messages.
5. **Environment Variables**: Store your API key in environment variables, never hardcode it.
6. **Rate Limiting**: Implement client-side rate limiting to avoid hitting API limits.
7. **Credit Monitoring**: Regularly check credit balance and implement alerts for low balance.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

## Support

For support:

1. [Create an issue](https://github.com/yadacoder/otpiq/issues) on GitHub
2. Contact support at info@otpiq.com
