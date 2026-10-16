import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatAge } from "@/lib/dates";
import { errorPayload, AppError } from "@/lib/errors";
import { can } from "@/lib/permissions";
import { pigCodeFromScan } from "@/lib/qr";
import { averageDailyGain, assertLitterCounts, assertSensibleWeight, expectedFarrowDate, feedLineCost } from "@/lib/rules";

describe("permissions", () => {
  it("keeps financial data with the owner and manager", () => {
    expect(can("OWNER", "finance:read")).toBe(true);
    expect(can("FARM_MANAGER", "finance:write")).toBe(true);
    expect(can("FARM_WORKER", "finance:read")).toBe(false);
    expect(can("VET", "finance:read")).toBe(false);
    expect(can("VIEWER", "finance:read")).toBe(false);
  });

  it("lets workers record herd events without deleting history", () => {
    expect(can("FARM_WORKER", "pigs:write")).toBe(true);
    expect(can("FARM_WORKER", "historical:backfill")).toBe(false);
    expect(can("VET", "health:write")).toBe(true);
    expect(can("VIEWER", "pigs:write")).toBe(false);
  });

  it("keeps team changes and report downloads with the owner", () => {
    expect(can("OWNER", "users:manage")).toBe(true);
    expect(can("OWNER", "reports:export")).toBe(true);
    expect(can("FARM_MANAGER", "users:manage")).toBe(false);
    expect(can("FARM_MANAGER", "reports:export")).toBe(false);
    expect(can("FARM_WORKER", "users:manage")).toBe(false);
    expect(can("FARM_WORKER", "reports:export")).toBe(false);
  });
});

describe("growth rules", () => {
  it("calculates average daily gain", () => {
    expect(averageDailyGain(40, 46, 10)).toBe(0.6);
    expect(averageDailyGain(40, 46, 0)).toBeNull();
  });

  it("rejects impossible weights", () => {
    expect(() =>
      assertSensibleWeight({
        weightKg: 80,
        date: "2026-09-10",
        dateOfBirth: "2026-06-01",
        today: "2026-09-26",
        neighbor: { date: "2026-09-08", weightKg: 40 },
        maxWeightKg: 400,
        maxDailyGainKg: 2,
        confirmUnusual: false,
      }),
    ).toThrow(AppError);
  });

  it("accepts a normal gain", () => {
    expect(() =>
      assertSensibleWeight({
        weightKg: 42,
        date: "2026-09-10",
        dateOfBirth: "2026-06-01",
        today: "2026-09-26",
        neighbor: { date: "2026-09-03", weightKg: 40 },
        maxWeightKg: 400,
        maxDailyGainKg: 2,
        confirmUnusual: false,
      }),
    ).not.toThrow();
  });
});

describe("breeding and feed", () => {
  it("adds the farm gestation length", () => {
    expect(expectedFarrowDate("2026-01-01", 114)).toBe(addDays("2026-01-01", 114));
    expect(daysBetween("2026-01-01", expectedFarrowDate("2026-01-01", 114))).toBe(114);
  });

  it("requires male and female counts to match born alive", () => {
    expect(() => assertLitterCounts({ bornAlive: 8, stillborn: 1, male: 3, female: 4 })).toThrow(/add up/);
    expect(() => assertLitterCounts({ bornAlive: 8, stillborn: 1, male: 3, female: 5 })).not.toThrow();
  });

  it("costs feed from quantity and price", () => {
    expect(feedLineCost(12.5, 80)).toBe(1000);
  });
});

describe("qr and errors", () => {
  it("reads only a pig id from a scan", () => {
    expect(pigCodeFromScan("PIG-0041")).toBe("PIG-0041");
    expect(pigCodeFromScan("https://farm.example/pigs/PIG-0041")).toBe("PIG-0041");
    expect(pigCodeFromScan("weight:42;price:9000")).toBeNull();
  });

  it("does not expose database internals", () => {
    const payload = errorPayload(new Error("E11000 duplicate key"));
    expect(payload.body.success).toBe(false);
    expect(payload.body.error.message).not.toMatch(/E11000|Mongo/);
    expect(formatAge("2026-09-20", "2026-09-26")).toBe("6 days");
    const asOf = "2026-09-25";
    const today = "2026-09-27";
    const dob = (months: number) => addDays(asOf, -Math.round(months * 30.4375));
    expect(formatAge(dob(5), today)).toBe("5 months");
    expect(formatAge(dob(4.5), today)).toBe("4.5 months");
    expect(formatAge(dob(3), today)).toBe("3 months");
    expect(formatAge(dob(2.5), today)).toBe("2.5 months");
    expect(formatAge(dob(1.5), today)).toBe("1.5 months");
    expect(formatAge(null, today)).toBe("Not recorded");
  });
});
