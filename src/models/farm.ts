import { Schema, model, models, type Model, type Types } from "mongoose";
import { DEFAULT_FARM_SETTINGS, PEN_TYPES, type PenType } from "@/types/domain";

export type FarmSettings = {
  timezone: string;
  currency: string;
  weightUnit: string;
  gestationDays: number;
  farrowingHorizonDays: number;
  maxWeightKg: number;
  maxDailyGainKg: number;
};

export type FarmDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  country: string;
  locationNote?: string;
  phone?: string;
  demoSeed: boolean;
  settings: FarmSettings;
  createdAt: Date;
  updatedAt: Date;
};

const settingsSchema = new Schema<FarmSettings>(
  {
    timezone: { type: String, default: DEFAULT_FARM_SETTINGS.timezone },
    currency: { type: String, default: DEFAULT_FARM_SETTINGS.currency },
    weightUnit: { type: String, default: DEFAULT_FARM_SETTINGS.weightUnit },
    gestationDays: { type: Number, default: DEFAULT_FARM_SETTINGS.gestationDays, min: 100, max: 130 },
    farrowingHorizonDays: { type: Number, default: DEFAULT_FARM_SETTINGS.farrowingHorizonDays, min: 1, max: 60 },
    maxWeightKg: { type: Number, default: DEFAULT_FARM_SETTINGS.maxWeightKg, min: 50, max: 1000 },
    maxDailyGainKg: { type: Number, default: DEFAULT_FARM_SETTINGS.maxDailyGainKg, min: 0.2, max: 5 },
  },
  { _id: false },
);

const farmSchema = new Schema<FarmDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, default: "Kenya" },
    locationNote: { type: String, maxlength: 300 },
    phone: { type: String },
    demoSeed: { type: Boolean, default: false },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const Farm: Model<FarmDoc> =
  (models.Farm as Model<FarmDoc> | undefined) ?? model<FarmDoc>("Farm", farmSchema);

export type BuildingDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  name: string;
  code: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const buildingSchema = new Schema<BuildingDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    notes: { type: String, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
buildingSchema.index({ farmId: 1, code: 1 }, { unique: true });

export const Building: Model<BuildingDoc> =
  (models.Building as Model<BuildingDoc> | undefined) ?? model<BuildingDoc>("Building", buildingSchema);

export type PenDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  buildingId: Types.ObjectId;
  name: string;
  code: string;
  type: PenType;
  capacity?: number | null;
  notes?: string;
  plannedFeedKgPerDay?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const penSchema = new Schema<PenDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    buildingId: { type: Schema.Types.ObjectId, ref: "Building", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
    type: { type: String, enum: PEN_TYPES, required: true },
    capacity: { type: Number, min: 0 },
    notes: { type: String, maxlength: 1000 },
    plannedFeedKgPerDay: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
penSchema.index({ farmId: 1, code: 1 }, { unique: true });
penSchema.index({ farmId: 1, buildingId: 1 });
penSchema.index({ farmId: 1, type: 1 });

export const Pen: Model<PenDoc> = (models.Pen as Model<PenDoc> | undefined) ?? model<PenDoc>("Pen", penSchema);

export type CounterDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  key: string;
  seq: number;
};

const counterSchema = new Schema<CounterDoc>({
  farmId: { type: Schema.Types.ObjectId, required: true },
  key: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});
counterSchema.index({ farmId: 1, key: 1 }, { unique: true });

export const Counter: Model<CounterDoc> =
  (models.Counter as Model<CounterDoc> | undefined) ?? model<CounterDoc>("Counter", counterSchema);
