import { spawn } from "node:child_process";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Farm, Pig, User } from "../src/models";

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
    if (!farm) throw new Error("Farm was not created.");
    const pigs = await Pig.find({ farmId: farm._id }).select("pigId status category").lean();
    const ids = new Set(pigs.map((pig) => pig.pigId));
    const count = (category: string) => pigs.filter((pig) => pig.category === category).length;
    if (pigs.length !== 68 || ids.size !== 68) throw new Error(`Expected 68 unique pigs, found ${pigs.length}.`);
    if (count("SOW") !== 6 || count("BOAR") !== 1 || count("GROWER") !== 51 || count("PIGLET") !== 10) {
      throw new Error("Stock sheet categories did not match.");
    }
    if (!ids.has("S01") || !ids.has("B01") || !ids.has("G51")) throw new Error("Expected sow, boar, and grower IDs were missing.");
    const users = await User.countDocuments({ "memberships.farmId": farm._id });
    if (users !== 5) throw new Error(`Expected 5 users, found ${users}.`);
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
