export interface OTPiqConfig {
  apiKey: string;
  /** Override the API base URL. Defaults to https://api.otpiq.com/api */
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export type SMSChannel = "sms" | "whatsapp" | "telegram";

/**
 * Channel or fallback route used to deliver a message.
 * Routes such as "whatsapp-sms" try each channel in order until one succeeds.
 */
export type SMSProvider =
  | "auto"
  | SMSChannel
  | "whatsapp-sms"
  | "telegram-sms"
  | "whatsapp-telegram-sms";

export type SMSType = "verification" | "custom" | "whatsapp-template";

export type SMSStatus = "pending" | "sent" | "delivered" | "read" | "failed";

/** Webhook configuration attached to a single message. */
export interface DeliveryReport {
  /** HTTPS URL that receives status updates. */
  webhookUrl: string;
  /** "all" sends every status change, "final" only delivered or failed. Defaults to "all". */
  deliveryReportType?: "all" | "final";
  /** Sent back in the X-OTPIQ-Webhook-Secret header of each webhook request. */
  webhookSecret?: string;
}

/** Values for the variables of a WhatsApp template. */
export interface TemplateParameters {
  /** Body variables keyed by placeholder index, e.g. { "1": "123456" }. */
  body?: Record<string, string>;
  /** Header variables keyed by placeholder index, or imageUrl / videoUrl / documentUrl for media headers. */
  header?: Record<string, string>;
  /** Button URL variables keyed by button index, then variable index. */
  buttons?: Record<string, Record<string, string>>;
}

export interface SendSMSOptions {
  /** International format, digits only, no leading + (e.g. 9647501234567). */
  phoneNumber: string;
  smsType: SMSType;
  /** Verification messages only. Generated automatically when omitted. */
  verificationCode?: string | number;
  /** Length of the generated verification code. Defaults to 6. */
  digitCount?: number;
  /** Custom messages only. Up to 1000 characters. */
  customMessage?: string;
  /** Registered sender ID, up to 11 characters. */
  senderId?: string;
  provider?: SMSProvider;
  /** Name of an approved template on your own WhatsApp Business account. */
  templateName?: string;
  /** ID of your connected WhatsApp Business account. */
  whatsappAccountId?: string;
  /** ID of the WhatsApp phone number to send from. */
  whatsappPhoneId?: string;
  /** Variables for the WhatsApp template. */
  templateParameters?: TemplateParameters;
  deliveryReport?: DeliveryReport;
}

export interface SendWhatsAppTemplateOptions {
  phoneNumber: string;
  templateName: string;
  whatsappAccountId: string;
  whatsappPhoneId: string;
  templateParameters?: TemplateParameters;
  /** Defaults to "whatsapp". */
  provider?: SMSProvider;
  senderId?: string;
  deliveryReport?: DeliveryReport;
}

export interface SMSResponse {
  message: string;
  smsId: string;
  remainingCredit: number;
  cost: number;
  canCover: boolean;
  paymentType: "prepaid" | "postpaid";
}

export interface ChannelAttempt {
  channel: SMSChannel;
  tried: boolean;
  /** null or absent until the channel has been tried. */
  success?: boolean | null;
  error?: string | null;
  refunded?: boolean | null;
}

export interface SMSTrackingResponse {
  smsId: string;
  phoneNumber: string;
  status: SMSStatus;
  cost: number;
  /** True once no further delivery attempts will be made. */
  isFinalStatus: boolean;
  /** Last channel attempted or used. */
  lastChannel: SMSChannel;
  /** Channels in the route and the outcome of each attempt. */
  channelFlow: ChannelAttempt[];
}

/** Body of the delivery status webhook configured through `deliveryReport`. */
export interface WebhookPayload {
  smsId: string;
  deliveryReportType: "all" | "final";
  isFinal: boolean;
  channel: SMSChannel;
  status: "sent" | "delivered" | "failed";
  senderId?: string;
  /** Present when status is "failed". */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Project, sender IDs, pricing
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  projectName: string;
  /** Remaining balance in IQD. */
  credit: number;
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

export interface InternationalPricingOptions {
  /** 1 to 1,000,000. Defaults to 1. */
  page?: number;
  /** 1 to 500. Defaults to 100. */
  limit?: number;
  /** Two-letter ISO country code, e.g. "IQ". */
  countryIso?: string;
}

export interface InternationalPrice {
  continent: string;
  countryIso: string;
  countryCode: string;
  country: string;
  networkId: string;
  network: string;
  /** IQD per SMS segment. */
  price: number | null;
}

export interface InternationalPricingResponse {
  currency: string;
  page: number;
  limit: number;
  total: number;
  pages: number;
  filter?: { countryIso?: string };
  items: InternationalPrice[];
}

// ---------------------------------------------------------------------------
// Delivery report exports (CSV)
// ---------------------------------------------------------------------------

export type ReportStatus = "available" | "expired" | "deleted";

export interface GenerateReportOptions {
  /** Start of the range. A Date or an ISO 8601 string. */
  startDate: Date | string;
  /** End of the range, on or after startDate. */
  endDate: Date | string;
  /** Only include messages sent to these numbers. */
  phoneNumbers?: string[];
  /** Only include messages with these statuses. */
  statuses?: SMSStatus[];
}

export interface ListReportsOptions {
  /** 1 to 500. Defaults to 100. */
  limit?: number;
  /** Filter by one or more report statuses. */
  status?: ReportStatus | ReportStatus[];
}

/** A generated CSV export of message delivery data. Available for 30 days. */
export interface DeliveryReportFile {
  _id: string;
  reportId: string;
  project?: string;
  filename?: string;
  fileId?: string;
  /** Direct link to the CSV file. */
  downloadUrl: string;
  recordCount: number;
  dateRange: { startDate?: string; endDate?: string };
  filters?: {
    startDate?: string;
    endDate?: string;
    phoneNumbers?: string[];
    statuses?: SMSStatus[];
  };
  expiresAt?: string;
  status: ReportStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateReportResponse extends DeliveryReportFile {
  message: string;
}

// ---------------------------------------------------------------------------
// WhatsApp resources
// ---------------------------------------------------------------------------

export interface WhatsAppTemplateComponent {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface WhatsAppTemplate {
  id?: string;
  name?: string;
  category?: string;
  parameter_format?: string;
  language?: string;
  messageSendTtlSeconds?: number;
  reason?: string;
  status?: string;
  isWhatsappFlow?: boolean;
  createdAt?: string;
  /** Present when includeTemplateComponents is true. */
  components?: WhatsAppTemplateComponent[];
}

export interface WhatsAppPhoneNumber {
  id?: string;
  /** Meta phone number ID. */
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  phoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  messagingLimit?: string;
  status?: string;
  codeVerificationStatus?: string;
  isOfficialBusinessAccount?: boolean;
  nameStatus?: string;
  createdAt?: string;
}

export interface WhatsAppAccount {
  id?: string;
  /** WhatsApp Business Account (WABA) ID. */
  whatsappBusinessId?: string;
  name?: string;
  accountReviewStatus?: string;
  businessVerificationStatus?: string;
  banState?: string;
  banDate?: string;
  violationType?: string;
  phoneNumbers?: WhatsAppPhoneNumber[];
  templates?: WhatsAppTemplate[];
  createdAt?: string;
}

export interface WhatsAppBusiness {
  id?: string;
  /** Meta business ID. */
  businessId?: string;
  name?: string;
  whatsappAccounts?: WhatsAppAccount[];
  createdAt?: string;
}

export interface WhatsAppResourcesResponse {
  success: boolean;
  data: {
    project: { id: string; slug: string; name: string };
    summary: {
      businessCount: number;
      accountCount: number;
      phoneNumberCount: number;
      templateCount: number;
    };
    businesses: WhatsAppBusiness[];
  };
}

// ---------------------------------------------------------------------------
// WhatsApp campaigns
// ---------------------------------------------------------------------------

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "completed"
  | "failed";

export type CampaignCategory = "MARKETING" | "UTILITY";

/** "now" saves a draft you start yourself. "schedule" starts automatically at scheduledFor. */
export type CampaignScheduleType = "now" | "schedule";

export type CampaignRecipientStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface CreateCampaignOptions {
  /** 3 to 80 characters. */
  name: string;
  /** Template `id` from getWhatsAppResources(). */
  templateId: string;
  /** Phone number `id` from getWhatsAppResources(). Must be on the same WABA as the template. */
  phoneNumberId: string;
  scheduleType?: CampaignScheduleType;
  /** Required when scheduleType is "schedule". Must be in the future. */
  scheduledFor?: Date | string;
}

export interface UpdateCampaignOptions {
  name?: string;
  templateId?: string;
  phoneNumberId?: string;
  category?: CampaignCategory;
  scheduleType?: CampaignScheduleType;
  scheduledFor?: Date | string | null;
}

export interface ListCampaignsOptions {
  status?: CampaignStatus;
  /** Results are paginated only when both page and limit are set. */
  page?: number;
  /** 1 to 100. */
  limit?: number;
}

export interface GetCampaignOptions {
  /** Recipient page. Defaults to 1. */
  page?: number;
  /** Recipients per page, 1 to 500. Defaults to 20. */
  limit?: number;
  /** Filter recipients by delivery status. */
  status?: CampaignRecipientStatus;
  /** Partial match on recipient phone number. */
  phoneNumber?: string;
}

export interface CampaignRecipientInput {
  /** International format, digits only (e.g. 9647712345678). */
  phoneNumber: string;
  templateParameters?: TemplateParameters;
}

export interface Campaign {
  _id: string;
  /** Human-readable reference, e.g. wac_abc123. */
  campaignId?: string;
  name?: string;
  status?: CampaignStatus;
  category?: CampaignCategory;
  template?: string | Record<string, unknown>;
  phoneNumber?: string | Record<string, unknown>;
  scheduleType?: CampaignScheduleType;
  scheduledFor?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalRecipients?: number;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  /** IQD. Set once recipients are attached. */
  estimatedTotalCost?: number;
  /** IQD reserved when the campaign starts. */
  reservedAmount?: number;
  /** IQD billed after delivery reconciliation. */
  reconciledAmount?: number;
  billingStatus?: "none" | "reserved" | "reconciled";
  isSampleCampaign?: boolean;
  sampleOfCampaign?: string | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CampaignRecipient {
  _id?: string;
  phoneNumber?: string;
  status?: CampaignRecipientStatus;
  templateParameters?: TemplateParameters;
  estimatedCost?: number;
  finalCost?: number;
  billingState?: "reserved" | "finalized" | "refunded";
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  [key: string]: unknown;
}

export interface Pagination {
  total?: number;
  pages?: number;
  page?: number;
  limit?: number;
}

export interface CampaignDetail extends Campaign {
  recipients?: CampaignRecipient[];
  linkedSampleCampaigns?: Array<{
    _id?: string;
    name?: string;
    campaignId?: string;
    status?: CampaignStatus;
    totalRecipients?: number;
    createdAt?: string;
    [key: string]: unknown;
  }>;
  pagination?: Pagination;
}

export interface CampaignResponse {
  success: true;
  data: Campaign;
}

export interface CampaignListResponse {
  success: true;
  data: Campaign[];
}

export interface CampaignDetailResponse {
  success: true;
  data: CampaignDetail;
}

export interface DeleteCampaignResponse {
  success: true;
  data: Record<string, unknown>;
}

export interface RecipientSchemaField {
  key: string;
  label: string;
  required: boolean;
  example: string;
  /** Where the value goes in a recipient, e.g. "templateParameters.body.1". */
  templateParametersPath: string;
}

export interface RecipientSchemaResponse {
  success: true;
  data: {
    template: {
      id?: string;
      name?: string;
      language?: string;
      category?: CampaignCategory;
    };
    fields: RecipientSchemaField[];
    exampleRecipient: CampaignRecipientInput;
  };
}

// ---------------------------------------------------------------------------
// Raw API error bodies
// ---------------------------------------------------------------------------

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
