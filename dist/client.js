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
        const response = await fetch(`${this.baseUrl}${endpoint}`, Object.assign(Object.assign({}, options), { headers: Object.assign({ Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, options.headers) }));
        const data = await response.json();
        if (!response.ok) {
            if (response.status === 400 && "requiredCredit" in data) {
                throw new errors_1.InsufficientCreditError(data.yourCredit, data.requiredCredit);
            }
            if (response.status === 429) {
                throw new errors_1.RateLimitError(data.waitMinutes, data.maxRequests, data.timeWindowMinutes);
            }
            throw new errors_1.OTPiqError(data.error || "Unknown error occurred", response.status, data);
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
                throw new errors_1.OTPiqError("customMessage is required for custom SMS type");
            }
            requestBody = Object.assign(Object.assign({}, requestBody), { customMessage: options.customMessage, provider: "sms", senderId: options.senderId });
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
}
exports.OTPiqClient = OTPiqClient;
