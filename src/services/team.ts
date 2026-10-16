import "server-only";
import bcrypt from "bcryptjs";
import { isValidCurrency, isValidTimeZone } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { toObjectId } from "@/lib/object-id";
import type { FarmContext } from "@/lib/context";
import { Farm } from "@/models/farm";
import { User } from "@/models/user";
import type { Role } from "@/types/domain";
import { farmOid, writeAudit } from "@/services/support";

export async function listTeam(ctx: FarmContext) {
  const users = await User.find({ "memberships.farmId": farmOid(ctx) }).sort({ name: 1 }).lean();
  return users.map((user) => {
    const membership = user.memberships.find((item) => String(item.farmId) === ctx.farmId);
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: membership?.role ?? "VIEWER",
      status: membership?.status ?? "DISABLED",
      isActive: user.isActive,
    };
  });
}

export async function createTeamUser(
  ctx: FarmContext,
  input: { name: string; email: string; password: string; phone?: string; role: Role },
) {
  if (input.role === "OWNER") {
    throw new AppError("VALIDATION_ERROR", "Additional owner accounts are not created from this screen.", 400);
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    phone: input.phone,
    isActive: true,
    activeFarmId: farmOid(ctx),
    memberships: [{ farmId: farmOid(ctx), role: input.role, status: "ACTIVE" }],
  });
  await writeAudit(ctx, "user.create", "User", String(user._id), { email: user.email, role: input.role });
  return { id: String(user._id) };
}

export async function updateTeamUser(ctx: FarmContext, id: string, input: { role?: Role; isActive?: boolean }) {
  const user = await User.findOne({ _id: id, "memberships.farmId": farmOid(ctx) });
  if (!user) throw new AppError("NOT_FOUND", "That user was not found on this farm.", 404);
  const membership = user.memberships.find((item) => String(item.farmId) === ctx.farmId);
  if (!membership) throw new AppError("NOT_FOUND", "That user was not found on this farm.", 404);
  if (input.role === "OWNER" || membership.role === "OWNER") {
    throw new AppError("FORBIDDEN", "Owner membership is not changed here.", 403);
  }
  if (input.role) membership.role = input.role;
  if (input.isActive === false && String(user._id) === ctx.userId) {
    throw new AppError("VALIDATION_ERROR", "You cannot disable your own account.", 400);
  }
  if (input.isActive !== undefined) {
    user.isActive = input.isActive;
    membership.status = input.isActive ? "ACTIVE" : "DISABLED";
  }
  await user.save();
  await writeAudit(ctx, "user.update", "User", String(user._id), { role: membership.role, isActive: user.isActive });
  return { id: String(user._id) };
}

export async function removeTeamUser(ctx: FarmContext, id: string) {
  if (String(id) === ctx.userId) {
    throw new AppError("VALIDATION_ERROR", "You cannot remove your own account.", 400);
  }
  const user = await User.findOne({ _id: id, "memberships.farmId": farmOid(ctx) });
  if (!user) throw new AppError("NOT_FOUND", "That user was not found on this farm.", 404);
  const membership = user.memberships.find((item) => String(item.farmId) === ctx.farmId);
  if (!membership) throw new AppError("NOT_FOUND", "That user was not found on this farm.", 404);
  if (membership.role === "OWNER") {
    throw new AppError("FORBIDDEN", "The farm owner cannot be removed from the team.", 403);
  }
  membership.status = "DISABLED";
  user.isActive = false;
  if (user.activeFarmId && String(user.activeFarmId) === ctx.farmId) {
    user.activeFarmId = undefined;
  }
  await user.save();
  await writeAudit(ctx, "user.remove", "User", String(user._id), { email: user.email, role: membership.role });
  return { id: String(user._id) };
}

export async function changePassword(
  ctx: FarmContext,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await User.findById(ctx.userId);
  if (!user || !user.isActive) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!matches) throw new AppError("VALIDATION_ERROR", "Current password is incorrect.", 400);
  if (input.currentPassword === input.newPassword) {
    throw new AppError("VALIDATION_ERROR", "Choose a new password that is different from the current one.", 400);
  }
  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await user.save();
  await writeAudit(ctx, "user.password", "User", String(user._id), {});
  return { id: String(user._id) };
}

export async function getProfile(ctx: FarmContext) {
  const user = await User.findById(ctx.userId).lean();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: ctx.role,
    farmName: ctx.farm.name,
  };
}

export async function updateFarmSettings(
  ctx: FarmContext,
  input: {
    name: string;
    locationNote?: string;
    phone?: string;
    timezone: string;
    currency: string;
    gestationDays: number;
    farrowingHorizonDays: number;
    maxWeightKg: number;
    maxDailyGainKg: number;
  },
) {
  if (!isValidTimeZone(input.timezone)) throw new AppError("VALIDATION_ERROR", "Enter a valid timezone.", 400);
  if (!isValidCurrency(input.currency.toUpperCase())) {
    throw new AppError("VALIDATION_ERROR", "Enter a valid currency code, such as KES.", 400);
  }
  const farm = await Farm.findById(farmOid(ctx));
  if (!farm) throw new AppError("NOT_FOUND", "Farm not found.", 404);
  farm.name = input.name;
  farm.locationNote = input.locationNote;
  farm.phone = input.phone;
  farm.settings.timezone = input.timezone;
  farm.settings.currency = input.currency.toUpperCase();
  farm.settings.gestationDays = input.gestationDays;
  farm.settings.farrowingHorizonDays = input.farrowingHorizonDays;
  farm.settings.maxWeightKg = input.maxWeightKg;
  farm.settings.maxDailyGainKg = input.maxDailyGainKg;
  await farm.save();
  await writeAudit(ctx, "farm.update", "Farm", String(farm._id), { name: farm.name });
  return { name: farm.name };
}

export async function switchFarm(ctx: FarmContext, farmId: string) {
  const user = await User.findById(ctx.userId);
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  const membership = user.memberships.find((item) => String(item.farmId) === farmId && item.status === "ACTIVE");
  if (!membership) throw new AppError("FORBIDDEN", "You do not have access to that farm.", 403);
  user.activeFarmId = toObjectId(farmId, "farm");
  await user.save();
  return { farmId };
}

export async function teamOptions(ctx: FarmContext) {
  const users = await listTeam(ctx);
  return users
    .filter((user) => user.isActive && user.status === "ACTIVE")
    .map((user) => ({ value: user.id, label: user.name, description: user.role }));
}
