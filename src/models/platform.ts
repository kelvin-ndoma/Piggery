import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  BILLING_CYCLES,
  BILLING_PLANS,
  DEFAULT_PLATFORM_SETTINGS,
  INQUIRY_STATUSES,
  PAYMENT_METHODS,
  type BillingCycle,
  type BillingPlan,
  type InquiryStatus,
  type PaymentMethod,
} from "@/types/domain";

export type PlatformSettingsDoc = {
  _id: Types.ObjectId;
  key: "default";
  supportEmail: string;
  supportPhone?: string;
  defaultCountry: string;
  defaultCurrency: string;
  billingCurrency: string;
  invoiceNote?: string;
  trialDays: number;
  createdAt: Date;
  updatedAt: Date;
};

const platformSettingsSchema = new Schema<PlatformSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    supportEmail: { type: String, default: DEFAULT_PLATFORM_SETTINGS.supportEmail, trim: true },
    supportPhone: { type: String, default: "", trim: true },
    defaultCountry: { type: String, default: DEFAULT_PLATFORM_SETTINGS.defaultCountry, trim: true },
    defaultCurrency: { type: String, default: DEFAULT_PLATFORM_SETTINGS.defaultCurrency, trim: true, uppercase: true },
    billingCurrency: { type: String, default: DEFAULT_PLATFORM_SETTINGS.billingCurrency, trim: true, uppercase: true },
    invoiceNote: { type: String, default: DEFAULT_PLATFORM_SETTINGS.invoiceNote, maxlength: 1000 },
    trialDays: { type: Number, default: DEFAULT_PLATFORM_SETTINGS.trialDays, min: 0, max: 365 },
  },
  { timestamps: true },
);

export const PlatformSettings: Model<PlatformSettingsDoc> =
  (models.PlatformSettings as Model<PlatformSettingsDoc> | undefined) ??
  model<PlatformSettingsDoc>("PlatformSettings", platformSettingsSchema);

export type FarmInquiryDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  farmName: string;
  country: string;
  locationNote?: string;
  herdNote?: string;
  plan: BillingPlan;
  cycle: BillingCycle;
  message?: string;
  status: InquiryStatus;
  farmId?: Types.ObjectId | null;
  reviewNote?: string;
  reviewedByEmail?: string;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const farmInquirySchema = new Schema<FarmInquiryDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    farmName: { type: String, required: true, trim: true, maxlength: 160 },
    country: { type: String, default: "Kenya", trim: true },
    locationNote: { type: String, maxlength: 300 },
    herdNote: { type: String, maxlength: 300 },
    plan: { type: String, enum: BILLING_PLANS, required: true },
    cycle: { type: String, enum: BILLING_CYCLES, default: "MONTHLY" },
    message: { type: String, maxlength: 2000 },
    status: { type: String, enum: INQUIRY_STATUSES, default: "OPEN", index: true },
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", default: null },
    reviewNote: { type: String, maxlength: 1000, default: "" },
    reviewedByEmail: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
farmInquirySchema.index({ status: 1, createdAt: -1 });

export const FarmInquiry: Model<FarmInquiryDoc> =
  (models.FarmInquiry as Model<FarmInquiryDoc> | undefined) ??
  model<FarmInquiryDoc>("FarmInquiry", farmInquirySchema);

export type FarmPaymentDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  paidOn: string;
  note?: string;
  recordedByEmail: string;
  createdAt: Date;
  updatedAt: Date;
};

const farmPaymentSchema = new Schema<FarmPaymentDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    reference: { type: String, maxlength: 120, default: "" },
    paidOn: { type: String, required: true },
    note: { type: String, maxlength: 1000, default: "" },
    recordedByEmail: { type: String, required: true },
  },
  { timestamps: true },
);
farmPaymentSchema.index({ farmId: 1, paidOn: -1 });

export const FarmPayment: Model<FarmPaymentDoc> =
  (models.FarmPayment as Model<FarmPaymentDoc> | undefined) ??
  model<FarmPaymentDoc>("FarmPayment", farmPaymentSchema);
