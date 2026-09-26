import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  EXPENSE_CATEGORIES,
  OBSERVATION_RATINGS,
  ROLES,
  TASK_PRIORITY,
  TASK_STATUS,
  type ExpenseCategory,
  type ObservationRating,
  type Role,
  type TaskPriority,
  type TaskStatus,
} from "@/types/domain";

const observationSchema = new Schema(
  {
    rating: { type: String, enum: OBSERVATION_RATINGS, required: true },
    notes: { type: String, maxlength: 2000, default: "" },
  },
  { _id: false },
);

export type FarmVisitDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  visitNumber: string;
  date: string;
  farmerName: string;
  otherContactName?: string;
  contactPhone?: string;
  populationSummary: string;
  housing: { rating: ObservationRating; notes: string };
  health: { rating: ObservationRating; notes: string };
  water: { rating: ObservationRating; notes: string };
  feeding: { rating: ObservationRating; notes: string };
  feedQuality: { rating: ObservationRating; notes: string };
  otherComments?: string;
  visitingOfficer: string;
  nextVisitDate?: string | null;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const visitSchema = new Schema<FarmVisitDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    visitNumber: { type: String, required: true },
    date: { type: String, required: true },
    farmerName: { type: String, required: true, maxlength: 160 },
    otherContactName: { type: String, maxlength: 160 },
    contactPhone: String,
    populationSummary: { type: String, required: true, maxlength: 2000 },
    housing: { type: observationSchema, required: true },
    health: { type: observationSchema, required: true },
    water: { type: observationSchema, required: true },
    feeding: { type: observationSchema, required: true },
    feedQuality: { type: observationSchema, required: true },
    otherComments: { type: String, maxlength: 2000 },
    visitingOfficer: { type: String, required: true, maxlength: 160 },
    nextVisitDate: String,
    clientTransactionId: String,
  },
  { timestamps: true },
);
visitSchema.index({ farmId: 1, visitNumber: 1 }, { unique: true });
visitSchema.index({ farmId: 1, date: -1 });
visitSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const FarmVisit: Model<FarmVisitDoc> =
  (models.FarmVisit as Model<FarmVisitDoc> | undefined) ?? model<FarmVisitDoc>("FarmVisit", visitSchema);

export type RecommendationDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  visitId: Types.ObjectId;
  text: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedUserId?: Types.ObjectId | null;
  dueDate?: string | null;
  completedOn?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const recommendationSchema = new Schema<RecommendationDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    visitId: { type: Schema.Types.ObjectId, ref: "FarmVisit", required: true },
    text: { type: String, required: true, maxlength: 2000 },
    priority: { type: String, enum: TASK_PRIORITY, required: true },
    status: { type: String, enum: TASK_STATUS, required: true, default: "OPEN" },
    assignedUserId: { type: Schema.Types.ObjectId, ref: "User" },
    dueDate: String,
    completedOn: String,
  },
  { timestamps: true },
);
recommendationSchema.index({ farmId: 1, status: 1, dueDate: 1 });
recommendationSchema.index({ farmId: 1, visitId: 1 });

export const FarmRecommendation: Model<RecommendationDoc> =
  (models.FarmRecommendation as Model<RecommendationDoc> | undefined) ??
  model<RecommendationDoc>("FarmRecommendation", recommendationSchema);

export type SaleItem = {
  pigId: Types.ObjectId;
  pigCode: string;
  weightKg?: number | null;
  price: number;
};

export type SaleDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  date: string;
  buyerName: string;
  items: SaleItem[];
  totalAmount: number;
  currency: string;
  notes?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const saleSchema = new Schema<SaleDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    date: { type: String, required: true },
    buyerName: { type: String, required: true, maxlength: 160 },
    items: {
      type: [
        new Schema<SaleItem>(
          {
            pigId: { type: Schema.Types.ObjectId, ref: "Pig", required: true },
            pigCode: { type: String, required: true },
            weightKg: Number,
            price: { type: Number, required: true, min: 0 },
          },
          { _id: false },
        ),
      ],
      required: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    notes: { type: String, maxlength: 1000 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
saleSchema.index({ farmId: 1, date: -1 });
saleSchema.index({ farmId: 1, "items.pigId": 1 });
saleSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Sale: Model<SaleDoc> = (models.Sale as Model<SaleDoc> | undefined) ?? model<SaleDoc>("Sale", saleSchema);

export type ExpenseDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  date: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  payee?: string;
  recordedById: Types.ObjectId;
  recordedByName: string;
  clientTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const expenseSchema = new Schema<ExpenseDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    date: { type: String, required: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    description: { type: String, required: true, maxlength: 500 },
    payee: { type: String, maxlength: 160 },
    recordedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    clientTransactionId: String,
  },
  { timestamps: true },
);
expenseSchema.index({ farmId: 1, date: -1 });
expenseSchema.index({ farmId: 1, category: 1, date: -1 });
expenseSchema.index(
  { farmId: 1, clientTransactionId: 1 },
  { unique: true, partialFilterExpression: { clientTransactionId: { $type: "string" } } },
);

export const Expense: Model<ExpenseDoc> =
  (models.Expense as Model<ExpenseDoc> | undefined) ?? model<ExpenseDoc>("Expense", expenseSchema);

export type NotificationDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  userId?: Types.ObjectId | null;
  audience: Role[];
  type: string;
  title: string;
  body: string;
  href?: string;
  dedupeKey: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

const notificationSchema = new Schema<NotificationDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    audience: { type: [String], enum: ROLES, default: [] },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: String,
    dedupeKey: { type: String, required: true },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true },
);
notificationSchema.index({ farmId: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ farmId: 1, createdAt: -1 });

export const Notification: Model<NotificationDoc> =
  (models.Notification as Model<NotificationDoc> | undefined) ??
  model<NotificationDoc>("Notification", notificationSchema);

export type AuditLogDoc = {
  _id: Types.ObjectId;
  farmId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId: string;
  changes?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const auditSchema = new Schema<AuditLogDoc>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    changes: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
auditSchema.index({ farmId: 1, createdAt: -1 });
auditSchema.index({ farmId: 1, entity: 1, entityId: 1 });

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc> | undefined) ?? model<AuditLogDoc>("AuditLog", auditSchema);
