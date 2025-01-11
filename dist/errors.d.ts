export declare class OTPiqError extends Error {
    statusCode?: number | undefined;
    response?: unknown | undefined;
    constructor(message: string, statusCode?: number | undefined, response?: unknown | undefined);
}
export declare class InsufficientCreditError extends OTPiqError {
    yourCredit: number;
    requiredCredit: number;
    constructor(yourCredit: number, requiredCredit: number);
}
export declare class RateLimitError extends OTPiqError {
    waitMinutes: number;
    maxRequests: number;
    timeWindowMinutes: number;
    constructor(waitMinutes: number, maxRequests: number, timeWindowMinutes: number);
}
