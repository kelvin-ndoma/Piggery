import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { User } from "@/models/user";
import { PLATFORM_ROLES, PLATFORM_SUPERADMIN_EMAIL, type PlatformRole } from "@/types/domain";

export type PlatformContext = {
  userId: string;
  userName: string;
  userEmail: string;
  platformRole: PlatformRole;
  isSuperAdmin: boolean;
};

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === PLATFORM_SUPERADMIN_EMAIL;
}

export function isPlatformRole(role: string | null | undefined): role is PlatformRole {
  return Boolean(role && (PLATFORM_ROLES as readonly string[]).includes(role));
}

export const getOptionalPlatformContext = cache(async (): Promise<PlatformContext | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user || !user.isActive) return null;

  if (isSuperAdminEmail(user.email) && user.platformRole !== "SUPERADMIN") {
    user.platformRole = "SUPERADMIN";
    await user.save();
  }

  if (!isPlatformRole(user.platformRole)) return null;

  return {
    userId: String(user._id),
    userName: user.name,
    userEmail: user.email,
    platformRole: user.platformRole,
    isSuperAdmin: user.platformRole === "SUPERADMIN",
  };
});

export async function requirePlatformAdmin(): Promise<PlatformContext> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const context = await getOptionalPlatformContext();
  if (!context) redirect("/dashboard");
  return context;
}

export async function requirePlatformAdminApi(): Promise<PlatformContext> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Sign in required.", 401);
  const context = await getOptionalPlatformContext();
  if (!context) throw new AppError("FORBIDDEN", "Platform admin access required.", 403);
  return context;
}

export async function requireSuperAdminApi(): Promise<PlatformContext> {
  const context = await requirePlatformAdminApi();
  if (!context.isSuperAdmin) {
    throw new AppError("FORBIDDEN", "Only the platform superadmin can manage the admin team.", 403);
  }
  return context;
}

export async function resolvePostLoginPath(userId: string): Promise<string> {
  await connectDB();
  const user = await User.findById(userId);
  if (!user || !user.isActive) return "/login";
  if (isPlatformRole(user.platformRole) || isSuperAdminEmail(user.email)) {
    return "/platform";
  }
  const hasFarm = user.memberships.some((membership) => membership.status === "ACTIVE");
  return hasFarm ? "/dashboard" : "/no-access";
}
