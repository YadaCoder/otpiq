export declare class OTPiqError extends Error {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
export declare class InsufficientCreditError extends OTPiqError {
    yourCredit: number;
    requiredCredit: number;
    canCover: boolean;
    constructor(yourCredit: number, requiredCredit: number, canCover: boolean);
}
export declare class RateLimitError extends OTPiqError {
    waitMinutes: number;
    maxRequests: number;
    timeWindowMinutes: number;
    constructor(waitMinutes: number, maxRequests: number, timeWindowMinutes: number);
}
export declare class SpendingThresholdError extends OTPiqError {
    currentSpending: number;
    spendingThreshold: number;
    cost: number;
    constructor(currentSpending: number, spendingThreshold: number, cost: number);
}
export declare class SenderIdError extends OTPiqError {
    constructor(message: string);
}
export declare class TrialModeError extends OTPiqError {
    constructor();
}
export declare class ValidationError extends OTPiqError {
    constructor(message: string);
}
export declare class NotFoundError extends OTPiqError {
    constructor(message: string);
}
export declare class UnauthorizedError extends OTPiqError {
    constructor(message: string);
}
