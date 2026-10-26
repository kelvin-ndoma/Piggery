import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import { addDays } from "../src/lib/dates";
import type { PigCategory, PigSex } from "../src/types/domain";
import {
  Breeding,
  Building,
  Counter,
  Expense,
  Farm,
  FarmRecommendation,
  FarmVisit,
  FeedInventory,
  FeedRecord,
  FeedType,
  HealthIncident,
  Litter,
  Mortality,
  Notification,
  Pen,
  Pig,
  PigBirth,
  PigWeight,
  Sale,
  User,
  Vaccination,
  Vaccine,
} from "../src/models";

loadEnv();

const PASSWORD = "FarmDemo123!";
const SLUG = "anthony-pig-farm";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed while NODE_ENV is production.");
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in .env before seeding.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const existing = await Farm.findOne({ slug: SLUG });
  if (existing && process.env.SEED_RESET !== "true") {
    console.log("Demo farm already exists. Set SEED_RESET=true to replace the development seed.");
    process.exit(0);
  }
  if (existing) await wipe(existing._id);

  const farm = await Farm.create({
    name: "Anthony Pig Farm",
    slug: SLUG,
    country: "Kenya",
    locationNote:
      "25 Sep 2026 stock sheet. Room count is 68: 6 sows, 1 boar, 51 growers and 10 piglets. A handwritten report said 57 pigs + 10 piglets. Expected farrowing is 23 Oct 2026, 23 piglets; the sow is not identified yet.",
    phone: "+254700000000",
    status: "ACTIVE",
    demoSeed: false,
    settings: {
      timezone: "Africa/Nairobi",
      currency: "KES",
      weightUnit: "KG",
      gestationDays: 114,
      farrowingHorizonDays: 14,
      maxWeightKg: 400,
      maxDailyGainKg: 2,
    },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await User.create({
    name: "Anthony",
    email: "anthony@test.com",
    passwordHash,
    activeFarmId: farm._id,
    isActive: true,
    memberships: [{ farmId: farm._id, role: "OWNER", status: "ACTIVE" }],
  });
  const staff = [
    { name: "Demo Manager", email: "manager@demo.piggery.test", role: "FARM_MANAGER" },
    { name: "Demo Worker", email: "worker@demo.piggery.test", role: "FARM_WORKER" },
    { name: "Demo Vet", email: "vet@demo.piggery.test", role: "VET" },
    { name: "Demo Viewer", email: "viewer@demo.piggery.test", role: "VIEWER" },
  ] as const;
  await Promise.all(
    staff.map((user) =>
      User.create({
        name: user.name,
        email: user.email,
        passwordHash,
        activeFarmId: farm._id,
        isActive: true,
        memberships: [{ farmId: farm._id, role: user.role, status: "ACTIVE" }],
      }),
    ),
  );

  const asOf = "2026-09-25";
  const olderRooms = await Building.create({
    farmId: farm._id,
    name: "Rooms 1–9",
    code: "R19",
    notes: "Rooms listed on the 25 September 2026 stock sheet.",
  });
  const newerRooms = await Building.create({
    farmId: farm._id,
    name: "Rooms A–D",
    code: "RAD",
    notes: "Newer rooms listed on the 25 September 2026 stock sheet.",
  });
  const roomPlan = [
    { code: "1", name: "Room 1", type: "FARROWING" as const, capacity: 11, feed: 6, notes: "Mother and 10 piglets. Litter details were blank.", buildingId: olderRooms._id },
    { code: "2", name: "Room 2", type: "SOW" as const, capacity: 1, feed: 3, notes: "One mother. Sow ID was blank on the sheet.", buildingId: olderRooms._id },
    { code: "3", name: "Room 3", type: "SOW" as const, capacity: 2, feed: 6, notes: "Two mothers. Both sow IDs were blank on the sheet.", buildingId: olderRooms._id },
    { code: "4", name: "Room 4", type: "MIXED" as const, capacity: 2, feed: 6, notes: "One mother and the boar. IDs were blank on the sheet.", buildingId: olderRooms._id },
    { code: "5", name: "Room 5", type: "GROWER" as const, capacity: 5, feed: 2.8, notes: "5 growers, about 4.5 months. Batch IDs were blank.", buildingId: olderRooms._id },
    { code: "6", name: "Room 6", type: "GROWER" as const, capacity: 7, feed: 1.2, notes: "7 growers, about 2.5 months. Batch IDs were blank.", buildingId: olderRooms._id },
    { code: "7", name: "Room 7", type: "GROWER" as const, capacity: 10, feed: 2.7, notes: "10 growers, about 5 months. Batch IDs were blank.", buildingId: olderRooms._id },
    { code: "8", name: "Room 8", type: "SOW" as const, capacity: 1, feed: 3, notes: "One mother. Sow ID was blank on the sheet.", buildingId: olderRooms._id },
    { code: "9", name: "Room 9", type: "GROWER" as const, capacity: 11, feed: 2.9, notes: "11 growers, about 5 months. Batch IDs were blank.", buildingId: olderRooms._id },
    { code: "A", name: "Room A", type: "GROWER" as const, capacity: 6, feed: 0.8, notes: "6 growers, about 1.5 months. Batch IDs were blank.", buildingId: newerRooms._id },
    { code: "B", name: "Room B", type: "GROWER" as const, capacity: 1, feed: 3, notes: "1 grower. Age was blank. Confirm age and weight.", buildingId: newerRooms._id },
    { code: "C", name: "Room C", type: "GROWER" as const, capacity: 6, feed: 2, notes: "6 growers, about 3 months. Batch IDs were blank.", buildingId: newerRooms._id },
    { code: "D", name: "Room D", type: "GROWER" as const, capacity: 5, feed: 2, notes: "5 growers, about 3 months. Batch IDs were blank.", buildingId: newerRooms._id },
  ];
  const pens = await Pen.create(
    roomPlan.map((room) => ({
      farmId: farm._id,
      buildingId: room.buildingId,
      name: room.name,
      code: room.code,
      type: room.type,
      capacity: room.capacity,
      plannedFeedKgPerDay: room.feed,
      notes: room.notes,
    })),
  );
  const penByCode = new Map(pens.map((pen) => [pen.code, pen]));
  const penId = (code: string) => {
    const pen = penByCode.get(code);
    if (!pen) throw new Error(`Room ${code} was not created`);
    return pen._id;
  };

  const sheetNote = "Taken from the pig farm stock sheet dated 25 September 2026. Breed was not recorded.";
  const sowRooms = [
    ["S01", "1"],
    ["S02", "2"],
    ["S03", "3"],
    ["S04", "3"],
    ["S05", "4"],
    ["S06", "8"],
  ] as const;
  const sows = new Map<string, Awaited<ReturnType<typeof pig>>>();
  for (const [pigId, room] of sowRooms) {
    sows.set(
      pigId,
      await pig({
        pigId,
        sex: "FEMALE",
        category: "SOW",
        pen: penId(room),
        notes: `${sheetNote} Mother in Room ${room}. Age and parity were blank.`,
      }),
    );
  }
  const mother = sows.get("S01");
  if (!mother) throw new Error("S01 was not created");
  await pig({
    pigId: "B01",
    sex: "MALE",
    category: "BOAR",
    pen: penId("4"),
    notes: `${sheetNote} Boar in Room 4 with one mother. Age was blank.`,
  });
  for (let index = 1; index <= 10; index += 1) {
    await pig({
      pigId: `S01-${String(index).padStart(2, "0")}`,
      sex: "UNKNOWN",
      category: "PIGLET",
      pen: penId("1"),
      motherId: mother._id,
      notes: `${sheetNote} One of 10 piglets with S01 in Room 1. Birth date, sex, birth weight and litter totals were blank.`,
    });
  }

  const batches = [
    { room: "5", count: 5, months: 4.5 },
    { room: "6", count: 7, months: 2.5 },
    { room: "7", count: 10, months: 5 },
    { room: "9", count: 11, months: 5 },
    { room: "A", count: 6, months: 1.5 },
    { room: "B", count: 1, months: null },
    { room: "C", count: 6, months: 3 },
    { room: "D", count: 5, months: 3 },
  ];
  let growerNumber = 1;
  for (const batch of batches) {
    const dob = batch.months === null ? undefined : addDays(asOf, -Math.round(batch.months * 30.4375));
    for (let index = 0; index < batch.count; index += 1) {
      const pigId = `G${String(growerNumber).padStart(2, "0")}`;
      growerNumber += 1;
      const ageNote =
        batch.months === null
          ? "Age was blank. Confirm age and weight."
          : `Age was recorded as about ${batch.months} months on 25 September 2026, so the birth date is approximate.`;
      await pig({
        pigId,
        sex: "UNKNOWN",
        category: "GROWER",
        pen: penId(batch.room),
        dob,
        notes: `${sheetNote} Grower in Room ${batch.room}. ${ageNote} Sex and weight were blank.`,
      });
    }
  }

  await Notification.create({
    farmId: farm._id,
    audience: ["OWNER", "FARM_MANAGER", "FARM_WORKER", "VET", "VIEWER"],
    type: "FARROWING",
    title: "Expected farrowing 23 October 2026",
    body: "23 piglets are expected. The sow, mating date, parity and litter size were blank on the 25 September 2026 sheet.",
    href: "/serving",
    dedupeKey: "stock-expected-farrow-2026-10-23",
    readBy: [],
  });
  await Notification.create({
    farmId: farm._id,
    audience: ["OWNER", "FARM_MANAGER"],
    type: "STOCK_COUNT",
    title: "Confirm the 25 September pig count",
    body: "The room-by-room count is 68. The handwritten report said 57 pigs + 10 piglets. Count the rooms before treating either figure as final.",
    href: "/housing",
    dedupeKey: "stock-reconcile-2026-09-25",
    readBy: [],
  });

  console.log("Loaded the 25 September 2026 stock sheet: 68 pigs.");
  console.log("Password for every demo account: FarmDemo123!");
  console.log("anthony@test.com");
  console.log("manager@demo.piggery.test");
  console.log("worker@demo.piggery.test");
  console.log("vet@demo.piggery.test");
  console.log("viewer@demo.piggery.test");

  function pig(input: {
    pigId: string;
    sex: PigSex;
    category: PigCategory;
    pen: Types.ObjectId;
    dob?: string;
    notes: string;
    motherId?: Types.ObjectId;
  }) {
    return Pig.create({
      farmId: farm._id,
      pigId: input.pigId,
      qrCode: input.pigId,
      sex: input.sex,
      breed: "Not recorded",
      dateOfBirth: input.dob,
      source: "UNKNOWN",
      category: input.category,
      status: "ACTIVE",
      currentPenId: input.pen,
      motherId: input.motherId,
      currentStats: { weightKg: null, weighedOn: null, adgKg: null, weightCount: 0 },
      notes: input.notes,
    });
  }
}

async function wipe(farmId: Types.ObjectId) {
  await Promise.all([
    User.deleteMany({ "memberships.farmId": farmId }),
    Building.deleteMany({ farmId }),
    Pen.deleteMany({ farmId }),
    Pig.deleteMany({ farmId }),
    PigWeight.deleteMany({ farmId }),
    PigBirth.deleteMany({ farmId }),
    Breeding.deleteMany({ farmId }),
    Litter.deleteMany({ farmId }),
    Vaccine.deleteMany({ farmId }),
    Vaccination.deleteMany({ farmId }),
    HealthIncident.deleteMany({ farmId }),
    Mortality.deleteMany({ farmId }),
    FeedType.deleteMany({ farmId }),
    FeedInventory.deleteMany({ farmId }),
    FeedRecord.deleteMany({ farmId }),
    FarmVisit.deleteMany({ farmId }),
    FarmRecommendation.deleteMany({ farmId }),
    Sale.deleteMany({ farmId }),
    Expense.deleteMany({ farmId }),
    Notification.deleteMany({ farmId }),
    Counter.deleteMany({ farmId }),
    Farm.deleteOne({ _id: farmId }),
  ]);
}

function loadEnv() {
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (!key || process.env[key] !== undefined) continue;
      const trimmed = raw.trim();
      const quoted =
        (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"));
      process.env[key] = quoted ? trimmed.slice(1, -1) : trimmed;
    }
  } catch {
    console.error("Create .env before seeding.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    process.exit(1);
  });
