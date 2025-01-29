# OTPiq Client

A TypeScript/JavaScript client for the OTPiq SMS service. This package provides a clean and type-safe way to interact with the OTPiq API, supporting verification codes, custom messages, sender IDs, and message tracking.

[![npm version](https://badge.fury.io/js/otpiq-client.svg)](https://www.npmjs.com/package/otpiq-client)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

- 📱 SMS verification code sending
- 💬 Custom message support with sender IDs
- 🎲 Automatic or custom verification code generation
- ✨ WhatsApp message support
- ✅ Full TypeScript support
- 🔄 SMS status tracking
- 💳 Credit management
- ⚡ Promise-based API
- 🛡️ Comprehensive error handling

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
console.log("Available sender IDs:", senderIds.senderIds);
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
  provider: "auto", // Optional: 'auto' | 'sms' | 'whatsapp'
});

// Verification SMS with custom code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  verificationCode: "123456",
  provider: "whatsapp", // Optional
});

// Custom message with sender ID
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "custom",
  customMessage: "Your message here",
  senderId: "MyBrand",
});
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
console.log("Available sender IDs:", senderIds.senderIds);
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
  provider?: "auto" | "sms" | "whatsapp";
  digitCount?: number;
}
```

#### SMSResponse

```typescript
interface SMSResponse {
  message: string;
  smsId: string;
  remainingCredit: number;
  verificationCode?: string; // Only included for verification SMS
}
```

#### SMSTrackingResponse

```typescript
interface SMSTrackingResponse {
  status: "pending" | "delivered" | "failed";
  phoneNumber: string;
  smsId: string;
  cost: number;
}
```

#### SenderId

```typescript
interface SenderId {
  id: string;
  senderId: string;
  status: "accepted" | "pending";
  createdAt: string;
}
```

## Error Handling

The package includes built-in error classes for common API errors:

```typescript
import { OTPiqError, InsufficientCreditError, RateLimitError } from "otpiq";

try {
  await client.sendSMS({
    phoneNumber: "9647701234567",
    smsType: "verification",
  });
} catch (error) {
  if (error instanceof InsufficientCreditError) {
    console.log(
      `Need more credits! Required: ${error.requiredCredit}, ` +
        `Available: ${error.yourCredit}`
    );
  } else if (error instanceof RateLimitError) {
    console.log(
      `Rate limit exceeded. Try again in ${error.waitMinutes} minutes. ` +
        `Limit: ${error.maxRequests} requests per ${error.timeWindowMinutes} minutes`
    );
  } else if (error instanceof OTPiqError) {
    console.log("API Error:", error.message);
  }
}
```

## Best Practices

1. **Error Handling**: Always implement proper error handling to catch and handle specific error types.
2. **Verification Codes**: Never send verification codes back to the client. Store them securely server-side.
3. **Provider Selection**: Use 'auto' provider for verification codes unless you have a specific reason not to.
4. **Custom Messages**: Always use an approved sender ID when sending custom messages.
5. **Environment Variables**: Store your API key in environment variables, never hardcode it.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

## Support

For support:

1. [Create an issue](https://github.com/yadacoder/otpiq/issues) on GitHub
2. Contact support at info@otpiq.com
