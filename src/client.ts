import {
  OTPiqConfig,
  SendSMSOptions,
  SMSResponse,
  ProjectInfo,
  SMSTrackingResponse,
} from "./types";
import { generateRandomCode } from "./utils";
import { OTPiqError, InsufficientCreditError, RateLimitError } from "./errors";

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
      if (response.status === 400 && "requiredCredit" in data) {
        throw new InsufficientCreditError(data.yourCredit, data.requiredCredit);
      }

      if (response.status === 429) {
        throw new RateLimitError(
          data.waitMinutes,
          data.maxRequests,
          data.timeWindowMinutes
        );
      }

      throw new OTPiqError(
        data.error || "Unknown error occurred",
        response.status,
        data
      );
    }

    return data as T;
  }

  async getProjectInfo(): Promise<ProjectInfo> {
    return this.request<ProjectInfo>("/info");
  }

  async sendSMS(
    options: SendSMSOptions
  ): Promise<SMSResponse & { verificationCode?: string }> {
    const verificationCode =
      options.verificationCode?.toString() ||
      generateRandomCode(options.digitCount);

    const response = await this.request<SMSResponse>("/sms", {
      method: "POST",
      body: JSON.stringify({
        phoneNumber: options.phoneNumber,
        smsType: options.smsType,
        verificationCode,
        provider: options.provider || "auto",
      }),
    });

    return {
      ...response,
      verificationCode,
    };
  }

  async trackSMS(smsId: string): Promise<SMSTrackingResponse> {
    return this.request<SMSTrackingResponse>(`/sms/track/${smsId}`);
  }
}
