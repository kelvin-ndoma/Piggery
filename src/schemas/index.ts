import { z } from "zod";
import {
  BREEDING_METHODS,
  EXPENSE_CATEGORIES,
  FEED_CATEGORIES,
  FEED_KINDS,
  HEALTH_SEVERITY,
  HEALTH_STATUS,
  MOVEMENT_REASONS,
  OBSERVATION_RATINGS,
  PEN_TYPES,
  PIG_CATEGORY,
  PIG_SEX,
  PIG_SOURCE,
  PIG_STATUS,
  ROLES,
  TASK_PRIORITY,
  TASK_STATUS,
  EXIT_TYPES,
} from "@/types/domain";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid record");

export const optionalObjectId = z
  .union([objectIdSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => value || undefined);

export const dateSchema = z.iso.date("Enter a valid date");

export const optionalDate = z
  .union([dateSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => value || undefined);

const clearableDate = z
  .union([dateSchema, z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === undefined ? undefined : value || null));

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined));

export const transactionSchema = z
  .union([z.string().min(8).max(80), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || undefined);

const positive = (label: string) => z.number().positive(`Enter ${label}`);
const nonNegative = (label: string) => z.number().min(0, `${label} cannot be negative`);

export const createPigSchema = z.object({
  pigId: z.string().trim().toUpperCase().optional().or(z.literal("")).transform((value) => value || undefined),
  earTag: optionalText(40),
  sex: z.enum(PIG_SEX),
  breed: z.string().trim().min(1, "Enter a breed").max(80),
  dateOfBirth: optionalDate,
  source: z.enum(PIG_SOURCE),
  motherId: optionalObjectId,
  fatherId: optionalObjectId,
  currentPenId: optionalObjectId,
  category: z.enum(PIG_CATEGORY),
  notes: optionalText(2000),
  acquisitionDate: optionalDate,
  acquisitionSupplier: optionalText(120),
  acquisitionPrice: z.number().min(0).optional().nullable(),
  confirmOverCapacity: z.boolean().optional(),
  clientTransactionId: transactionSchema,
});

export const updatePigSchema = z.object({
  earTag: z.string().trim().max(40).optional(),
  breed: z.string().trim().min(1).max(80).optional(),
  dateOfBirth: clearableDate,
  category: z.enum(PIG_CATEGORY).optional(),
  sex: z.enum(PIG_SEX).optional(),
  notes: z.string().trim().max(2000).optional(),
  source: z.enum(PIG_SOURCE).optional(),
  motherId: optionalObjectId,
  fatherId: optionalObjectId,
  acquisitionDate: optionalDate,
  acquisitionSupplier: optionalText(120),
  acquisitionPrice: z.number().min(0).optional().nullable(),
});

export const pigQuerySchema = z.object({
  q: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.union([z.enum(PIG_STATUS), z.literal("ALL"), z.literal("")]).optional(),
  category: z.union([z.enum(PIG_CATEGORY), z.literal("ALL"), z.literal("")]).optional(),
  sex: z.union([z.enum(PIG_SEX), z.literal("ALL"), z.literal("")]).optional(),
  penId: z.union([objectIdSchema, z.literal("")]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const weightSchema = z.object({
  date: dateSchema,
  weightKg: positive("a weight in kilograms"),
  notes: optionalText(500),
  confirmUnusual: z.boolean().optional(),
  clientTransactionId: transactionSchema,
});

export const movementSchema = z.object({
  date: dateSchema,
  toPenId: objectIdSchema,
  reason: z.enum(MOVEMENT_REASONS),
  notes: optionalText(500),
  confirmOverCapacity: z.boolean().optional(),
  clientTransactionId: transactionSchema,
});

export const exitSchema = z.object({
  date: dateSchema,
  type: z.enum(EXIT_TYPES),
  notes: optionalText(1000),
  clientTransactionId: transactionSchema,
});

export const buildingSchema = z.object({
  name: z.string().trim().min(1, "Enter a building name").max(120),
  code: z.string().trim().min(1).max(20),
  notes: optionalText(1000),
});

export const penSchema = z.object({
  buildingId: objectIdSchema,
  name: z.string().trim().min(1, "Enter a pen name").max(120),
  code: z.string().trim().min(1).max(20),
  type: z.enum(PEN_TYPES),
  capacity: z.number().int().min(0).optional().nullable(),
  notes: optionalText(1000),
});

export const activeSchema = z.object({ isActive: z.boolean() });

export const vaccineSchema = z.object({
  name: z.string().trim().min(1, "Enter the vaccine name").max(120),
  manufacturer: optionalText(120),
  defaultIntervalDays: z.number().int().min(1).max(3650).optional().nullable(),
  notes: optionalText(1000),
});

export const vaccinationSchema = z.object({
  pigId: objectIdSchema,
  vaccineId: objectIdSchema,
  date: dateSchema,
  dose: z.string().trim().min(1, "Enter the dose").max(80),
  batchNumber: optionalText(80),
  nextDueDate: optionalDate,
  notes: optionalText(1000),
  recordAsHistorical: z.boolean().optional(),
  clientTransactionId: transactionSchema,
});

export const incidentSchema = z.object({
  pigId: objectIdSchema,
  date: dateSchema,
  severity: z.enum(HEALTH_SEVERITY),
  symptoms: z.string().trim().min(1, "Describe what you observed").max(2000),
  notes: optionalText(2000),
  clientTransactionId: transactionSchema,
});

export const incidentStatusSchema = z.object({
  status: z.enum(HEALTH_STATUS),
  note: optionalText(500),
});

export const treatmentSchema = z.object({
  pigId: objectIdSchema,
  incidentId: optionalObjectId,
  date: dateSchema,
  product: z.string().trim().min(1, "Enter the product used").max(160),
  dose: z.string().trim().min(1, "Enter the dose").max(80),
  route: optionalText(80),
  notes: optionalText(1000),
  clientTransactionId: transactionSchema,
});

export const mortalitySchema = z.object({
  pigId: objectIdSchema,
  date: dateSchema,
  weightKg: z.number().positive().optional().nullable(),
  suspectedCause: optionalText(300),
  confirmedCause: optionalText(300),
  incidentId: optionalObjectId,
  notes: optionalText(2000),
  clientTransactionId: transactionSchema,
});

export const breedingSchema = z.object({
  sowId: objectIdSchema,
  boarId: optionalObjectId,
  breedingDate: dateSchema,
  method: z.enum(BREEDING_METHODS),
  notes: optionalText(2000),
  clientTransactionId: transactionSchema,
});

export const breedingStatusSchema = z.object({
  status: z.enum(["CONFIRMED_PREGNANT", "NOT_PREGNANT", "FAILED"] as const),
  date: dateSchema.optional(),
  note: optionalText(500),
});

export const litterSchema = z.object({
  motherId: objectIdSchema,
  fatherId: optionalObjectId,
  breedingId: optionalObjectId,
  birthDate: dateSchema,
  bornAlive: z.number().int().min(0),
  stillborn: z.number().int().min(0),
  male: z.number().int().min(0),
  female: z.number().int().min(0),
  notes: optionalText(2000),
  clientTransactionId: transactionSchema,
});

export const pigletSchema = z.object({
  piglets: z
    .array(
      z.object({
        sex: z.enum(PIG_SEX),
        earTag: optionalText(40),
        weightKg: z.number().positive().optional().nullable(),
      }),
    )
    .min(1, "Add at least one piglet")
    .max(30),
  penId: optionalObjectId,
  clientTransactionId: transactionSchema,
});

export const feedTypeSchema = z.object({
  name: z.string().trim().min(1, "Enter a feed name").max(120),
  category: z.enum(FEED_CATEGORIES),
  costPerKg: nonNegative("Cost"),
  reorderLevelKg: nonNegative("Reorder level"),
  notes: optionalText(500),
});

export const feedRecordSchema = z.object({
  date: dateSchema,
  feedTypeId: objectIdSchema,
  penId: optionalObjectId,
  kind: z.enum(FEED_KINDS),
  quantityKg: z.number().refine((value) => value !== 0, "Enter a quantity"),
  costPerKg: z.number().min(0).optional().nullable(),
  notes: optionalText(500),
  clientTransactionId: transactionSchema,
});

const observationSchema = z.object({
  rating: z.enum(OBSERVATION_RATINGS),
  notes: z.string().trim().max(2000).optional().or(z.literal("")).transform((value) => value ?? ""),
});

export const visitSchema = z.object({
  date: dateSchema,
  farmerName: z.string().trim().min(1, "Enter the farmer's name").max(160),
  otherContactName: optionalText(160),
  contactPhone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  populationSummary: z.string().trim().min(1, "Summarise the pigs seen").max(2000),
  housing: observationSchema,
  health: observationSchema,
  water: observationSchema,
  feeding: observationSchema,
  feedQuality: observationSchema,
  otherComments: optionalText(2000),
  visitingOfficer: z.string().trim().min(1, "Enter the visiting officer").max(160),
  nextVisitDate: optionalDate,
  recommendations: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(2000),
        priority: z.enum(TASK_PRIORITY),
        assignedUserId: optionalObjectId,
        dueDate: optionalDate,
      }),
    )
    .max(20)
    .optional(),
  clientTransactionId: transactionSchema,
});

export const recommendationUpdateSchema = z.object({
  status: z.enum(TASK_STATUS),
  assignedUserId: optionalObjectId,
  dueDate: optionalDate,
  completedOn: optionalDate,
});

export const saleSchema = z.object({
  date: dateSchema,
  buyerName: z.string().trim().min(1, "Enter the buyer").max(160),
  items: z
    .array(
      z.object({
        pigId: objectIdSchema,
        weightKg: z.number().positive().optional().nullable(),
        price: nonNegative("Price"),
      }),
    )
    .min(1, "Add at least one pig"),
  notes: optionalText(1000),
  clientTransactionId: transactionSchema,
});

export const expenseSchema = z.object({
  date: dateSchema,
  category: z.enum(EXPENSE_CATEGORIES),
  amount: nonNegative("Amount"),
  description: z.string().trim().min(1, "Describe the expense").max(500),
  payee: optionalText(160),
  clientTransactionId: transactionSchema,
});

export const farmSettingsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  locationNote: optionalText(300),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  timezone: z.string().trim().min(1),
  currency: z.string().trim().length(3),
  gestationDays: z.number().int().min(100).max(130),
  farrowingHorizonDays: z.number().int().min(1).max(60),
  maxWeightKg: z.number().min(50).max(1000),
  maxDailyGainKg: z.number().min(0.2).max(5),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({
  role: z.enum(ROLES).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Use at least 8 characters for the new password"),
    confirmPassword: z.string().min(8, "Confirm the new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export const switchFarmSchema = z.object({ farmId: objectIdSchema });

export const dateRangeSchema = z.object({
  from: z.union([dateSchema, z.literal("")]).optional(),
  to: z.union([dateSchema, z.literal("")]).optional(),
  format: z.enum(["json", "csv"]).optional(),
  pigIds: z.string().max(500).optional(),
  litterId: z.union([objectIdSchema, z.literal("")]).optional(),
  penId: z.union([objectIdSchema, z.literal("")]).optional(),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Enter your password"),
});

export const createFarmTenantSchema = z.object({
  farmName: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(80).optional().or(z.literal("")).transform((v) => v || undefined),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  locationNote: optionalText(300),
  ownerName: z.string().trim().min(1).max(120),
  ownerEmail: z.email("Enter a valid owner email"),
  ownerPassword: z.string().min(8, "Use at least 8 characters"),
  ownerPhone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const assignFarmOwnerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const farmStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "SUSPENDED"]),
});

export const farmBillingSchema = z.object({
  plan: z.enum(["FREE", "STARTER", "GROWTH", "ENTERPRISE", "CUSTOM"]),
  status: z.enum(["TRIAL", "CURRENT", "PAST_DUE", "PAUSED", "COMPED", "CANCELLED"]),
  cycle: z.enum(["MONTHLY", "YEARLY"]),
  amount: z.coerce.number().min(0).max(10_000_000),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  nextBillingOn: z.union([dateSchema, z.literal(""), z.null()]).optional().transform((v) => v || null),
  paidThroughOn: z.union([dateSchema, z.literal(""), z.null()]).optional().transform((v) => v || null),
  notes: optionalText(1000),
});

export const platformSettingsSchema = z.object({
  supportEmail: z.email("Enter a valid support email"),
  supportPhone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || ""),
  defaultCountry: z.string().trim().min(2).max(80),
  defaultCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  billingCurrency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  invoiceNote: optionalText(1000),
  trialDays: z.coerce.number().int().min(0).max(365),
});

export const createPlatformAdminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9][0-9\s-]{7,18}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  role: z.enum(["ADMIN", "SUPERADMIN"]).default("ADMIN"),
});

export const updatePlatformAdminSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["ADMIN", "SUPERADMIN"]).optional(),
});

export type CreatePigInput = z.infer<typeof createPigSchema>;
export type UpdatePigInput = z.infer<typeof updatePigSchema>;
export type WeightInput = z.infer<typeof weightSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
export type VaccinationInput = z.infer<typeof vaccinationSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
export type TreatmentInput = z.infer<typeof treatmentSchema>;
export type MortalityInput = z.infer<typeof mortalitySchema>;
export type BreedingInput = z.infer<typeof breedingSchema>;
export type LitterInput = z.infer<typeof litterSchema>;
export type PigletInput = z.infer<typeof pigletSchema>;
export type FeedRecordInput = z.infer<typeof feedRecordSchema>;
export type VisitInput = z.infer<typeof visitSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
