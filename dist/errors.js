"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.InsufficientCreditError = exports.OTPiqError = void 0;
class OTPiqError extends Error {
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = "OTPiqError";
    }
}
exports.OTPiqError = OTPiqError;
class InsufficientCreditError extends OTPiqError {
    constructor(yourCredit, requiredCredit) {
        super(`Insufficient credit. You have ${yourCredit}, but ${requiredCredit} is required.`, 400);
        this.yourCredit = yourCredit;
        this.requiredCredit = requiredCredit;
        this.name = "InsufficientCreditError";
    }
}
exports.InsufficientCreditError = InsufficientCreditError;
class RateLimitError extends OTPiqError {
    constructor(waitMinutes, maxRequests, timeWindowMinutes) {
        super(`Rate limit exceeded. Please try again in ${waitMinutes} minutes.`, 429);
        this.waitMinutes = waitMinutes;
        this.maxRequests = maxRequests;
        this.timeWindowMinutes = timeWindowMinutes;
        this.name = "RateLimitError";
    }
}
exports.RateLimitError = RateLimitError;
