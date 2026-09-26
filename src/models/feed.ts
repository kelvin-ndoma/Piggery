import { Schema, model, models, type Model, type Types } from "mongoose";
import { FEED_CATEGORIES, FEED_KINDS, type FeedCategory, type FeedKind } from "@/types/domain";

export type FeedTypeDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  name: string;
  category: FeedCategory;
  costPerKg: number;
  reorderLevelKg: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

const feedTypeSchema = new Schema<FeedTypeDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: FEED_CATEGORIES, required: true },
    costPerKg: { type: Number, required: true, min: 0, default: 0 },
    reorderLevelKg: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);
feedTypeSchema.index({ farmId: 1, name: 1 }, { unique: true });

export const FeedType: Model<FeedTypeDoc> =
  (models.FeedType as Model<FeedTypeDoc> | undefined) ?? model<FeedTypeDoc>("FeedType", feedTypeSchema);

export type FeedInventoryDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  feedTypeId: Types.ObjectId;
  quantityKg: number;
  updatedAt: Date;
  createdAt: Date;
};

const inventorySchema = new Schema<FeedInventoryDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    feedTypeId: { type: Schema.Types.ObjectId, ref: "FeedType", required: true },
    quantityKg: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
inventorySchema.index({ farmId: 1, feedTypeId: 1 }, { unique: true });

export const FeedInventory: Model<FeedInventoryDoc> =
  (models.FeedInventory as Model<FeedInventoryDoc> | undefined) ??
  model<FeedInventoryDoc>("FeedInventory", inventorySchema);

export type FeedRecordDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  date: string;
  feedTypeId: Types.ObjectId;
  penId?: Types.ObjectId | null;
  kind: FeedKind;
  quantityKg: number;
  costPerKg: number;
  totalCost: number;
  notes?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const feedRecordSchema = new Schema<FeedRecordDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    date: { type: String, required: true },
    feedTypeId: { type: Schema.Types.ObjectId, ref: "FeedType", required: true },
    penId: { type: Schema.Types.ObjectId, ref: "Pen" },
    kind: { type: String, enum: FEED_KINDS, required: true },
    quantityKg: { type: Number, required: true },
    costPerKg: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true },
    notes: { type: String, maxlength: 500 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
feedRecordSchema.index({ farmId: 1, date: -1 });
feedRecordSchema.index({ farmId: 1, feedTypeId: 1, date: -1 });
feedRecordSchema.index({ farmId: 1, penId: 1, date: -1 });
feedRecordSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const FeedRecord: Model<FeedRecordDoc> =
  (models.FeedRecord as Model<FeedRecordDoc> | undefined) ?? model<FeedRecordDoc>("FeedRecord", feedRecordSchema);
