export class OTPiqError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "OTPiqError";
  }
}

export class InsufficientCreditError extends OTPiqError {
  constructor(public yourCredit: number, public requiredCredit: number) {
    super(
      `Insufficient credit. You have ${yourCredit}, but ${requiredCredit} is required.`,
      400
    );
    this.name = "InsufficientCreditError";
  }
}

export class RateLimitError extends OTPiqError {
  constructor(
    public waitMinutes: number,
    public maxRequests: number,
    public timeWindowMinutes: number
  ) {
    super(
      `Rate limit exceeded. Please try again in ${waitMinutes} minutes.`,
      429
    );
    this.name = "RateLimitError";
  }
}
