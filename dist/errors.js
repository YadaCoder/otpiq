"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.TrialModeError = exports.SenderIdError = exports.SpendingThresholdError = exports.RateLimitError = exports.InsufficientCreditError = exports.OTPiqError = void 0;
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
    constructor(yourCredit, requiredCredit, canCover) {
        super(`Insufficient credit. You have ${yourCredit}, but ${requiredCredit} is required.`, 400);
        this.yourCredit = yourCredit;
        this.requiredCredit = requiredCredit;
        this.canCover = canCover;
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
class SpendingThresholdError extends OTPiqError {
    constructor(currentSpending, spendingThreshold, cost) {
        super(`Project spending threshold of ${spendingThreshold} IQD would be exceeded. Current spending: ${currentSpending} IQD`, 400);
        this.currentSpending = currentSpending;
        this.spendingThreshold = spendingThreshold;
        this.cost = cost;
        this.name = "SpendingThresholdError";
    }
}
exports.SpendingThresholdError = SpendingThresholdError;
class SenderIdError extends OTPiqError {
    constructor(message) {
        super(message, 400);
        this.name = "SenderIdError";
    }
}
exports.SenderIdError = SenderIdError;
class TrialModeError extends OTPiqError {
    constructor() {
        super("Account is in trial mode, you can only send sms to your own phone number for verification, add credit to send to other numbers", 400);
        this.name = "TrialModeError";
    }
}
exports.TrialModeError = TrialModeError;
class ValidationError extends OTPiqError {
    constructor(message) {
        super(message, 400);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends OTPiqError {
    constructor(message) {
        super(message, 404);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends OTPiqError {
    constructor(message) {
        super(message, 401);
        this.name = "UnauthorizedError";
    }
}
exports.UnauthorizedError = UnauthorizedError;
