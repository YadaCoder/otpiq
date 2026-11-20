"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPiqClient = void 0;
const utils_1 = require("./utils");
const errors_1 = require("./errors");
const DEFAULT_BASE_URL = "https://api.otpiq.com/api";
function toISOString(value) {
    return value instanceof Date ? value.toISOString() : value;
}
class OTPiqClient {
    constructor(config) {
        var _a;
        this.apiKey = config.apiKey;
        this.baseUrl = ((_a = config.baseUrl) !== null && _a !== void 0 ? _a : DEFAULT_BASE_URL).replace(/\/+$/, "");
    }
    async request(endpoint, options = {}) {
        var _a, _b;
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries((_a = options.query) !== null && _a !== void 0 ? _a : {})) {
            if (value !== undefined && value !== null) {
                params.set(key, String(value));
            }
        }
        const query = params.toString();
        const url = `${this.baseUrl}${endpoint}${query ? `?${query}` : ""}`;
        const headers = {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
        };
        if (options.body !== undefined) {
            headers["Content-Type"] = "application/json";
        }
        const response = await fetch(url, {
            method: (_b = options.method) !== null && _b !== void 0 ? _b : "GET",
            headers,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        });
        const text = await response.text();
        let data = {};
        if (text) {
            try {
                data = JSON.parse(text);
            }
            catch (_c) {
                if (response.ok) {
                    throw new errors_1.OTPiqError("The API returned a response that is not valid JSON", response.status, text);
                }
            }
        }
        if (!response.ok) {
            throw this.toError(response.status, data);
        }
        return data;
    }
    toError(status, data) {
        const message = (data === null || data === void 0 ? void 0 : data.error) || (data === null || data === void 0 ? void 0 : data.message);
        if (status === 401) {
            return new errors_1.UnauthorizedError(message || "Unauthorized");
        }
        if (status === 403) {
            return new errors_1.ForbiddenError(message || "Forbidden", data);
        }
        if (status === 404) {
            return new errors_1.NotFoundError(message || "Not found");
        }
        if (status === 429) {
            return new errors_1.RateLimitError(data === null || data === void 0 ? void 0 : data.waitMinutes, data === null || data === void 0 ? void 0 : data.maxRequests, data === null || data === void 0 ? void 0 : data.timeWindowMinutes);
        }
        if (status === 400) {
            if (data && "requiredCredit" in data) {
                return new errors_1.InsufficientCreditError(data.yourCredit, data.requiredCredit, data.canCover);
            }
            if (data && "spendingThreshold" in data) {
                return new errors_1.SpendingThresholdError(data.currentSpending, data.spendingThreshold, data.cost);
            }
            if (message === null || message === void 0 ? void 0 : message.includes("trial mode")) {
                return new errors_1.TrialModeError();
            }
            if (message === null || message === void 0 ? void 0 : message.includes("SenderID")) {
                return new errors_1.SenderIdError(message);
            }
            const error = new errors_1.ValidationError(message || "Validation error");
            error.response = data;
            return error;
        }
        return new errors_1.OTPiqError(message || "Unknown error occurred", status, data);
    }
    // -------------------------------------------------------------------------
    // Project
    // -------------------------------------------------------------------------
    /** Project name and remaining credit. */
    async getProjectInfo() {
        return this.request("/info");
    }
    /** Remaining credit in IQD. */
    async getCredits() {
        const info = await this.getProjectInfo();
        return info.credit;
    }
    /** Sender IDs registered on the project, with their approval status and per-carrier prices. */
    async getSenderIds() {
        return this.request("/sender-ids");
    }
    /** International SMS prices per network, in IQD per SMS segment. */
    async getInternationalPricing(options = {}) {
        return this.request("/international-sms-pricing", {
            query: {
                page: options.page,
                limit: options.limit,
                countryIso: options.countryIso,
            },
        });
    }
    // -------------------------------------------------------------------------
    // Messaging
    // -------------------------------------------------------------------------
    /**
     * Sends a verification code, a custom message, or a WhatsApp template.
     *
     * For verification messages a code is generated when none is given, and the
     * code that was sent is returned as `verificationCode`.
     */
    async sendSMS(options) {
        var _a, _b, _c, _d;
        const body = {
            phoneNumber: options.phoneNumber,
            smsType: options.smsType,
        };
        for (const key of [
            "senderId",
            "templateName",
            "whatsappAccountId",
            "whatsappPhoneId",
            "templateParameters",
            "deliveryReport",
        ]) {
            if (options[key] !== undefined) {
                body[key] = options[key];
            }
        }
        if (options.smsType === "verification") {
            const verificationCode = ((_a = options.verificationCode) === null || _a === void 0 ? void 0 : _a.toString()) ||
                (0, utils_1.generateRandomCode)(options.digitCount);
            body.verificationCode = verificationCode;
            body.provider = (_b = options.provider) !== null && _b !== void 0 ? _b : "auto";
            const response = await this.request("/sms", {
                method: "POST",
                body,
            });
            return Object.assign(Object.assign({}, response), { verificationCode });
        }
        if (options.smsType === "custom") {
            if (!options.customMessage) {
                throw new errors_1.ValidationError("customMessage is required for custom SMS type");
            }
            body.customMessage = options.customMessage;
            body.provider = (_c = options.provider) !== null && _c !== void 0 ? _c : "sms";
            return this.request("/sms", { method: "POST", body });
        }
        if (options.smsType === "whatsapp-template") {
            for (const key of [
                "templateName",
                "whatsappAccountId",
                "whatsappPhoneId",
            ]) {
                if (!options[key]) {
                    throw new errors_1.ValidationError(`${key} is required for whatsapp-template SMS type`);
                }
            }
            body.provider = (_d = options.provider) !== null && _d !== void 0 ? _d : "whatsapp";
            return this.request("/sms", { method: "POST", body });
        }
        throw new errors_1.OTPiqError(`Invalid smsType: ${options.smsType}`);
    }
    /** Sends through WhatsApp only. */
    async sendWhatsApp(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { provider: "whatsapp" }));
    }
    /** Sends through Telegram only. */
    async sendTelegram(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { provider: "telegram" }));
    }
    /** Sends a custom text message. */
    async sendCustomMessage(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { smsType: "custom" }));
    }
    /** Sends an approved template from your own WhatsApp Business account. */
    async sendWhatsAppTemplate(options) {
        return this.sendSMS(Object.assign(Object.assign({}, options), { smsType: "whatsapp-template" }));
    }
    /** Delivery status of a message, including the outcome of each channel in its route. */
    async trackSMS(smsId) {
        return this.request(`/sms/track/${encodeURIComponent(smsId)}`);
    }
    /** Alias for trackSMS. */
    async getSMSStatus(smsId) {
        return this.trackSMS(smsId);
    }
    // -------------------------------------------------------------------------
    // Delivery report exports
    // -------------------------------------------------------------------------
    /**
     * Generates a CSV export of messages in a date range.
     * Download it from `downloadUrl`. Exports are kept for 30 days.
     */
    async generateReport(options) {
        return this.request("/reports/generate", {
            method: "POST",
            body: {
                startDate: toISOString(options.startDate),
                endDate: toISOString(options.endDate),
                phoneNumbers: options.phoneNumbers,
                statuses: options.statuses,
            },
        });
    }
    /** Previously generated exports, newest first. */
    async listReports(options = {}) {
        const status = Array.isArray(options.status)
            ? options.status.join(",")
            : options.status;
        return this.request("/reports", {
            query: { limit: options.limit, status: status || undefined },
        });
    }
    // -------------------------------------------------------------------------
    // WhatsApp
    // -------------------------------------------------------------------------
    /** Connected Meta businesses, WhatsApp Business accounts, phone numbers and templates. */
    async getWhatsAppResources(options = {}) {
        return this.request("/whatsapp/resources", {
            query: { includeTemplateComponents: options.includeTemplateComponents },
        });
    }
    /** Creates a campaign without recipients. Add them with addCampaignRecipients. */
    async createCampaign(options) {
        return this.request("/whatsapp/campaigns", {
            method: "POST",
            body: Object.assign(Object.assign({}, options), { scheduledFor: options.scheduledFor !== undefined
                    ? toISOString(options.scheduledFor)
                    : undefined }),
        });
    }
    /** Campaigns, newest first. */
    async listCampaigns(options = {}) {
        return this.request("/whatsapp/campaigns", {
            query: {
                status: options.status,
                page: options.page,
                limit: options.limit,
            },
        });
    }
    /** A campaign with a page of its recipients and their delivery status. */
    async getCampaign(id, options = {}) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}`, {
            query: {
                page: options.page,
                limit: options.limit,
                status: options.status,
                phoneNumber: options.phoneNumber,
            },
        });
    }
    /** Updates a campaign that is still a draft or scheduled. */
    async updateCampaign(id, options) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}`, {
            method: "PATCH",
            body: Object.assign(Object.assign({}, options), { scheduledFor: options.scheduledFor instanceof Date
                    ? options.scheduledFor.toISOString()
                    : options.scheduledFor }),
        });
    }
    /** Deletes a campaign that is still a draft or scheduled. */
    async deleteCampaign(id) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
    /**
     * Appends recipients to a draft or scheduled campaign.
     * Numbers already on the campaign are skipped. A campaign holds at most 1000 recipients.
     */
    async addCampaignRecipients(id, recipients) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}/recipients`, { method: "POST", body: { recipients } });
    }
    /** Reserves credit and starts sending. The campaign needs at least one recipient. */
    async startCampaign(id) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}/start`, { method: "POST" });
    }
    /**
     * Sends the campaign's template to a few test recipients right away.
     * This creates a separate sample campaign and leaves the original unchanged.
     */
    async sendCampaignSample(id, recipients) {
        return this.request(`/whatsapp/campaigns/${encodeURIComponent(id)}/sample`, { method: "POST", body: { recipients } });
    }
    /**
     * Describes the template variables each recipient must supply.
     * Pass either a template ID or a campaign ID.
     */
    async getCampaignRecipientSchema(target) {
        const query = "templateId" in target
            ? { templateId: target.templateId }
            : { _id: target.campaignId };
        return this.request("/whatsapp/campaigns/recipient-payload", { query });
    }
}
exports.OTPiqClient = OTPiqClient;
