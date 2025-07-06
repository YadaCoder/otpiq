import {
  OTPiqConfig,
  SendSMSOptions,
  SMSResponse,
  ProjectInfo,
  SMSTrackingResponse,
  SenderIdsResponse,
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
  UnauthorizedError
} from "./errors";

export class OTPiqClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.otpiq.com/api";

  constructor(config: OTPiqConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new UnauthorizedError(data.message || "Unauthorized");
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        throw new NotFoundError(data.message || "Not found");
      }

      // Handle 429 Rate Limit
      if (response.status === 429) {
        throw new RateLimitError(
          data.waitMinutes,
          data.maxRequests,
          data.timeWindowMinutes
        );
      }

      // Handle 400 errors
      if (response.status === 400) {
        // Insufficient credit error
        if ("requiredCredit" in data) {
          throw new InsufficientCreditError(
            data.yourCredit, 
            data.requiredCredit,
            data.canCover
          );
        }

        // Spending threshold error
        if ("spendingThreshold" in data) {
          throw new SpendingThresholdError(
            data.currentSpending,
            data.spendingThreshold,
            data.cost
          );
        }

        // Trial mode error
        if (data.error?.includes("trial mode")) {
          throw new TrialModeError();
        }

        // Sender ID errors
        if (data.error?.includes("SenderID")) {
          throw new SenderIdError(data.error);
        }

        // Generic validation error
        throw new ValidationError(data.error || "Validation error");
      }

      throw new OTPiqError(
        data.error || data.message || "Unknown error occurred",
        response.status,
        data
      );
    }

    return data as T;
  }

  async getProjectInfo(): Promise<ProjectInfo> {
    return this.request<ProjectInfo>("/info");
  }

  async getSenderIds(): Promise<SenderIdsResponse> {
    return this.request<SenderIdsResponse>("/sender-ids");
  }

  async sendSMS(
    options: SendSMSOptions
  ): Promise<SMSResponse & { verificationCode?: string }> {
    let requestBody: Record<string, any> = {
      phoneNumber: options.phoneNumber,
      smsType: options.smsType,
      provider: options.provider || "auto",
    };

    // Handle verification type SMS
    if (options.smsType === "verification") {
      const verificationCode =
        options.verificationCode?.toString() ||
        generateRandomCode(options.digitCount);
      requestBody.verificationCode = verificationCode;

      const response = await this.request<SMSResponse>("/sms", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      return {
        ...response,
        verificationCode,
      };
    }

    // Handle custom type SMS
    if (options.smsType === "custom") {
      if (!options.customMessage) {
        throw new ValidationError("customMessage is required for custom SMS type");
      }

      if (!options.senderId) {
        throw new ValidationError("senderId is required for custom SMS type");
      }

      requestBody = {
        ...requestBody,
        customMessage: options.customMessage,
        senderId: options.senderId,
        provider: "sms", // Custom messages must use SMS provider
      };

      const response = await this.request<SMSResponse>("/sms", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      return response;
    }

    throw new OTPiqError(`Invalid smsType: ${options.smsType}`);
  }

  async trackSMS(smsId: string): Promise<SMSTrackingResponse> {
    return this.request<SMSTrackingResponse>(`/sms/track/${smsId}`);
  }

  async sendWhatsApp(
    options: Omit<SendSMSOptions, "provider">
  ): Promise<SMSResponse & { verificationCode?: string }> {
    return this.sendSMS({ ...options, provider: "whatsapp" });
  }

  async sendTelegram(
    options: Omit<SendSMSOptions, "provider">
  ): Promise<SMSResponse & { verificationCode?: string }> {
    return this.sendSMS({ ...options, provider: "telegram" });
  }

  async sendCustomMessage(
    options: {
      phoneNumber: string;
      customMessage: string;
      senderId: string;
    }
  ): Promise<SMSResponse> {
    return this.sendSMS({
      ...options,
      smsType: "custom",
    });
  }

  async getSMSStatus(smsId: string): Promise<SMSTrackingResponse> {
    return this.trackSMS(smsId);
  }

  async getCredits(): Promise<number> {
    const info = await this.getProjectInfo();
    return info.credit;
  }
}
