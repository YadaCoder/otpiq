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
  constructor(
    public yourCredit: number, 
    public requiredCredit: number,
    public canCover: boolean
  ) {
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

export class SpendingThresholdError extends OTPiqError {
  constructor(
    public currentSpending: number,
    public spendingThreshold: number,
    public cost: number
  ) {
    super(
      `Project spending threshold of ${spendingThreshold} IQD would be exceeded. Current spending: ${currentSpending} IQD`,
      400
    );
    this.name = "SpendingThresholdError";
  }
}

export class SenderIdError extends OTPiqError {
  constructor(message: string) {
    super(message, 400);
    this.name = "SenderIdError";
  }
}

export class TrialModeError extends OTPiqError {
  constructor() {
    super(
      "Account is in trial mode, you can only send sms to your own phone number for verification, add credit to send to other numbers",
      400
    );
    this.name = "TrialModeError";
  }
}

export class ValidationError extends OTPiqError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends OTPiqError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends OTPiqError {
  constructor(message: string) {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}
