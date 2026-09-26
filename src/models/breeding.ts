import { Schema, model, models, type Model, type Types } from "mongoose";
import { BREEDING_METHODS, BREEDING_STATUS, type BreedingMethod, type BreedingStatus } from "@/types/domain";

export type StatusEvent = {
  status: string;
  at: string;
  userId: Types.ObjectId;
  note?: string;
};

const statusEventSchema = new Schema<StatusEvent>(
  {
    status: { type: String, required: true },
    at: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: String,
  },
  { _id: false },
);

export type BreedingDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  sowId: Types.ObjectId;
  boarId?: Types.ObjectId | null;
  breedingDate: string;
  method: BreedingMethod;
  status: BreedingStatus;
  pregnancyConfirmedOn?: string | null;
  expectedFarrowDate: string;
  actualFarrowDate?: string | null;
  notes?: string;
  statusHistory: StatusEvent[];
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const breedingSchema = new Schema<BreedingDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    sowId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    boarId: { type: Schema.Types.ObjectId, ref: "Pig" },
    breedingDate: { type: String, required: true },
    method: { type: String, enum: BREEDING_METHODS, required: true },
    status: { type: String, enum: BREEDING_STATUS, required: true, default: "PENDING" },
    pregnancyConfirmedOn: String,
    expectedFarrowDate: { type: String, required: true },
    actualFarrowDate: String,
    notes: { type: String, maxlength: 2000 },
    statusHistory: { type: [statusEventSchema], default: [] },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
breedingSchema.index({ farmId: 1, sowId: 1, breedingDate: -1 });
breedingSchema.index({ farmId: 1, breedingDate: -1 });
breedingSchema.index({ farmId: 1, status: 1 });
breedingSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Breeding: Model<BreedingDoc> =
  (models.Breeding as Model<BreedingDoc> | undefined) ?? model<BreedingDoc>("Breeding", breedingSchema);

export type LitterDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  litterNumber: string;
  motherId: Types.ObjectId;
  fatherId?: Types.ObjectId | null;
  breedingId?: Types.ObjectId | null;
  birthDate: string;
  bornAlive: number;
  stillborn: number;
  male: number;
  female: number;
  currentlyAlive: number;
  notes?: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const litterSchema = new Schema<LitterDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    litterNumber: { type: String, required: true, uppercase: true, trim: true },
    motherId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    fatherId: { type: Schema.Types.ObjectId, ref: "Pig" },
    breedingId: { type: Schema.Types.ObjectId, ref: "Breeding" },
    birthDate: { type: String, required: true },
    bornAlive: { type: Number, required: true, min: 0 },
    stillborn: { type: Number, required: true, min: 0 },
    male: { type: Number, required: true, min: 0 },
    female: { type: Number, required: true, min: 0 },
    currentlyAlive: { type: Number, required: true, min: 0 },
    notes: { type: String, maxlength: 2000 },
    clientTransactionId: String,
  },
  { timestamps: true },
);
litterSchema.index({ farmId: 1, litterNumber: 1 }, { unique: true });
litterSchema.index({ farmId: 1, motherId: 1, birthDate: -1 });
litterSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Litter: Model<LitterDoc> =
  (models.Litter as Model<LitterDoc> | undefined) ?? model<LitterDoc>("Litter", litterSchema);
