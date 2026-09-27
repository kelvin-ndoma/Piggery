import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  MOVEMENT_REASONS,
  PIG_CATEGORY,
  PIG_SEX,
  PIG_SOURCE,
  PIG_STATUS,
  type MovementReason,
  type PigCategory,
  type PigSex,
  type PigSource,
  type PigStatus,
} from "@/types/domain";

const transactionField = { type: String };

export type PigDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: string;
  earTag?: string;
  qrCode: string;
  sex: PigSex;
  breed: string;
  dateOfBirth?: string | null;
  source: PigSource;
  motherId?: Types.ObjectId | null;
  fatherId?: Types.ObjectId | null;
  litterId?: Types.ObjectId | null;
  currentPenId?: Types.ObjectId | null;
  category: PigCategory;
  status: PigStatus;
  acquisition?: { date?: string; supplier?: string; price?: number; notes?: string };
  currentStats: { weightKg: number | null; weighedOn: string | null; adgKg: number | null; weightCount: number };
  photo?: { publicId: string; url: string } | null;
  notes?: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const pigSchema = new Schema<PigDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: String, required: true, uppercase: true, trim: true },
    earTag: { type: String, trim: true },
    qrCode: { type: String, required: true, uppercase: true, trim: true },
    sex: { type: String, enum: PIG_SEX, required: true },
    breed: { type: String, required: true, trim: true, maxlength: 80 },
    dateOfBirth: { type: String },
    source: { type: String, enum: PIG_SOURCE, required: true },
    motherId: { type: Schema.Types.ObjectId, ref: "Pig" },
    fatherId: { type: Schema.Types.ObjectId, ref: "Pig" },
    litterId: { type: Schema.Types.ObjectId, ref: "Litter" },
    currentPenId: { type: Schema.Types.ObjectId, ref: "Pen" },
    category: { type: String, enum: PIG_CATEGORY, required: true },
    status: { type: String, enum: PIG_STATUS, required: true, default: "ACTIVE" },
    acquisition: {
      date: String,
      supplier: String,
      price: Number,
      notes: String,
    },
    currentStats: {
      weightKg: { type: Number, default: null },
      weighedOn: { type: String, default: null },
      adgKg: { type: Number, default: null },
      weightCount: { type: Number, default: 0 },
    },
    photo: { publicId: String, url: String },
    notes: { type: String, maxlength: 2000 },
    clientTransactionId: transactionField,
  },
  { timestamps: true },
);

pigSchema.index({ farmId: 1, pigId: 1 }, { unique: true });
pigSchema.index(
  { farmId: 1, earTag: 1 },
  { unique: true, partialFilterExpression: { earTag: { $type: "string", $gt: "" } } },
);
pigSchema.index({ farmId: 1, qrCode: 1 }, { unique: true });
pigSchema.index({ farmId: 1, status: 1 });
pigSchema.index({ farmId: 1, category: 1 });
pigSchema.index({ farmId: 1, currentPenId: 1 });
pigSchema.index({ farmId: 1, dateOfBirth: 1 });
pigSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Pig: Model<PigDoc> = (models.Pig as Model<PigDoc> | undefined) ?? model<PigDoc>("Pig", pigSchema);

export type PigWeightDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  date: string;
  weightKg: number;
  notes?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const weightSchema = new Schema<PigWeightDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    date: { type: String, required: true },
    weightKg: { type: Number, required: true, min: 0 },
    notes: { type: String, maxlength: 500 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: transactionField,
  },
  { timestamps: true },
);
weightSchema.index({ farmId: 1, pigId: 1, date: 1 }, { unique: true });
weightSchema.index({ farmId: 1, date: 1 });
weightSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const PigWeight: Model<PigWeightDoc> =
  (models.PigWeight as Model<PigWeightDoc> | undefined) ?? model<PigWeightDoc>("PigWeight", weightSchema);

export type PigMovementDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  fromPenId?: Types.ObjectId | null;
  toPenId?: Types.ObjectId | null;
  date: string;
  reason: MovementReason;
  notes?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const movementSchema = new Schema<PigMovementDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    fromPenId: { type: Schema.Types.ObjectId, ref: "Pen" },
    toPenId: { type: Schema.Types.ObjectId, ref: "Pen" },
    date: { type: String, required: true },
    reason: { type: String, enum: MOVEMENT_REASONS, required: true },
    notes: { type: String, maxlength: 500 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: transactionField,
  },
  { timestamps: true },
);
movementSchema.index({ farmId: 1, pigId: 1, date: -1 });
movementSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const PigMovement: Model<PigMovementDoc> =
  (models.PigMovement as Model<PigMovementDoc> | undefined) ?? model<PigMovementDoc>("PigMovement", movementSchema);

export type PigBirthDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  litterId: Types.ObjectId;
  pigId: Types.ObjectId;
  sex: PigSex;
  birthWeightKg?: number | null;
  createdAt: Date;
  updatedAt: Date;
};

const birthSchema = new Schema<PigBirthDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    litterId: { type: Schema.Types.ObjectId, ref: "Litter", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    sex: { type: String, enum: PIG_SEX, required: true },
    birthWeightKg: { type: Number },
  },
  { timestamps: true },
);
birthSchema.index({ farmId: 1, litterId: 1 });
birthSchema.index({ farmId: 1, pigId: 1 }, { unique: true });

export const PigBirth: Model<PigBirthDoc> =
  (models.PigBirth as Model<PigBirthDoc> | undefined) ?? model<PigBirthDoc>("PigBirth", birthSchema);
