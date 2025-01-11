import { OTPiqConfig, SendSMSOptions, SMSResponse, ProjectInfo, SMSTrackingResponse } from "./types";
export declare class OTPiqClient {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: OTPiqConfig);
    private request;
    getProjectInfo(): Promise<ProjectInfo>;
    sendSMS(options: SendSMSOptions): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    trackSMS(smsId: string): Promise<SMSTrackingResponse>;
}
