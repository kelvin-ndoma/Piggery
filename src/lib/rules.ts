import { addDays, daysBetween } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import type { PigStatus, Role } from "@/types/domain";
import { can } from "@/lib/permissions";

export function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function averageDailyGain(startWeight: number, endWeight: number, days: number): number | null {
  if (days <= 0) return null;
  return roundTo((endWeight - startWeight) / days, 3);
}

export function feedLineCost(quantityKg: number, costPerKg: number): number {
  return roundTo(quantityKg * costPerKg, 2);
}

export function expectedFarrowDate(breedingDate: string, gestationDays: number): string {
  return addDays(breedingDate, gestationDays);
}

type WeightCheck = {
  weightKg: number;
  date: string;
  dateOfBirth: string;
  today: string;
  neighbor: { date: string; weightKg: number } | null;
  maxWeightKg: number;
  maxDailyGainKg: number;
  confirmUnusual: boolean;
};

export function assertSensibleWeight(input: WeightCheck): void {
  if (!(input.weightKg > 0) || input.weightKg > input.maxWeightKg) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Enter a weight above 0 kg and at most ${input.maxWeightKg} kg.`,
      400,
    );
  }
  if (input.dateOfBirth && input.date < input.dateOfBirth) {
    throw new AppError("VALIDATION_ERROR", "The weight date cannot be before the pig's date of birth.", 400);
  }
  if (input.date > input.today) {
    throw new AppError("VALIDATION_ERROR", "The weight date cannot be in the future.", 400);
  }
  if (!input.neighbor) return;

  const days = Math.abs(daysBetween(input.neighbor.date, input.date));
  if (days === 0) {
    throw new AppError(
      "CONFLICT",
      "A weight is already recorded for this date. Historical weights are not overwritten.",
      409,
    );
  }

  const earlier = input.neighbor.date < input.date ? input.neighbor.weightKg : input.weightKg;
  const later = input.neighbor.date < input.date ? input.weightKg : input.neighbor.weightKg;
  const gainPerDay = (later - earlier) / days;

  if (gainPerDay > input.maxDailyGainKg && !input.confirmUnusual) {
    throw new AppError(
      "VALIDATION_ERROR",
      `This measurement implies ${gainPerDay.toFixed(2)} kg/day, above the farm limit of ${input.maxDailyGainKg} kg/day. Check the scale, or confirm the unusual measurement if you are allowed to.`,
      400,
    );
  }

  const baseline = input.neighbor.date < input.date ? input.neighbor.weightKg : input.weightKg;
  const compared = input.neighbor.date < input.date ? input.weightKg : input.neighbor.weightKg;
  if (baseline > 0 && (baseline - compared) / baseline > 0.4 && !input.confirmUnusual) {
    throw new AppError(
      "VALIDATION_ERROR",
      "This weight is more than 40% below the neighbouring record. Check the measurement before saving.",
      400,
    );
  }
}

export function assertCanMove(status: PigStatus): void {
  if (status !== "ACTIVE") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Only active pigs can be moved. Sold, dead, transferred, and culled pigs stay in the historical record.",
      400,
    );
  }
}

export function assertCanVaccinate(status: PigStatus, recordAsHistorical: boolean, role: Role): void {
  if (status === "ACTIVE") return;
  if (recordAsHistorical && can(role, "historical:backfill")) return;
  throw new AppError(
    "VALIDATION_ERROR",
    "Only active pigs can be vaccinated. A historical backfill must be confirmed by an owner, manager, or vet.",
    400,
  );
}

export function assertLitterCounts(input: {
  bornAlive: number;
  stillborn: number;
  male: number;
  female: number;
}): void {
  if (input.bornAlive < 0 || input.stillborn < 0 || input.male < 0 || input.female < 0) {
    throw new AppError("VALIDATION_ERROR", "Litter counts cannot be negative.", 400);
  }
  if (input.male + input.female !== input.bornAlive) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Male and female counts must add up to the number born alive.",
      400,
    );
  }
}

export function assertPigIdFormat(pigId: string): void {
  if (!/^PIG-[A-Z0-9]{2,16}$/.test(pigId)) {
    throw new AppError("VALIDATION_ERROR", "Pig IDs look like PIG-0041.", 400);
  }
}
