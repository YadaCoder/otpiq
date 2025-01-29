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
}
