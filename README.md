# OTPiq Client

A TypeScript/JavaScript client for the OTPiq SMS verification service. This package provides a clean and type-safe way to interact with the OTPiq API, supporting both automatic and custom verification code generation.

[![npm version](https://badge.fury.io/js/otpiq-client.svg)](https://www.npmjs.com/package/otpiq-client)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Features

- 📱 Easy SMS verification code sending
- 🎲 Automatic or custom verification code generation
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

// Send SMS with auto-generated verification code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
});

// The verification code is included in the response
const verificationCode = response.verificationCode;
console.log("Generated code:", verificationCode);
console.log("SMS ID:", response.smsId);
```

## Handling Verification Codes

### Auto-generated Codes

When you don't provide a verification code, the client automatically generates one and returns it in the response:

```typescript
// Auto-generated code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  digitCount: 6, // Optional: customize length (default: 6)
});

// Store this code to verify against user input later
const generatedCode = response.verificationCode;

// Example verification
function verifyUserInput(userInput: string) {
  return userInput === generatedCode;
}
```

### Next.js Example

Here's how you might use it in a Next.js API route:

```typescript
// pages/api/send-verification.ts
import { OTPiqClient } from "otpiq";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const client = new OTPiqClient({
    apiKey: process.env.OTPIQ_API_KEY,
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

    // Don't send the code back to the client for security!
    res.status(200).json({
      message: "Verification code sent",
      smsId: response.smsId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

### Sending SMS

```typescript
// Auto-generated verification code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  digitCount: 6, // Optional: length of generated code (default: 6)
  provider: "auto", // Optional: 'auto' | 'sms' | 'whatsapp'
});

// Custom verification code
const response = await client.sendSMS({
  phoneNumber: "9647701234567",
  smsType: "verification",
  verificationCode: "123456",
  provider: "sms",
});
```

### Tracking SMS Status

```typescript
const status = await client.trackSMS("sms-1234567890");
console.log("Status:", status.status);
console.log("Cost:", status.cost);
```

### Getting Project Info

```typescript
const info = await client.getProjectInfo();
console.log("Project name:", info.projectName);
console.log("Remaining credits:", info.credit);
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
    console.log("Need more credits!", error.requiredCredit);
  } else if (error instanceof RateLimitError) {
    console.log("Please wait", error.waitMinutes, "minutes");
  } else if (error instanceof OTPiqError) {
    console.log("API Error:", error.message);
  }
}
```

## Types

### SendSMSOptions

```typescript
interface SendSMSOptions {
  phoneNumber: string;
  verificationCode?: string | number;
  smsType: "verification";
  provider?: "auto" | "sms" | "whatsapp";
  digitCount?: number;
}
```

### SMSResponse

```typescript
interface SMSResponse {
  message: string;
  smsId: string;
  remainingCredit: number;
  verificationCode?: string; // Included in response
}
```

### SMSTrackingResponse

```typescript
interface SMSTrackingResponse {
  status: "pending" | "delivered" | "failed";
  phoneNumber: string;
  smsId: string;
  cost: number;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For support, please [create an issue](https://github.com/YadaCoder/otpiq/issues) on GitHub.
