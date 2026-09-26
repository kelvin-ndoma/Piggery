import { AppError } from "@/lib/errors";
import type { Permission, Role } from "@/types/domain";

const ALL: Permission[] = [
  "pigs:read",
  "pigs:write",
  "weights:write",
  "housing:write",
  "health:write",
  "breeding:write",
  "feed:read",
  "feed:write",
  "visits:write",
  "finance:read",
  "finance:write",
  "users:manage",
  "farm:manage",
  "historical:backfill",
];

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(ALL),
  FARM_MANAGER: new Set(ALL.filter((permission) => permission !== "users:manage")),
  FARM_WORKER: new Set([
    "pigs:read",
    "pigs:write",
    "weights:write",
    "health:write",
    "breeding:write",
    "feed:read",
    "feed:write",
    "visits:write",
  ]),
  VET: new Set([
    "pigs:read",
    "weights:write",
    "health:write",
    "breeding:write",
    "feed:read",
    "visits:write",
    "historical:backfill",
  ]),
  VIEWER: new Set(["pigs:read", "feed:read"]),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new AppError("FORBIDDEN", "You do not have permission to do that.", 403);
  }
}
