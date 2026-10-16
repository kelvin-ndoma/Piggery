import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Farm } from "../src/models/farm";
import { User } from "../src/models/user";
import { PLATFORM_SUPERADMIN_EMAIL } from "../src/types/domain";

loadEnv();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in .env before running.");
    process.exit(1);
  }
  const password = process.env.PLATFORM_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error("Set PLATFORM_ADMIN_PASSWORD (min 8 chars) in .env.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const backfill = await Farm.updateMany(
    { $or: [{ status: { $exists: false } }, { status: null }] },
    { $set: { status: "ACTIVE" } },
  );
  if (backfill.modifiedCount > 0) {
    console.log(`Backfilled status=ACTIVE on ${backfill.modifiedCount} farm(s).`);
  }
  const email = PLATFORM_SUPERADMIN_EMAIL;
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.platformRole = "SUPERADMIN";
    existing.isActive = true;
    existing.passwordHash = passwordHash;
    if (!existing.name?.trim()) existing.name = "Kelvin";
    await existing.save();
    console.log(`Updated platform SUPERADMIN: ${email}`);
  } else {
    await User.create({
      name: "Kelvin",
      email,
      passwordHash,
      isActive: true,
      platformRole: "SUPERADMIN",
      memberships: [],
    });
    console.log(`Created platform SUPERADMIN: ${email}`);
  }
  await mongoose.disconnect();
}

function loadEnv() {
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // .env optional if vars already set
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
