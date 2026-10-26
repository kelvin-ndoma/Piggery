import "server-only";
import { connectDB } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { toObjectId } from "@/lib/object-id";
import type { PlatformContext } from "@/lib/platform";
import { FarmInquiry } from "@/models/platform";
import { createFarmTenant, type CreateFarmTenantInput } from "@/services/platform";
import type { BillingCycle, BillingPlan, BillingStatus, InquiryStatus } from "@/types/domain";

function inquiryView(doc: {
  _id: unknown;
  name: string;
  email: string;
  phone?: string;
  farmName: string;
  country: string;
  locationNote?: string;
  herdNote?: string;
  plan: BillingPlan;
  cycle: BillingCycle;
  message?: string;
  status: InquiryStatus;
  farmId?: unknown;
  reviewNote?: string;
  reviewedByEmail?: string;
  reviewedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? "",
    farmName: doc.farmName,
    country: doc.country,
    locationNote: doc.locationNote ?? "",
    herdNote: doc.herdNote ?? "",
    plan: doc.plan,
    cycle: doc.cycle,
    message: doc.message ?? "",
    status: doc.status,
    farmId: doc.farmId ? String(doc.farmId) : null,
    reviewNote: doc.reviewNote ?? "",
    reviewedByEmail: doc.reviewedByEmail ?? "",
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function createFarmInquiry(input: {
  name: string;
  email: string;
  phone?: string;
  farmName: string;
  country: string;
  locationNote?: string;
  herdNote?: string;
  plan: BillingPlan;
  cycle: BillingCycle;
  message?: string;
}) {
  await connectDB();
  const email = input.email.toLowerCase().trim();
  const open = await FarmInquiry.exists({ email, status: "OPEN" });
  if (open) {
    throw new AppError("CONFLICT", "An open inquiry already exists for this email. Wait for a review.", 409);
  }
  const doc = await FarmInquiry.create({
    name: input.name.trim(),
    email,
    phone: input.phone,
    farmName: input.farmName.trim(),
    country: input.country.trim() || "Kenya",
    locationNote: input.locationNote,
    herdNote: input.herdNote,
    plan: input.plan,
    cycle: input.cycle,
    message: input.message,
    status: "OPEN",
  });
  return { id: String(doc._id) };
}

export async function countOpenInquiries() {
  await connectDB();
  return FarmInquiry.countDocuments({ status: "OPEN" });
}

export async function listFarmInquiries() {
  await connectDB();
  const rows = await FarmInquiry.find().sort({ createdAt: -1 }).limit(200).lean();
  return rows
    .sort((left, right) => Number(right.status === "OPEN") - Number(left.status === "OPEN"))
    .map(inquiryView);
}

export async function getFarmInquiry(id: string) {
  await connectDB();
  const doc = await FarmInquiry.findById(toObjectId(id)).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
  return inquiryView(doc);
}

export async function acceptFarmInquiry(
  ctx: PlatformContext,
  id: string,
  input: {
    ownerPassword: string;
    plan: BillingPlan;
    cycle: BillingCycle;
    amount: number;
    status: Extract<BillingStatus, "TRIAL" | "CURRENT" | "COMPED">;
    notes?: string;
  },
) {
  await connectDB();
  const inquiry = await FarmInquiry.findById(toObjectId(id));
  if (!inquiry) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
  if (inquiry.status !== "OPEN") {
    throw new AppError("CONFLICT", "This inquiry was already reviewed.", 409);
  }

  const created = await createFarmTenant(ctx, {
    farmName: inquiry.farmName,
    country: inquiry.country,
    phone: inquiry.phone,
    locationNote: inquiry.locationNote,
    ownerName: inquiry.name,
    ownerEmail: inquiry.email,
    ownerPassword: input.ownerPassword,
    ownerPhone: inquiry.phone,
    billing: {
      plan: input.plan,
      status: input.status,
      cycle: input.cycle,
      amount: input.amount,
      notes: input.notes ?? `Accepted inquiry ${String(inquiry._id)}`,
    },
  } satisfies CreateFarmTenantInput);

  inquiry.status = "ACCEPTED";
  inquiry.farmId = toObjectId(created.farmId);
  inquiry.reviewNote = input.notes ?? "";
  inquiry.reviewedByEmail = ctx.userEmail;
  inquiry.reviewedAt = new Date();
  await inquiry.save();

  return { farmId: created.farmId, ownerEmail: inquiry.email };
}

export async function declineFarmInquiry(ctx: PlatformContext, id: string, reviewNote: string) {
  await connectDB();
  const inquiry = await FarmInquiry.findById(toObjectId(id));
  if (!inquiry) throw new AppError("NOT_FOUND", "Inquiry not found.", 404);
  if (inquiry.status !== "OPEN") {
    throw new AppError("CONFLICT", "This inquiry was already reviewed.", 409);
  }
  inquiry.status = "DECLINED";
  inquiry.reviewNote = reviewNote;
  inquiry.reviewedByEmail = ctx.userEmail;
  inquiry.reviewedAt = new Date();
  await inquiry.save();
  return { id: String(inquiry._id), status: inquiry.status };
}
