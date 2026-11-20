import {
  OTPiqConfig,
  SendSMSOptions,
  SendWhatsAppTemplateOptions,
  SMSResponse,
  ProjectInfo,
  SMSTrackingResponse,
  SenderIdsResponse,
  DeliveryReport,
  InternationalPricingOptions,
  InternationalPricingResponse,
  GenerateReportOptions,
  GenerateReportResponse,
  ListReportsOptions,
  DeliveryReportFile,
  WhatsAppResourcesResponse,
  CreateCampaignOptions,
  UpdateCampaignOptions,
  ListCampaignsOptions,
  GetCampaignOptions,
  CampaignRecipientInput,
  CampaignResponse,
  CampaignListResponse,
  CampaignDetailResponse,
  DeleteCampaignResponse,
  RecipientSchemaResponse,
} from "./types";
import { generateRandomCode } from "./utils";
import {
  OTPiqError,
  InsufficientCreditError,
  RateLimitError,
  SpendingThresholdError,
  SenderIdError,
  TrialModeError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "./errors";

const DEFAULT_BASE_URL = "https://api.otpiq.com/api";

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
}

function toISOString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export class OTPiqClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: OTPiqConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    const query = params.toString();
    const url = `${this.baseUrl}${endpoint}${query ? `?${query}` : ""}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let data: any = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        if (response.ok) {
          throw new OTPiqError(
            "The API returned a response that is not valid JSON",
            response.status,
            text
          );
        }
      }
    }

    if (!response.ok) {
      throw this.toError(response.status, data);
    }

    return data as T;
  }

  private toError(status: number, data: any): OTPiqError {
    const message: string | undefined = data?.error || data?.message;

    if (status === 401) {
      return new UnauthorizedError(message || "Unauthorized");
    }

    if (status === 403) {
      return new ForbiddenError(message || "Forbidden", data);
    }

    if (status === 404) {
      return new NotFoundError(message || "Not found");
    }

    if (status === 429) {
      return new RateLimitError(
        data?.waitMinutes,
        data?.maxRequests,
        data?.timeWindowMinutes
      );
    }

    if (status === 400) {
      if (data && "requiredCredit" in data) {
        return new InsufficientCreditError(
          data.yourCredit,
          data.requiredCredit,
          data.canCover
        );
      }

      if (data && "spendingThreshold" in data) {
        return new SpendingThresholdError(
          data.currentSpending,
          data.spendingThreshold,
          data.cost
        );
      }

      if (message?.includes("trial mode")) {
        return new TrialModeError();
      }

      if (message?.includes("SenderID")) {
        return new SenderIdError(message);
      }

      const error = new ValidationError(message || "Validation error");
      error.response = data;
      return error;
    }

    return new OTPiqError(message || "Unknown error occurred", status, data);
  }

  // -------------------------------------------------------------------------
  // Project
  // -------------------------------------------------------------------------

  /** Project name and remaining credit. */
  async getProjectInfo(): Promise<ProjectInfo> {
    return this.request<ProjectInfo>("/info");
  }

  /** Remaining credit in IQD. */
  async getCredits(): Promise<number> {
    const info = await this.getProjectInfo();
    return info.credit;
  }

  /** Sender IDs registered on the project, with their approval status and per-carrier prices. */
  async getSenderIds(): Promise<SenderIdsResponse> {
    return this.request<SenderIdsResponse>("/sender-ids");
  }

  /** International SMS prices per network, in IQD per SMS segment. */
  async getInternationalPricing(
    options: InternationalPricingOptions = {}
  ): Promise<InternationalPricingResponse> {
    return this.request<InternationalPricingResponse>(
      "/international-sms-pricing",
      {
        query: {
          page: options.page,
          limit: options.limit,
          countryIso: options.countryIso,
        },
      }
    );
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
  async sendSMS(
    options: SendSMSOptions
  ): Promise<SMSResponse & { verificationCode?: string }> {
    const body: Record<string, unknown> = {
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
    ] as const) {
      if (options[key] !== undefined) {
        body[key] = options[key];
      }
    }

    if (options.smsType === "verification") {
      const verificationCode =
        options.verificationCode?.toString() ||
        generateRandomCode(options.digitCount);

      body.verificationCode = verificationCode;
      body.provider = options.provider ?? "auto";

      const response = await this.request<SMSResponse>("/sms", {
        method: "POST",
        body,
      });
      return { ...response, verificationCode };
    }

    if (options.smsType === "custom") {
      if (!options.customMessage) {
        throw new ValidationError(
          "customMessage is required for custom SMS type"
        );
      }

      body.customMessage = options.customMessage;
      body.provider = options.provider ?? "sms";

      return this.request<SMSResponse>("/sms", { method: "POST", body });
    }

    if (options.smsType === "whatsapp-template") {
      for (const key of [
        "templateName",
        "whatsappAccountId",
        "whatsappPhoneId",
      ] as const) {
        if (!options[key]) {
          throw new ValidationError(
            `${key} is required for whatsapp-template SMS type`
          );
        }
      }

      body.provider = options.provider ?? "whatsapp";

      return this.request<SMSResponse>("/sms", { method: "POST", body });
    }

    throw new OTPiqError(`Invalid smsType: ${options.smsType}`);
  }

  /** Sends through WhatsApp only. */
  async sendWhatsApp(
    options: Omit<SendSMSOptions, "provider">
  ): Promise<SMSResponse & { verificationCode?: string }> {
    return this.sendSMS({ ...options, provider: "whatsapp" });
  }

  /** Sends through Telegram only. */
  async sendTelegram(
    options: Omit<SendSMSOptions, "provider">
  ): Promise<SMSResponse & { verificationCode?: string }> {
    return this.sendSMS({ ...options, provider: "telegram" });
  }

  /** Sends a custom text message. */
  async sendCustomMessage(options: {
    phoneNumber: string;
    customMessage: string;
    senderId?: string;
    deliveryReport?: DeliveryReport;
  }): Promise<SMSResponse> {
    return this.sendSMS({ ...options, smsType: "custom" });
  }

  /** Sends an approved template from your own WhatsApp Business account. */
  async sendWhatsAppTemplate(
    options: SendWhatsAppTemplateOptions
  ): Promise<SMSResponse> {
    return this.sendSMS({ ...options, smsType: "whatsapp-template" });
  }

  /** Delivery status of a message, including the outcome of each channel in its route. */
  async trackSMS(smsId: string): Promise<SMSTrackingResponse> {
    return this.request<SMSTrackingResponse>(
      `/sms/track/${encodeURIComponent(smsId)}`
    );
  }

  /** Alias for trackSMS. */
  async getSMSStatus(smsId: string): Promise<SMSTrackingResponse> {
    return this.trackSMS(smsId);
  }

  // -------------------------------------------------------------------------
  // Delivery report exports
  // -------------------------------------------------------------------------

  /**
   * Generates a CSV export of messages in a date range.
   * Download it from `downloadUrl`. Exports are kept for 30 days.
   */
  async generateReport(
    options: GenerateReportOptions
  ): Promise<GenerateReportResponse> {
    return this.request<GenerateReportResponse>("/reports/generate", {
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
  async listReports(
    options: ListReportsOptions = {}
  ): Promise<DeliveryReportFile[]> {
    const status = Array.isArray(options.status)
      ? options.status.join(",")
      : options.status;

    return this.request<DeliveryReportFile[]>("/reports", {
      query: { limit: options.limit, status: status || undefined },
    });
  }

  // -------------------------------------------------------------------------
  // WhatsApp
  // -------------------------------------------------------------------------

  /** Connected Meta businesses, WhatsApp Business accounts, phone numbers and templates. */
  async getWhatsAppResources(
    options: { includeTemplateComponents?: boolean } = {}
  ): Promise<WhatsAppResourcesResponse> {
    return this.request<WhatsAppResourcesResponse>("/whatsapp/resources", {
      query: { includeTemplateComponents: options.includeTemplateComponents },
    });
  }

  /** Creates a campaign without recipients. Add them with addCampaignRecipients. */
  async createCampaign(
    options: CreateCampaignOptions
  ): Promise<CampaignResponse> {
    return this.request<CampaignResponse>("/whatsapp/campaigns", {
      method: "POST",
      body: {
        ...options,
        scheduledFor:
          options.scheduledFor !== undefined
            ? toISOString(options.scheduledFor)
            : undefined,
      },
    });
  }

  /** Campaigns, newest first. */
  async listCampaigns(
    options: ListCampaignsOptions = {}
  ): Promise<CampaignListResponse> {
    return this.request<CampaignListResponse>("/whatsapp/campaigns", {
      query: {
        status: options.status,
        page: options.page,
        limit: options.limit,
      },
    });
  }

  /** A campaign with a page of its recipients and their delivery status. */
  async getCampaign(
    id: string,
    options: GetCampaignOptions = {}
  ): Promise<CampaignDetailResponse> {
    return this.request<CampaignDetailResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}`,
      {
        query: {
          page: options.page,
          limit: options.limit,
          status: options.status,
          phoneNumber: options.phoneNumber,
        },
      }
    );
  }

  /** Updates a campaign that is still a draft or scheduled. */
  async updateCampaign(
    id: string,
    options: UpdateCampaignOptions
  ): Promise<CampaignResponse> {
    return this.request<CampaignResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: {
          ...options,
          scheduledFor:
            options.scheduledFor instanceof Date
              ? options.scheduledFor.toISOString()
              : options.scheduledFor,
        },
      }
    );
  }

  /** Deletes a campaign that is still a draft or scheduled. */
  async deleteCampaign(id: string): Promise<DeleteCampaignResponse> {
    return this.request<DeleteCampaignResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  }

  /**
   * Appends recipients to a draft or scheduled campaign.
   * Numbers already on the campaign are skipped. A campaign holds at most 1000 recipients.
   */
  async addCampaignRecipients(
    id: string,
    recipients: CampaignRecipientInput[]
  ): Promise<CampaignResponse> {
    return this.request<CampaignResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}/recipients`,
      { method: "POST", body: { recipients } }
    );
  }

  /** Reserves credit and starts sending. The campaign needs at least one recipient. */
  async startCampaign(id: string): Promise<CampaignResponse> {
    return this.request<CampaignResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}/start`,
      { method: "POST" }
    );
  }

  /**
   * Sends the campaign's template to a few test recipients right away.
   * This creates a separate sample campaign and leaves the original unchanged.
   */
  async sendCampaignSample(
    id: string,
    recipients: CampaignRecipientInput[]
  ): Promise<CampaignResponse> {
    return this.request<CampaignResponse>(
      `/whatsapp/campaigns/${encodeURIComponent(id)}/sample`,
      { method: "POST", body: { recipients } }
    );
  }

  /**
   * Describes the template variables each recipient must supply.
   * Pass either a template ID or a campaign ID.
   */
  async getCampaignRecipientSchema(
    target: { templateId: string } | { campaignId: string }
  ): Promise<RecipientSchemaResponse> {
    const query =
      "templateId" in target
        ? { templateId: target.templateId }
        : { _id: target.campaignId };

    return this.request<RecipientSchemaResponse>(
      "/whatsapp/campaigns/recipient-payload",
      { query }
    );
  }
}
