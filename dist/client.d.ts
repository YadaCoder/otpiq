import { OTPiqConfig, SendSMSOptions, SendWhatsAppTemplateOptions, SMSResponse, ProjectInfo, SMSTrackingResponse, SenderIdsResponse, DeliveryReport, InternationalPricingOptions, InternationalPricingResponse, GenerateReportOptions, GenerateReportResponse, ListReportsOptions, DeliveryReportFile, WhatsAppResourcesResponse, CreateCampaignOptions, UpdateCampaignOptions, ListCampaignsOptions, GetCampaignOptions, CampaignRecipientInput, CampaignResponse, CampaignListResponse, CampaignDetailResponse, DeleteCampaignResponse, RecipientSchemaResponse } from "./types";
export declare class OTPiqClient {
    private readonly apiKey;
    private readonly baseUrl;
    constructor(config: OTPiqConfig);
    private request;
    private toError;
    /** Project name and remaining credit. */
    getProjectInfo(): Promise<ProjectInfo>;
    /** Remaining credit in IQD. */
    getCredits(): Promise<number>;
    /** Sender IDs registered on the project, with their approval status and per-carrier prices. */
    getSenderIds(): Promise<SenderIdsResponse>;
    /** International SMS prices per network, in IQD per SMS segment. */
    getInternationalPricing(options?: InternationalPricingOptions): Promise<InternationalPricingResponse>;
    /**
     * Sends a verification code, a custom message, or a WhatsApp template.
     *
     * For verification messages a code is generated when none is given, and the
     * code that was sent is returned as `verificationCode`.
     */
    sendSMS(options: SendSMSOptions): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    /** Sends through WhatsApp only. */
    sendWhatsApp(options: Omit<SendSMSOptions, "provider">): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    /** Sends through Telegram only. */
    sendTelegram(options: Omit<SendSMSOptions, "provider">): Promise<SMSResponse & {
        verificationCode?: string;
    }>;
    /** Sends a custom text message. */
    sendCustomMessage(options: {
        phoneNumber: string;
        customMessage: string;
        senderId?: string;
        deliveryReport?: DeliveryReport;
    }): Promise<SMSResponse>;
    /** Sends an approved template from your own WhatsApp Business account. */
    sendWhatsAppTemplate(options: SendWhatsAppTemplateOptions): Promise<SMSResponse>;
    /** Delivery status of a message, including the outcome of each channel in its route. */
    trackSMS(smsId: string): Promise<SMSTrackingResponse>;
    /** Alias for trackSMS. */
    getSMSStatus(smsId: string): Promise<SMSTrackingResponse>;
    /**
     * Generates a CSV export of messages in a date range.
     * Download it from `downloadUrl`. Exports are kept for 30 days.
     */
    generateReport(options: GenerateReportOptions): Promise<GenerateReportResponse>;
    /** Previously generated exports, newest first. */
    listReports(options?: ListReportsOptions): Promise<DeliveryReportFile[]>;
    /** Connected Meta businesses, WhatsApp Business accounts, phone numbers and templates. */
    getWhatsAppResources(options?: {
        includeTemplateComponents?: boolean;
    }): Promise<WhatsAppResourcesResponse>;
    /** Creates a campaign without recipients. Add them with addCampaignRecipients. */
    createCampaign(options: CreateCampaignOptions): Promise<CampaignResponse>;
    /** Campaigns, newest first. */
    listCampaigns(options?: ListCampaignsOptions): Promise<CampaignListResponse>;
    /** A campaign with a page of its recipients and their delivery status. */
    getCampaign(id: string, options?: GetCampaignOptions): Promise<CampaignDetailResponse>;
    /** Updates a campaign that is still a draft or scheduled. */
    updateCampaign(id: string, options: UpdateCampaignOptions): Promise<CampaignResponse>;
    /** Deletes a campaign that is still a draft or scheduled. */
    deleteCampaign(id: string): Promise<DeleteCampaignResponse>;
    /**
     * Appends recipients to a draft or scheduled campaign.
     * Numbers already on the campaign are skipped. A campaign holds at most 1000 recipients.
     */
    addCampaignRecipients(id: string, recipients: CampaignRecipientInput[]): Promise<CampaignResponse>;
    /** Reserves credit and starts sending. The campaign needs at least one recipient. */
    startCampaign(id: string): Promise<CampaignResponse>;
    /**
     * Sends the campaign's template to a few test recipients right away.
     * This creates a separate sample campaign and leaves the original unchanged.
     */
    sendCampaignSample(id: string, recipients: CampaignRecipientInput[]): Promise<CampaignResponse>;
    /**
     * Describes the template variables each recipient must supply.
     * Pass either a template ID or a campaign ID.
     */
    getCampaignRecipientSchema(target: {
        templateId: string;
    } | {
        campaignId: string;
    }): Promise<RecipientSchemaResponse>;
}
