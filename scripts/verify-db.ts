import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Farm, FeedInventory, Litter, Mortality, Pig, PigWeight, Sale, User } from "../src/models";

async function seed(uri: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["tsx", "scripts/seed.ts"], {
      env: { ...process.env, MONGODB_URI: uri, NODE_ENV: "development", SEED_RESET: "true" },
      stdio: "inherit",
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Seed exited with code ${code ?? "unknown"}`))));
  });
}

async function main() {
  const server = await MongoMemoryServer.create();
  const uri = server.getUri();
  try {
    await seed(uri);
    await mongoose.connect(uri);
    const farm = await Farm.findOne({ slug: "anthony-pig-farm" });
    if (!farm?.demoSeed) throw new Error("Demo farm was not created.");
    const pigs = await Pig.find({ farmId: farm._id }).select("pigId status").lean();
    const ids = new Set(pigs.map((pig) => pig.pigId));
    if (pigs.length !== 17 || ids.size !== 17) throw new Error(`Expected 17 unique pigs, found ${pigs.length}.`);
    const dead = pigs.find((pig) => pig.pigId === "PIG-0090");
    const sold = pigs.find((pig) => pig.pigId === "PIG-0091");
    if (dead?.status !== "DEAD" || sold?.status !== "SOLD") throw new Error("Exit statuses were not preserved.");
    const weighed = pigs.find((pig) => pig.pigId === "PIG-0021");
    const weights = await PigWeight.countDocuments({ farmId: farm._id, pigId: weighed?._id });
    if (weights !== 3) throw new Error(`Expected 3 weight records, found ${weights}.`);
    const users = await User.countDocuments({ "memberships.farmId": farm._id });
    const deaths = await Mortality.countDocuments({ farmId: farm._id });
    const sales = await Sale.countDocuments({ farmId: farm._id });
    const litters = await Litter.countDocuments({ farmId: farm._id, currentlyAlive: 8 });
    const low = await FeedInventory.findOne({ farmId: farm._id, quantityKg: 2 });
    if (users !== 5 || deaths !== 1 || sales !== 1 || litters !== 1 || !low) {
      throw new Error("Seed counts for users, mortality, sales, litters, or feed did not match.");
    }
    console.log("Database seed checks passed.");
  } finally {
    await mongoose.disconnect();
    await server.stop();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verification failed");
  process.exit(1);
});
