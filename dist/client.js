"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPiqClient = void 0;
const utils_1 = require("./utils");
const errors_1 = require("./errors");
class OTPiqClient {
    constructor(config) {
        this.baseUrl = "https://api.otpiq.com/api";
        this.apiKey = config.apiKey;
    }
    async request(endpoint, options = {}) {
        var _a, _b;
        const response = await fetch(`${this.baseUrl}${endpoint}`, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, options.headers) }));
        const data = await response.json();
        if (!response.ok) {
            // Handle 401 Unauthorized
            if (response.status === 401) {
                throw new errors_1.UnauthorizedError(data.message || "Unauthorized");
            }
            // Handle 404 Not Found
            if (response.status === 404) {
                throw new errors_1.NotFoundError(data.message || "Not found");
            }
            // Handle 429 Rate Limit
            if (response.status === 429) {
                throw new errors_1.RateLimitError(data.waitMinutes, data.maxRequests, data.timeWindowMinutes);
            }
            // Handle 400 errors
            if (response.status === 400) {
                // Insufficient credit error
                if ("requiredCredit" in data) {
                    throw new errors_1.InsufficientCreditError(data.yourCredit, data.requiredCredit, data.canCover);
                }
                // Spending threshold error
                if ("spendingThreshold" in data) {
                    throw new errors_1.SpendingThresholdError(data.currentSpending, data.spendingThreshold, data.cost);
                }
                // Trial mode error
                if ((_a = data.error) === null || _a === void 0 ? void 0 : _a.includes("trial mode")) {
                    throw new errors_1.TrialModeError();
                }
                // Sender ID errors
                if ((_b = data.error) === null || _b === void 0 ? void 0 : _b.includes("SenderID")) {
                    throw new errors_1.SenderIdError(data.error);
                }
                // Generic validation error
                throw new errors_1.ValidationError(data.error || "Validation error");
            }
            throw new errors_1.OTPiqError(data.error || data.message || "Unknown error occurred", response.status, data);
        }
        return data;
    }
    async getProjectInfo() {
        return this.request("/info");
    }
    async getSenderIds() {
        return this.request("/sender-ids");
    }
    async sendSMS(options) {
        var _a;
        let requestBody = {
            phoneNumber: options.phoneNumber,
            smsType: options.smsType,
            provider: options.provider || "auto",
        };
        // Handle verification type SMS
        if (options.smsType === "verification") {
            const verificationCode = ((_a = options.verificationCode) === null || _a === void 0 ? void 0 : _a.toString()) ||
                (0, utils_1.generateRandomCode)(options.digitCount);
            requestBody.verificationCode = verificationCode;
            const response = await this.request("/sms", {
                method: "POST",
                body: JSON.stringify(requestBody),
            });
            return Object.assign(Object.assign({}, response), { verificationCode });
        }
        // Handle custom type SMS
        if (options.smsType === "custom") {
            if (!options.customMessage) {
                throw new errors_1.ValidationError("customMessage is required for custom SMS type");
            }
            if (!options.senderId) {
                throw new errors_1.ValidationError("senderId is required for custom SMS type");
            }
            requestBody = Object.assign(Object.assign({}, requestBody), { customMessage: options.customMessage, senderId: options.senderId, provider: "sms" });
            const response = await this.request("/sms", {
                method: "POST",
                body: JSON.stringify(requestBody),
            });
            return response;
        }
        throw new errors_1.OTPiqError(`Invalid smsType: ${options.smsType}`);
    }
    async trackSMS(smsId) {
        return this.request(`/sms/track/${smsId}`);
    }
    async sendWhatsApp(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { provider: "whatsapp" }));
    }
    async sendTelegram(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { provider: "telegram" }));
    }
    async sendCustomMessage(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { smsType: "custom" }));
    }
    async getSMSStatus(smsId) {
        return this.trackSMS(smsId);
    }
    async getCredits() {
        const info = await this.getProjectInfo();
        return info.credit;
    }
}
exports.OTPiqClient = OTPiqClient;
