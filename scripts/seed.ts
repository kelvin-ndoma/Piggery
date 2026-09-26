import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import { addDays, monthBounds, todayInTimeZone } from "../src/lib/dates";
import type { PigCategory, PigSex, PigStatus } from "../src/types/domain";
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

  const today = todayInTimeZone("Africa/Nairobi");
  const month = monthBounds(today);
  const birthDate = month.from === today ? today : addDays(month.from, Math.min(2, Math.max(0, days(month.from, today))));
  const farm = await Farm.create({
    name: "Anthony Pig Farm",
    slug: SLUG,
    country: "Kenya",
    locationNote: "Development demo farm. Replace this with the real farm location.",
    phone: "+254700000000",
    demoSeed: true,
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
  const owner = await User.create({
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

  const farrowing = await Building.create({ farmId: farm._id, name: "Farrowing house", code: "FH" });
  const growerHouse = await Building.create({ farmId: farm._id, name: "Grower house", code: "GH" });
  const finisherHouse = await Building.create({ farmId: farm._id, name: "Finisher house", code: "NH" });
  const [farrowPen, sowPen, boarPen, growerPen, finisherPen] = await Pen.create([
    { farmId: farm._id, buildingId: farrowing._id, name: "Farrowing 1", code: "FH-01", type: "FARROWING", capacity: 2 },
    { farmId: farm._id, buildingId: farrowing._id, name: "Sow pen", code: "SOW-01", type: "SOW", capacity: 8 },
    { farmId: farm._id, buildingId: farrowing._id, name: "Boar pen", code: "BOAR-01", type: "BOAR", capacity: 2 },
    { farmId: farm._id, buildingId: growerHouse._id, name: "Grower 1", code: "GH-01", type: "GROWER", capacity: 20 },
    { farmId: farm._id, buildingId: finisherHouse._id, name: "Finisher 1", code: "NH-01", type: "FINISHER", capacity: 20 },
  ]);
  if (!farrowPen || !sowPen || !boarPen || !growerPen || !finisherPen) throw new Error("Pens were not created");

  const boar = await pig({ pigId: "PIG-0001", sex: "MALE", breed: "Duroc", category: "BOAR", pen: boarPen._id, dob: addDays(today, -500) });
  const pregnant = await pig({ pigId: "PIG-0002", sex: "FEMALE", breed: "Large White", category: "SOW", pen: sowPen._id, dob: addDays(today, -600) });
  const mother = await pig({ pigId: "PIG-0003", sex: "FEMALE", breed: "Landrace", category: "SOW", pen: farrowPen._id, dob: addDays(today, -700) });
  await pig({ pigId: "PIG-0004", sex: "FEMALE", breed: "Large White", category: "SOW", pen: sowPen._id, dob: addDays(today, -550) });
  const sick = await pig({ pigId: "PIG-0020", sex: "MALE", breed: "Large White", category: "GROWER", pen: growerPen._id, dob: addDays(today, -90) });
  const weighed = await pig({ pigId: "PIG-0021", sex: "FEMALE", breed: "Landrace", category: "GROWER", pen: growerPen._id, dob: addDays(today, -100) });
  await pig({ pigId: "PIG-0030", sex: "MALE", breed: "Duroc", category: "FINISHER", pen: finisherPen._id, dob: addDays(today, -160) });
  const dead = await pig({ pigId: "PIG-0090", sex: "MALE", breed: "Large White", category: "GROWER", pen: growerPen._id, dob: addDays(today, -80), status: "DEAD" });
  const sold = await pig({ pigId: "PIG-0091", sex: "FEMALE", breed: "Landrace", category: "FINISHER", pen: finisherPen._id, dob: addDays(today, -170), status: "SOLD" });

  const litter = await Litter.create({
    farmId: farm._id,
    litterNumber: `L-${birthDate.slice(0, 4)}-001`,
    motherId: mother._id,
    fatherId: boar._id,
    birthDate,
    bornAlive: 8,
    stillborn: 1,
    male: 4,
    female: 4,
    currentlyAlive: 8,
    notes: "Development demo litter.",
  });
  for (let index = 0; index < 8; index += 1) {
    const sex = index < 4 ? "MALE" : "FEMALE";
    const child = await pig({
      pigId: `PIG-${String(10 + index).padStart(4, "0")}`,
      sex,
      breed: "Landrace",
      category: "PIGLET",
      pen: farrowPen._id,
      dob: birthDate,
      motherId: mother._id,
      fatherId: boar._id,
      litterId: litter._id,
    });
    await PigBirth.create({ farmId: farm._id, litterId: litter._id, pigId: child._id, sex, birthWeightKg: 1.4 });
  }

  await Breeding.create({
    farmId: farm._id,
    sowId: pregnant._id,
    boarId: boar._id,
    breedingDate: addDays(today, -100),
    method: "NATURAL",
    status: "CONFIRMED_PREGNANT",
    pregnancyConfirmedOn: addDays(today, -70),
    expectedFarrowDate: addDays(today, 14),
    statusHistory: [{ status: "CONFIRMED_PREGNANT", at: addDays(today, -70), userId: owner._id, note: "Development demo record." }],
    recordedById: owner._id,
    recordedByName: owner.name,
    notes: "Development demo breeding. Not a veterinary instruction.",
  });

  const weightDates = [addDays(today, -28), addDays(today, -14), today];
  const weightValues = [32, 38, 44];
  for (let index = 0; index < weightDates.length; index += 1) {
    await PigWeight.create({
      farmId: farm._id,
      pigId: weighed._id,
      date: weightDates[index],
      weightKg: weightValues[index],
      notes: "Development demo weight.",
      recordedById: owner._id,
      recordedByName: owner.name,
    });
  }
  weighed.currentStats = { weightKg: 44, weighedOn: today, adgKg: 0.429, weightCount: 3 };
  await weighed.save();

  const vaccine = await Vaccine.create({
    farmId: farm._id,
    name: "Demo vaccine — replace with your product",
    notes: "Development demo record, not a veterinary protocol.",
    defaultIntervalDays: 30,
  });
  await Vaccination.create({
    farmId: farm._id,
    pigId: sick._id,
    vaccineId: vaccine._id,
    date: addDays(today, -32),
    dose: "Recorded dose",
    batchNumber: "DEMO-BATCH",
    nextDueDate: addDays(today, -2),
    administeredById: owner._id,
    administeredByName: owner.name,
    notes: "Development demo vaccination.",
  });
  await HealthIncident.create({
    farmId: farm._id,
    pigId: sick._id,
    date: addDays(today, -1),
    severity: "MEDIUM",
    status: "OPEN",
    symptoms: "Development demo observation — reduced appetite.",
    statusHistory: [{ status: "OPEN", at: addDays(today, -1), userId: owner._id }],
    recordedById: owner._id,
    recordedByName: owner.name,
  });
  await Mortality.create({
    farmId: farm._id,
    pigId: dead._id,
    date: addDays(today, -10),
    ageDays: 70,
    suspectedCause: "Development demo record",
    recordedById: owner._id,
    recordedByName: owner.name,
    notes: "Development demo mortality. The pig remains in the herd history.",
  });

  const growerFeed = await FeedType.create({ farmId: farm._id, name: "Demo grower feed", category: "GROWER", costPerKg: 80, reorderLevelKg: 50 });
  const starter = await FeedType.create({ farmId: farm._id, name: "Demo starter feed", category: "STARTER", costPerKg: 95, reorderLevelKg: 40 });
  await FeedInventory.create([
    { farmId: farm._id, feedTypeId: growerFeed._id, quantityKg: 2 },
    { farmId: farm._id, feedTypeId: starter._id, quantityKg: 180 },
  ]);
  await FeedRecord.create([
    { farmId: farm._id, date: addDays(today, -3), feedTypeId: growerFeed._id, kind: "PURCHASE", quantityKg: 100, costPerKg: 80, totalCost: 8000, recordedById: owner._id, recordedByName: owner.name, notes: "Development demo purchase." },
    { farmId: farm._id, date: addDays(today, -1), feedTypeId: growerFeed._id, penId: growerPen._id, kind: "CONSUMPTION", quantityKg: 80, costPerKg: 80, totalCost: 6400, recordedById: owner._id, recordedByName: owner.name, notes: "Development demo consumption." },
    { farmId: farm._id, date: today, feedTypeId: growerFeed._id, penId: growerPen._id, kind: "CONSUMPTION", quantityKg: 18, costPerKg: 80, totalCost: 1440, recordedById: owner._id, recordedByName: owner.name, notes: "Development demo consumption." },
  ]);

  await Sale.create({
    farmId: farm._id,
    date: today,
    buyerName: "Demo buyer",
    items: [{ pigId: sold._id, pigCode: sold.pigId, weightKg: 90, price: 18000 }],
    totalAmount: 18000,
    currency: "KES",
    notes: "Development demo sale.",
    recordedById: owner._id,
    recordedByName: owner.name,
  });
  await Expense.create({
    farmId: farm._id,
    date: today,
    category: "FEED",
    amount: 8000,
    currency: "KES",
    description: "Development demo feed purchase",
    recordedById: owner._id,
    recordedByName: owner.name,
  });

  const visit = await FarmVisit.create({
    farmId: farm._id,
    visitNumber: `V-${today.slice(0, 4)}-001`,
    date: today,
    farmerName: "Anthony",
    populationSummary: "Development demo visit. Counts were entered for the seed and should be replaced.",
    housing: { rating: "GOOD", notes: "Development demo observation." },
    health: { rating: "FAIR", notes: "Development demo observation." },
    water: { rating: "GOOD", notes: "Development demo observation." },
    feeding: { rating: "GOOD", notes: "Development demo observation." },
    feedQuality: { rating: "NEEDS_ATTENTION", notes: "Development demo observation." },
    visitingOfficer: "Demo officer",
    nextVisitDate: addDays(today, 14),
  });
  await FarmRecommendation.create({
    farmId: farm._id,
    visitId: visit._id,
    text: "Development demo recommendation. Replace with the officer's own note.",
    priority: "MEDIUM",
    status: "OPEN",
    assignedUserId: owner._id,
    dueDate: addDays(today, 7),
  });
  await Notification.create({
    farmId: farm._id,
    audience: ["OWNER", "FARM_MANAGER", "FARM_WORKER", "VET", "VIEWER"],
    type: "LOW_STOCK",
    title: "Demo grower feed is low",
    body: "Development demo alert.",
    href: "/feed",
    dedupeKey: "seed-low-stock",
    readBy: [],
  });
  await Counter.create({ farmId: farm._id, key: "pig", seq: 91 });

  console.log("Seeded Anthony Pig Farm as development demo data.");
  console.log("Password for every demo account: FarmDemo123!");
  console.log("anthony@test.com");
  console.log("manager@demo.piggery.test");
  console.log("worker@demo.piggery.test");
  console.log("vet@demo.piggery.test");
  console.log("viewer@demo.piggery.test");

  function pig(input: {
    pigId: string;
    sex: PigSex;
    breed: string;
    category: PigCategory;
    pen: Types.ObjectId;
    dob: string;
    status?: PigStatus;
    motherId?: Types.ObjectId;
    fatherId?: Types.ObjectId;
    litterId?: Types.ObjectId;
  }) {
    return Pig.create({
      farmId: farm._id,
      pigId: input.pigId,
      qrCode: input.pigId,
      sex: input.sex,
      breed: input.breed,
      dateOfBirth: input.dob,
      source: input.litterId ? "BORN_ON_FARM" : "PURCHASED",
      category: input.category,
      status: input.status ?? "ACTIVE",
      currentPenId: input.pen,
      motherId: input.motherId,
      fatherId: input.fatherId,
      litterId: input.litterId,
      currentStats: { weightKg: null, weighedOn: null, adgKg: null, weightCount: 0 },
      notes: "Development demo pig.",
    });
  }
}

function days(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
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
      if (key && process.env[key] === undefined) process.env[key] = raw.replace(/^"|"$/g, "");
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
