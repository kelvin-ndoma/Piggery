import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  HEALTH_SEVERITY,
  HEALTH_STATUS,
  type HealthSeverity,
  type HealthStatus,
} from "@/types/domain";

const eventSchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: String,
  },
  { _id: false },
);

export type VaccineDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  name: string;
  manufacturer?: string;
  defaultIntervalDays?: number | null;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const vaccineSchema = new Schema<VaccineDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    manufacturer: { type: String, maxlength: 120 },
    defaultIntervalDays: { type: Number, min: 1, max: 3650 },
    notes: { type: String, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
vaccineSchema.index({ farmId: 1, name: 1 }, { unique: true });

export const Vaccine: Model<VaccineDoc> =
  (models.Vaccine as Model<VaccineDoc> | undefined) ?? model<VaccineDoc>("Vaccine", vaccineSchema);

export type VaccinationDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  vaccineId: Types.ObjectId;
  date: string;
  dose: string;
  batchNumber?: string;
  nextDueDate?: string | null;
  administeredById: Types.ObjectId;
  administeredByName: string;
  notes?: string;
  historical: boolean;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const vaccinationSchema = new Schema<VaccinationDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    vaccineId: { type: Schema.Types.ObjectId, ref: "Vaccine", required: true },
    date: { type: String, required: true },
    dose: { type: String, required: true, maxlength: 80 },
    batchNumber: { type: String, maxlength: 80 },
    nextDueDate: String,
    administeredById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    administeredByName: { type: String, required: true },
    notes: { type: String, maxlength: 1000 },
    historical: { type: Boolean, default: false },
    clientTransactionId: String,
  },
  { timestamps: true },
);
vaccinationSchema.index({ farmId: 1, pigId: 1, date: -1 });
vaccinationSchema.index({ farmId: 1, nextDueDate: 1 });
vaccinationSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Vaccination: Model<VaccinationDoc> =
  (models.Vaccination as Model<VaccinationDoc> | undefined) ??
  model<VaccinationDoc>("Vaccination", vaccinationSchema);

export type HealthIncidentDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  date: string;
  severity: HealthSeverity;
  status: HealthStatus;
  symptoms: string;
  notes?: string;
  statusHistory: Array<{ status: string; at: string; userId: Types.ObjectId; note?: string }>;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const incidentSchema = new Schema<HealthIncidentDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    date: { type: String, required: true },
    severity: { type: String, enum: HEALTH_SEVERITY, required: true },
    status: { type: String, enum: HEALTH_STATUS, required: true, default: "OPEN" },
    symptoms: { type: String, required: true, maxlength: 2000 },
    notes: { type: String, maxlength: 2000 },
    statusHistory: { type: [eventSchema], default: [] },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
incidentSchema.index({ farmId: 1, pigId: 1, date: -1 });
incidentSchema.index({ farmId: 1, status: 1, date: -1 });
incidentSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const HealthIncident: Model<HealthIncidentDoc> =
  (models.HealthIncident as Model<HealthIncidentDoc> | undefined) ??
  model<HealthIncidentDoc>("HealthIncident", incidentSchema);

export type TreatmentDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  incidentId?: Types.ObjectId | null;
  date: string;
  product: string;
  dose: string;
  route?: string;
  notes?: string;
  administeredById: Types.ObjectId;
  administeredByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const treatmentSchema = new Schema<TreatmentDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
    incidentId: { type: Schema.Types.ObjectId, ref: "HealthIncident" },
    date: { type: String, required: true },
    product: { type: String, required: true, maxlength: 160 },
    dose: { type: String, required: true, maxlength: 80 },
    route: { type: String, maxlength: 80 },
    notes: { type: String, maxlength: 1000 },
    administeredById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    administeredByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
treatmentSchema.index({ farmId: 1, pigId: 1, date: -1 });
treatmentSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Treatment: Model<TreatmentDoc> =
  (models.Treatment as Model<TreatmentDoc> | undefined) ?? model<TreatmentDoc>("Treatment", treatmentSchema);

export type MortalityDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  pigId: Types.ObjectId;
  date: string;
  weightKg?: number | null;
  ageDays: number;
  suspectedCause?: string;
  confirmedCause?: string;
  incidentId?: Types.ObjectId | null;
  notes?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const mortalitySchema = new Schema<MortalityDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true, unique: true },
    date: { type: String, required: true },
    weightKg: Number,
    ageDays: { type: Number, required: true, min: 0 },
    suspectedCause: { type: String, maxlength: 300 },
    confirmedCause: { type: String, maxlength: 300 },
    incidentId: { type: Schema.Types.ObjectId, ref: "HealthIncident" },
    notes: { type: String, maxlength: 2000 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
mortalitySchema.index({ farmId: 1, date: -1 });
mortalitySchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Mortality: Model<MortalityDoc> =
  (models.Mortality as Model<MortalityDoc> | undefined) ?? model<MortalityDoc>("Mortality", mortalitySchema);
