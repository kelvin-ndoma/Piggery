import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { Farm } from "@/models/farm";
import { User } from "@/models/user";
import type { Role } from "@/types/domain";

export type FarmSettingsView = {
  timezone: string;
  currency: string;
  weightUnit: string;
  gestationDays: number;
  farrowingHorizonDays: number;
  maxWeightKg: number;
  maxDailyGainKg: number;
};

export type MembershipSummary = {
  farmId: string;
  farmName: string;
  role: Role;
};

export type FarmContext = {
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  farmId: string;
  memberships: MembershipSummary[];
  farm: {
    id: string;
    name: string;
    slug: string;
    country: string;
    locationNote: string | null;
    phone: string | null;
    demoSeed: boolean;
    settings: FarmSettingsView;
  };
};

export const getOptionalFarmContext = cache(async (): Promise<FarmContext | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.isActive) return null;

  const active = user.memberships.filter((membership) => membership.status === "ACTIVE");
  if (active.length === 0) return null;

  const farms = await Farm.find({ _id: { $in: active.map((membership) => membership.farmId) } });
  const current =
    active.find((membership) => user.activeFarmId && membership.farmId.equals(user.activeFarmId)) ?? active[0];
  const farm = farms.find((item) => item._id.equals(current.farmId));
  if (!farm || !current) return null;

  if (!user.activeFarmId || !user.activeFarmId.equals(farm._id)) {
    user.activeFarmId = farm._id;
    await user.save();
  }

  return {
    userId: String(user._id),
    userName: user.name,
    userEmail: user.email,
    role: current.role,
    farmId: String(farm._id),
    memberships: active.flatMap((membership) => {
      const match = farms.find((item) => item._id.equals(membership.farmId));
      if (!match) return [];
      return [{ farmId: String(match._id), farmName: match.name, role: membership.role }];
    }),
    farm: {
      id: String(farm._id),
      name: farm.name,
      slug: farm.slug,
      country: farm.country,
      locationNote: farm.locationNote ?? null,
      phone: farm.phone ?? null,
      demoSeed: farm.demoSeed,
      settings: {
        timezone: farm.settings.timezone,
        currency: farm.settings.currency,
        weightUnit: farm.settings.weightUnit,
        gestationDays: farm.settings.gestationDays,
        farrowingHorizonDays: farm.settings.farrowingHorizonDays,
        maxWeightKg: farm.settings.maxWeightKg,
        maxDailyGainKg: farm.settings.maxDailyGainKg,
      },
    },
  };
});

export async function requireFarmContext(): Promise<FarmContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const context = await getOptionalFarmContext();
  if (!context) redirect("/no-access");
  return context;
}

export async function requireFarmContextApi(): Promise<FarmContext> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  const context = await getOptionalFarmContext();
  if (!context) throw new AppError("FORBIDDEN", "You do not have access to a farm.", 403);
  return context;
}
