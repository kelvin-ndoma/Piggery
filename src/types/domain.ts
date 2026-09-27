export const ROLES = ["OWNER", "FARM_MANAGER", "FARM_WORKER", "VET", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "pigs:read",
  "pigs:write",
  "weights:write",
  "housing:write",
  "health:write",
  "breeding:write",
  "feed:read",
  "feed:write",
  "visits:write",
  "finance:read",
  "finance:write",
  "users:manage",
  "farm:manage",
  "historical:backfill",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PIG_SEX = ["MALE", "FEMALE", "UNKNOWN"] as const;
export type PigSex = (typeof PIG_SEX)[number];

export const PIG_SOURCE = ["BORN_ON_FARM", "PURCHASED", "TRANSFERRED", "UNKNOWN"] as const;
export type PigSource = (typeof PIG_SOURCE)[number];

export const PIG_CATEGORY = ["PIGLET", "GROWER", "FINISHER", "SOW", "BOAR"] as const;
export type PigCategory = (typeof PIG_CATEGORY)[number];

export const PIG_STATUS = ["ACTIVE", "SOLD", "DEAD", "TRANSFERRED", "CULLED"] as const;
export type PigStatus = (typeof PIG_STATUS)[number];

export const PEN_TYPES = [
  "FARROWING",
  "NURSERY",
  "GROWER",
  "FINISHER",
  "SOW",
  "BOAR",
  "QUARANTINE",
  "HOSPITAL",
  "MIXED",
] as const;
export type PenType = (typeof PEN_TYPES)[number];

export const BREEDING_METHODS = ["NATURAL", "ARTIFICIAL_INSEMINATION"] as const;
export type BreedingMethod = (typeof BREEDING_METHODS)[number];

export const BREEDING_STATUS = [
  "PENDING",
  "CONFIRMED_PREGNANT",
  "NOT_PREGNANT",
  "FARROWED",
  "FAILED",
] as const;
export type BreedingStatus = (typeof BREEDING_STATUS)[number];

export const HEALTH_SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type HealthSeverity = (typeof HEALTH_SEVERITY)[number];

export const HEALTH_STATUS = ["OPEN", "UNDER_TREATMENT", "RECOVERED", "REFERRED", "CLOSED"] as const;
export type HealthStatus = (typeof HEALTH_STATUS)[number];

export const OPEN_HEALTH_STATUSES = ["OPEN", "UNDER_TREATMENT", "REFERRED"] as const;

export const FEED_CATEGORIES = [
  "STARTER",
  "GROWER",
  "FINISHER",
  "SOW",
  "LACTATION",
  "BOAR",
  "CUSTOM",
] as const;
export type FeedCategory = (typeof FEED_CATEGORIES)[number];

export const FEED_KINDS = ["PURCHASE", "CONSUMPTION", "ADJUSTMENT"] as const;
export type FeedKind = (typeof FEED_KINDS)[number];

export const OBSERVATION_RATINGS = ["GOOD", "FAIR", "NEEDS_ATTENTION"] as const;
export type ObservationRating = (typeof OBSERVATION_RATINGS)[number];

export const TASK_PRIORITY = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export const TASK_STATUS = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const EXPENSE_CATEGORIES = [
  "FEED",
  "VETERINARY",
  "LABOR",
  "EQUIPMENT",
  "UTILITIES",
  "TRANSPORT",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const MOVEMENT_REASONS = [
  "WEANING",
  "GROWTH",
  "TREATMENT",
  "QUARANTINE",
  "REGROUP",
  "OFF_FARM",
  "OTHER",
] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export const EXIT_TYPES = ["TRANSFERRED", "CULLED"] as const;
export type ExitType = (typeof EXIT_TYPES)[number];

export const DEFAULT_FARM_SETTINGS = {
  timezone: "Africa/Nairobi",
  currency: "KES",
  weightUnit: "KG",
  gestationDays: 114,
  farrowingHorizonDays: 14,
  maxWeightKg: 400,
  maxDailyGainKg: 2,
} as const;
