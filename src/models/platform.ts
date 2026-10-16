import { Schema, model, models, type Model, type Types } from "mongoose";
import { DEFAULT_PLATFORM_SETTINGS } from "@/types/domain";

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
