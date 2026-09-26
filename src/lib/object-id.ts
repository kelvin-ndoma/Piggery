import "server-only";
import { Types } from "mongoose";
import { AppError } from "@/lib/errors";

export function definedIds(values: ReadonlyArray<Types.ObjectId | string | null | undefined>): Types.ObjectId[] {
  return values.flatMap((value) => {
    if (!value) return [];
    if (value instanceof Types.ObjectId) return [value];
    if (/^[a-f\d]{24}$/i.test(value)) return [new Types.ObjectId(value)];
    return [];
  });
}

export function toObjectId(id: string, label = "identifier"): Types.ObjectId {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("VALIDATION_ERROR", `Invalid ${label}.`, 400);
  }
  return new Types.ObjectId(id);
}

export function sameId(left: Types.ObjectId | string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  return String(left) === right;
}
