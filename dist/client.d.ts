import { OTPiqConfig, SendSMSOptions, SMSResponse, ProjectInfo, SMSTrackingResponse, SenderIdsResponse } from "./types";
export declare class OTPiqClient {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: OTPiqConfig);
    private request;
    getProjectInfo(): Promise<ProjectInfo>;
    getSenderIds(): Promise<SenderIdsResponse>;
    sendSMS(options: SendSMSOptions): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    trackSMS(smsId: string): Promise<SMSTrackingResponse>;
    sendWhatsApp(options: Omit<SendSMSOptions, "provider">): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    sendTelegram(options: Omit<SendSMSOptions, "provider">): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    sendCustomMessage(options: {
        phoneNumber: string;
        customMessage: string;
        senderId: string;
    }): Promise<SMSResponse>;
    getSMSStatus(smsId: string): Promise<SMSTrackingResponse>;
    getCredits(): Promise<number>;
}
