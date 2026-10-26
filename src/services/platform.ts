import "server-only";
import bcrypt from "bcryptjs";
import { AppError } from "@/lib/errors";
import { toObjectId } from "@/lib/object-id";
import type { PlatformContext } from "@/lib/platform";
import { isSuperAdminEmail } from "@/lib/platform";
import { addDays, todayInTimeZone } from "@/lib/dates";
import { Farm, type FarmBilling } from "@/models/farm";
import { FarmInquiry, FarmPayment, PlatformSettings } from "@/models/platform";
import { Pig } from "@/models/pig";
import { User } from "@/models/user";
import { AuditLog } from "@/models/operations";
import {
  DEFAULT_FARM_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_SUPERADMIN_EMAIL,
  type BillingCycle,
  type BillingPlan,
  type BillingStatus,
  type FarmStatus,
  type PaymentMethod,
  type PlatformRole,
} from "@/types/domain";

export type CreateFarmTenantInput = {
  farmName: string;
  country?: string;
  phone?: string;
  locationNote?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPhone?: string;
  billing?: {
    plan: BillingPlan;
    status: BillingStatus;
    cycle: BillingCycle;
    amount: number;
    currency?: string;
    notes?: string;
    nextBillingOn?: string | null;
    paidThroughOn?: string | null;
  };
};

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "farm";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await Farm.exists({ slug })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function billingView(billing?: FarmBilling | null) {
  return {
    plan: billing?.plan ?? "STARTER",
    status: (billing?.status ?? "TRIAL") as BillingStatus,
    cycle: billing?.cycle ?? "MONTHLY",
    amount: billing?.amount ?? 0,
    currency: billing?.currency ?? "KES",
    nextBillingOn: billing?.nextBillingOn ?? null,
    paidThroughOn: billing?.paidThroughOn ?? null,
    notes: billing?.notes ?? "",
  };
}

async function writePlatformAudit(
  ctx: PlatformContext,
  farmId: string | null,
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, unknown>,
) {
  if (!farmId) return;
  try {
    await AuditLog.create({
      farmId: toObjectId(farmId),
      userId: toObjectId(ctx.userId),
      action,
      entity,
      entityId,
      changes,
    });
  } catch (error) {
    console.error("Platform audit failed", action, error instanceof Error ? error.name : "error");
  }
}

export async function getPlatformOverview() {
  const [farms, users, activePigs, pausedFarms, suspendedFarms, pastDue, recentFarms, admins, openInquiries] =
    await Promise.all([
      Farm.countDocuments(),
      User.countDocuments({ isActive: true }),
      Pig.countDocuments({ status: "ACTIVE" }),
      Farm.countDocuments({ status: "PAUSED" }),
      Farm.countDocuments({ status: "SUSPENDED" }),
      Farm.countDocuments({ "billing.status": "PAST_DUE" }),
      Farm.find().sort({ createdAt: -1 }).limit(8).lean(),
      User.countDocuments({ platformRole: { $in: ["SUPERADMIN", "ADMIN"] }, isActive: true }),
      FarmInquiry.countDocuments({ status: "OPEN" }),
    ]);

  const farmIds = recentFarms.map((farm) => farm._id);
  const owners = await User.find({
    memberships: { $elemMatch: { farmId: { $in: farmIds }, role: "OWNER", status: "ACTIVE" } },
  })
    .select("name email memberships")
    .lean();

  const pigCounts = await Pig.aggregate<{ _id: unknown; count: number }>([
    { $match: { farmId: { $in: farmIds }, status: "ACTIVE" } },
    { $group: { _id: "$farmId", count: { $sum: 1 } } },
  ]);
  const pigByFarm = new Map(pigCounts.map((row) => [String(row._id), row.count]));

  return {
    stats: {
      farms,
      activeFarms: farms - pausedFarms - suspendedFarms,
      pausedFarms,
      suspendedFarms,
      pastDueBilling: pastDue,
      users,
      activePigs,
      admins,
      openInquiries,
    },
    recentFarms: recentFarms.map((farm) => {
      const owner = owners.find((user) =>
        user.memberships.some(
          (membership) =>
            String(membership.farmId) === String(farm._id) &&
            membership.role === "OWNER" &&
            membership.status === "ACTIVE",
        ),
      );
      const billing = billingView(farm.billing);
      return {
        id: String(farm._id),
        name: farm.name,
        slug: farm.slug,
        country: farm.country,
        status: (farm.status ?? "ACTIVE") as FarmStatus,
        billing,
        activePigs: pigByFarm.get(String(farm._id)) ?? 0,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        createdAt: farm.createdAt.toISOString(),
      };
    }),
  };
}

export async function listPlatformFarms() {
  const farms = await Farm.find().sort({ createdAt: -1 }).lean();
  const farmIds = farms.map((farm) => farm._id);
  const [owners, pigCounts, memberCounts] = await Promise.all([
    User.find({
      memberships: { $elemMatch: { farmId: { $in: farmIds }, role: "OWNER", status: "ACTIVE" } },
    })
      .select("name email memberships")
      .lean(),
    Pig.aggregate<{ _id: unknown; count: number }>([
      { $match: { farmId: { $in: farmIds }, status: "ACTIVE" } },
      { $group: { _id: "$farmId", count: { $sum: 1 } } },
    ]),
    User.aggregate<{ _id: unknown; count: number }>([
      { $unwind: "$memberships" },
      { $match: { "memberships.farmId": { $in: farmIds }, "memberships.status": "ACTIVE" } },
      { $group: { _id: "$memberships.farmId", count: { $sum: 1 } } },
    ]),
  ]);

  const pigByFarm = new Map(pigCounts.map((row) => [String(row._id), row.count]));
  const membersByFarm = new Map(memberCounts.map((row) => [String(row._id), row.count]));

  return farms.map((farm) => {
    const owner = owners.find((user) =>
      user.memberships.some(
        (membership) =>
          String(membership.farmId) === String(farm._id) &&
          membership.role === "OWNER" &&
          membership.status === "ACTIVE",
      ),
    );
    return {
      id: String(farm._id),
      name: farm.name,
      slug: farm.slug,
      country: farm.country,
      phone: farm.phone ?? "",
      locationNote: farm.locationNote ?? "",
      status: (farm.status ?? "ACTIVE") as FarmStatus,
      billing: billingView(farm.billing),
      demoSeed: farm.demoSeed,
      activePigs: pigByFarm.get(String(farm._id)) ?? 0,
      teamSize: membersByFarm.get(String(farm._id)) ?? 0,
      ownerName: owner?.name ?? null,
      ownerEmail: owner?.email ?? null,
      createdAt: farm.createdAt.toISOString(),
    };
  });
}

export async function listBillingFarms() {
  const [farms, payments] = await Promise.all([listPlatformFarms(), listRecentFarmPayments()]);
  return {
    summary: {
      current: farms.filter((farm) => farm.billing.status === "CURRENT").length,
      trial: farms.filter((farm) => farm.billing.status === "TRIAL").length,
      pastDue: farms.filter((farm) => farm.billing.status === "PAST_DUE").length,
      paused: farms.filter((farm) => farm.billing.status === "PAUSED" || farm.status === "PAUSED").length,
      monthlyRecurring: farms
        .filter((farm) => farm.billing.status === "CURRENT" || farm.billing.status === "PAST_DUE")
        .reduce((sum, farm) => sum + (farm.billing.cycle === "MONTHLY" ? farm.billing.amount : farm.billing.amount / 12), 0),
    },
    farms,
    payments,
  };
}

export async function getPlatformFarm(id: string) {
  const farm = await Farm.findById(toObjectId(id)).lean();
  if (!farm) throw new AppError("NOT_FOUND", "Farm tenant not found.", 404);
  const [owner, activePigs, team] = await Promise.all([
    User.findOne({
      memberships: { $elemMatch: { farmId: farm._id, role: "OWNER", status: "ACTIVE" } },
    })
      .select("name email phone isActive")
      .lean(),
    Pig.countDocuments({ farmId: farm._id, status: "ACTIVE" }),
    User.find({ "memberships.farmId": farm._id, "memberships.status": "ACTIVE" })
      .select("name email memberships isActive")
      .sort({ name: 1 })
      .lean(),
  ]);

  return {
    id: String(farm._id),
    name: farm.name,
    slug: farm.slug,
    country: farm.country,
    phone: farm.phone ?? "",
    locationNote: farm.locationNote ?? "",
    status: (farm.status ?? "ACTIVE") as FarmStatus,
    billing: billingView(farm.billing),
    payments: await listFarmPayments(String(farm._id)),
    demoSeed: farm.demoSeed,
    settings: farm.settings,
    activePigs,
    createdAt: farm.createdAt.toISOString(),
    owner: owner
      ? {
          id: String(owner._id),
          name: owner.name,
          email: owner.email,
          phone: owner.phone ?? "",
          isActive: owner.isActive,
        }
      : null,
    team: team.map((user) => {
      const membership = user.memberships.find((item) => String(item.farmId) === String(farm._id));
      return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: membership?.role ?? "VIEWER",
        isActive: user.isActive,
      };
    }),
  };
}

export async function createFarmTenant(ctx: PlatformContext, input: CreateFarmTenantInput) {
  const settings = await getPlatformSettings();
  const email = input.ownerEmail.toLowerCase().trim();
  const slug = await uniqueSlug(input.farmName);
  const farm = await Farm.create({
    name: input.farmName.trim(),
    slug,
    country: input.country?.trim() || settings.defaultCountry,
    phone: input.phone,
    locationNote: input.locationNote,
    status: "ACTIVE",
    billing: {
      plan: input.billing?.plan ?? "STARTER",
      status: input.billing?.status ?? "TRIAL",
      cycle: input.billing?.cycle ?? "MONTHLY",
      amount: input.billing?.amount ?? 0,
      currency: input.billing?.currency ?? settings.billingCurrency,
      notes: input.billing?.notes ?? "",
      nextBillingOn: input.billing?.nextBillingOn ?? null,
      paidThroughOn: input.billing?.paidThroughOn ?? null,
    },
    demoSeed: false,
    settings: {
      ...DEFAULT_FARM_SETTINGS,
      currency: settings.defaultCurrency,
    },
  });

  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(input.ownerPassword, 12);
  if (user) {
    const existing = user.memberships.find((membership) => membership.farmId.equals(farm._id));
    if (existing) {
      existing.role = "OWNER";
      existing.status = "ACTIVE";
    } else {
      user.memberships.push({ farmId: farm._id, role: "OWNER", status: "ACTIVE" });
    }
    user.isActive = true;
    user.name = input.ownerName.trim() || user.name;
    if (input.ownerPhone) user.phone = input.ownerPhone;
    user.passwordHash = passwordHash;
    user.activeFarmId = farm._id;
    await user.save();
  } else {
    user = await User.create({
      name: input.ownerName.trim(),
      email,
      passwordHash,
      phone: input.ownerPhone,
      isActive: true,
      activeFarmId: farm._id,
      memberships: [{ farmId: farm._id, role: "OWNER", status: "ACTIVE" }],
    });
  }

  await writePlatformAudit(ctx, String(farm._id), "platform.farm.create", "Farm", String(farm._id), {
    ownerEmail: email,
    by: ctx.userEmail,
  });

  return { farmId: String(farm._id), slug: farm.slug, ownerId: String(user._id) };
}

export async function setFarmStatus(ctx: PlatformContext, farmId: string, status: FarmStatus) {
  const farm = await Farm.findById(toObjectId(farmId));
  if (!farm) throw new AppError("NOT_FOUND", "Farm tenant not found.", 404);
  farm.status = status;
  await farm.save();
  await writePlatformAudit(ctx, String(farm._id), `platform.farm.status.${status.toLowerCase()}`, "Farm", String(farm._id), {
    status,
    by: ctx.userEmail,
  });
  return { id: String(farm._id), status: farm.status };
}

export async function updateFarmBilling(
  ctx: PlatformContext,
  farmId: string,
  input: {
    plan: FarmBilling["plan"];
    status: FarmBilling["status"];
    cycle: FarmBilling["cycle"];
    amount: number;
    currency: string;
    nextBillingOn?: string | null;
    paidThroughOn?: string | null;
    notes?: string;
  },
) {
  const farm = await Farm.findById(toObjectId(farmId));
  if (!farm) throw new AppError("NOT_FOUND", "Farm tenant not found.", 404);
  farm.billing = {
    plan: input.plan,
    status: input.status,
    cycle: input.cycle,
    amount: input.amount,
    currency: input.currency,
    nextBillingOn: input.nextBillingOn ?? null,
    paidThroughOn: input.paidThroughOn ?? null,
    notes: input.notes ?? "",
  };
  await farm.save();
  await writePlatformAudit(ctx, String(farm._id), "platform.farm.billing", "Farm", String(farm._id), {
    billing: farm.billing,
    by: ctx.userEmail,
  });
  return { id: String(farm._id), billing: billingView(farm.billing) };
}

export async function listFarmPayments(farmId: string) {
  const rows = await FarmPayment.find({ farmId: toObjectId(farmId) }).sort({ paidOn: -1, createdAt: -1 }).limit(50).lean();
  return rows.map((row) => ({
    id: String(row._id),
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    reference: row.reference ?? "",
    paidOn: row.paidOn,
    note: row.note ?? "",
    recordedByEmail: row.recordedByEmail,
  }));
}

export async function listRecentFarmPayments() {
  const rows = await FarmPayment.find().sort({ createdAt: -1 }).limit(20).lean();
  const farmIds = [...new Set(rows.map((row) => String(row.farmId)))];
  const farms = await Farm.find({ _id: { $in: farmIds.map((id) => toObjectId(id)) } }).select("name").lean();
  const names = new Map(farms.map((farm) => [String(farm._id), farm.name]));
  return rows.map((row) => ({
    id: String(row._id),
    farmId: String(row.farmId),
    farmName: names.get(String(row.farmId)) ?? "Farm",
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    reference: row.reference ?? "",
    paidOn: row.paidOn,
    recordedByEmail: row.recordedByEmail,
  }));
}

export async function recordFarmPayment(
  ctx: PlatformContext,
  farmId: string,
  input: {
    amount: number;
    currency: string;
    method: PaymentMethod;
    reference?: string;
    paidOn: string;
    note?: string;
  },
) {
  const farm = await Farm.findById(toObjectId(farmId));
  if (!farm) throw new AppError("NOT_FOUND", "Farm tenant not found.", 404);
  await FarmPayment.create({
    farmId: farm._id,
    amount: input.amount,
    currency: input.currency,
    method: input.method,
    reference: input.reference ?? "",
    paidOn: input.paidOn,
    note: input.note ?? "",
    recordedByEmail: ctx.userEmail,
  });
  const coverDays = farm.billing.cycle === "YEARLY" ? 365 : 30;
  const paidThroughOn = addDays(input.paidOn, coverDays);
  farm.billing.status = "CURRENT";
  farm.billing.paidThroughOn = paidThroughOn;
  farm.billing.nextBillingOn = paidThroughOn;
  if (input.amount > 0) farm.billing.amount = input.amount;
  if (input.currency) farm.billing.currency = input.currency;
  const extra = [input.method, input.reference, input.note].filter(Boolean).join(" · ");
  farm.billing.notes = extra || farm.billing.notes;
  await farm.save();
  await writePlatformAudit(ctx, String(farm._id), "platform.farm.payment", "Farm", String(farm._id), {
    amount: input.amount,
    method: input.method,
    paidOn: input.paidOn,
    by: ctx.userEmail,
  });
  return { id: String(farm._id), billing: billingView(farm.billing) };
}

export function defaultPaidOn(): string {
  return todayInTimeZone("Africa/Nairobi");
}

export async function assignFarmOwner(
  ctx: PlatformContext,
  farmId: string,
  input: { name: string; email: string; password: string; phone?: string },
) {
  const farm = await Farm.findById(toObjectId(farmId));
  if (!farm) throw new AppError("NOT_FOUND", "Farm tenant not found.", 404);
  const email = input.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const previousOwners = await User.find({
    memberships: { $elemMatch: { farmId: farm._id, role: "OWNER", status: "ACTIVE" } },
  });
  for (const previous of previousOwners) {
    if (previous.email === email) continue;
    const membership = previous.memberships.find((item) => item.farmId.equals(farm._id));
    if (membership) {
      membership.role = "FARM_MANAGER";
    }
    await previous.save();
  }

  let user = await User.findOne({ email });
  if (user) {
    const membership = user.memberships.find((item) => item.farmId.equals(farm._id));
    if (membership) {
      membership.role = "OWNER";
      membership.status = "ACTIVE";
    } else {
      user.memberships.push({ farmId: farm._id, role: "OWNER", status: "ACTIVE" });
    }
    user.name = input.name.trim() || user.name;
    user.passwordHash = passwordHash;
    user.isActive = true;
    if (input.phone) user.phone = input.phone;
    user.activeFarmId = farm._id;
    await user.save();
  } else {
    user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash,
      phone: input.phone,
      isActive: true,
      activeFarmId: farm._id,
      memberships: [{ farmId: farm._id, role: "OWNER", status: "ACTIVE" }],
    });
  }

  await writePlatformAudit(ctx, String(farm._id), "platform.farm.assign_owner", "User", String(user._id), {
    ownerEmail: email,
    by: ctx.userEmail,
  });

  return { farmId: String(farm._id), ownerId: String(user._id) };
}

export async function getPlatformSettings() {
  let doc = await PlatformSettings.findOne({ key: "default" });
  if (!doc) {
    doc = await PlatformSettings.create({ key: "default", ...DEFAULT_PLATFORM_SETTINGS });
  }
  return {
    supportEmail: doc.supportEmail,
    supportPhone: doc.supportPhone ?? "",
    defaultCountry: doc.defaultCountry,
    defaultCurrency: doc.defaultCurrency,
    billingCurrency: doc.billingCurrency,
    invoiceNote: doc.invoiceNote ?? "",
    trialDays: doc.trialDays,
  };
}

export async function updatePlatformSettings(
  ctx: PlatformContext,
  input: {
    supportEmail: string;
    supportPhone?: string;
    defaultCountry: string;
    defaultCurrency: string;
    billingCurrency: string;
    invoiceNote?: string;
    trialDays: number;
  },
) {
  const doc = await PlatformSettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        supportEmail: input.supportEmail.toLowerCase(),
        supportPhone: input.supportPhone ?? "",
        defaultCountry: input.defaultCountry,
        defaultCurrency: input.defaultCurrency,
        billingCurrency: input.billingCurrency,
        invoiceNote: input.invoiceNote ?? "",
        trialDays: input.trialDays,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return {
    supportEmail: doc.supportEmail,
    supportPhone: doc.supportPhone ?? "",
    defaultCountry: doc.defaultCountry,
    defaultCurrency: doc.defaultCurrency,
    billingCurrency: doc.billingCurrency,
    invoiceNote: doc.invoiceNote ?? "",
    trialDays: doc.trialDays,
    updatedBy: ctx.userEmail,
  };
}

export async function listPlatformAdmins() {
  const users = await User.find({
    $or: [{ platformRole: { $in: ["SUPERADMIN", "ADMIN"] } }, { email: PLATFORM_SUPERADMIN_EMAIL }],
  })
    .sort({ platformRole: -1, name: 1 })
    .lean();

  return users.map((user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: (user.platformRole ?? (isSuperAdminEmail(user.email) ? "SUPERADMIN" : "ADMIN")) as PlatformRole,
    isActive: user.isActive,
    isRoot: isSuperAdminEmail(user.email),
  }));
}

export async function createPlatformAdmin(
  ctx: PlatformContext,
  input: { name: string; email: string; password: string; phone?: string; role?: PlatformRole },
) {
  if (!ctx.isSuperAdmin) {
    throw new AppError("FORBIDDEN", "Only the platform superadmin can add admins.", 403);
  }
  const email = input.email.toLowerCase().trim();
  const role: PlatformRole = input.role === "SUPERADMIN" ? "SUPERADMIN" : "ADMIN";
  const passwordHash = await bcrypt.hash(input.password, 12);
  const name = input.name.trim();
  const existing = await User.findOne({ email });
  const userId = existing?._id;
  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: name || existing.name,
          passwordHash,
          phone: input.phone ?? existing.phone,
          isActive: true,
          platformRole: role,
        },
      },
    );
  } else {
    const created = await User.create({
      name,
      email,
      passwordHash,
      phone: input.phone,
      isActive: true,
      platformRole: role,
      memberships: [],
    });
    // Belt-and-suspenders: HMR-stale schemas have stripped platformRole before.
    await User.updateOne({ _id: created._id }, { $set: { platformRole: role, isActive: true } });
  }

  const saved = await User.findOne(userId ? { _id: userId } : { email }).lean();
  if (!saved?.platformRole) {
    throw new AppError("INTERNAL_ERROR", "Admin was created but the platform role did not save. Try again.", 500);
  }
  return { id: String(saved._id), email: saved.email, role: saved.platformRole as PlatformRole };
}

export async function updatePlatformAdmin(
  ctx: PlatformContext,
  id: string,
  input: { isActive?: boolean; role?: PlatformRole },
) {
  if (!ctx.isSuperAdmin) {
    throw new AppError("FORBIDDEN", "Only the platform superadmin can change admins.", 403);
  }
  const user = await User.findById(toObjectId(id)).lean();
  if (!user || (!user.platformRole && !isSuperAdminEmail(user.email))) {
    throw new AppError("NOT_FOUND", "Platform admin not found.", 404);
  }
  if (isSuperAdminEmail(user.email)) {
    if (input.isActive === false) {
      throw new AppError("FORBIDDEN", "The root superadmin account cannot be disabled.", 403);
    }
    if (input.role && input.role !== "SUPERADMIN") {
      throw new AppError("FORBIDDEN", "The root superadmin role cannot be changed.", 403);
    }
  }
  if (String(user._id) === ctx.userId && input.isActive === false) {
    throw new AppError("VALIDATION_ERROR", "You cannot disable your own admin account.", 400);
  }
  if (String(user._id) === ctx.userId && input.role && input.role !== "SUPERADMIN" && ctx.isSuperAdmin) {
    throw new AppError("VALIDATION_ERROR", "You cannot demote your own superadmin account.", 400);
  }

  const $set: { platformRole?: PlatformRole; isActive?: boolean } = {};
  if (input.role) $set.platformRole = input.role;
  if (input.isActive !== undefined) $set.isActive = input.isActive;
  if (Object.keys($set).length === 0) {
    return {
      id: String(user._id),
      role: (user.platformRole ?? null) as PlatformRole | null,
      isActive: user.isActive,
    };
  }

  await User.updateOne({ _id: user._id }, { $set });
  const saved = await User.findById(user._id).lean();
  if (!saved) throw new AppError("NOT_FOUND", "Platform admin not found.", 404);
  return {
    id: String(saved._id),
    role: (saved.platformRole ?? null) as PlatformRole | null,
    isActive: saved.isActive,
  };
}
