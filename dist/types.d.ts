export interface OTPiqConfig {
    apiKey: string;
}
export type SMSProvider = "auto" | "sms" | "whatsapp" | "telegram";
export type SMSType = "verification" | "custom";
export type SMSStatus = "pending" | "sent" | "delivered" | "failed" | "expired";
export interface SendSMSOptions {
    phoneNumber: string;
    smsType: SMSType;
    verificationCode?: string | number;
    customMessage?: string;
    senderId?: string;
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
    cost: number;
    canCover: boolean;
    paymentType: "prepaid" | "postpaid";
}
export interface SMSTrackingResponse {
    status: SMSStatus;
    phoneNumber: string;
    smsId: string;
    cost: number;
}
export interface PricePerSms {
    korekTelecom: number;
    asiaCell: number;
    zainIraq: number;
    others: number;
}
export interface SenderId {
    _id: string;
    senderId: string;
    status: "accepted" | "pending" | "rejected";
    pricePerSms: PricePerSms;
}
export interface SenderIdsResponse {
    success: boolean;
    data: SenderId[];
}
export interface APIInsufficientCreditError {
    error: string;
    yourCredit: number;
    requiredCredit: number;
    canCover: boolean;
}
export interface APIRateLimitError {
    message: string;
    waitMinutes: number;
    maxRequests: number;
    timeWindowMinutes: number;
}
export interface APISpendingThresholdError {
    error: string;
    currentSpending: number;
    spendingThreshold: number;
    cost: number;
}
export interface APISenderIdError {
    error: string;
}
export interface APITrialModeError {
    error: string;
}
export interface APIValidationError {
    error: string;
}
export interface APINotFoundError {
    message: string;
}
export interface APIUnauthorizedError {
    message: string;
}
