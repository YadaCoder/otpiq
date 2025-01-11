export interface OTPiqConfig {
    apiKey: string;
}
export type SMSProvider = "auto" | "sms" | "whatsapp";
export type SMSType = "verification";
export type SMSStatus = "pending" | "delivered" | "failed";
export interface SendSMSOptions {
    phoneNumber: string;
    verificationCode?: string | number;
    smsType: SMSType;
    provider?: SMSProvider;
    digitCount?: number;
}
export interface ProjectInfo {
    projectName: string;
    credit: number;
}
export interface SMSResponse {
    message: string;
    smsId: string;
    remainingCredit: number;
}
export interface SMSTrackingResponse {
    status: SMSStatus;
    phoneNumber: string;
    smsId: string;
    cost: number;
}
export interface APIInsufficientCreditError {
    error: string;
    yourCredit: number;
    requiredCredit: number;
}
export interface APIRateLimitError {
    message: string;
    waitMinutes: number;
    maxRequests: number;
    timeWindowMinutes: number;
}
