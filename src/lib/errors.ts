import { ZodError } from "zod";
import type { ApiFailure } from "@/types/api";

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

type MongoLike = {
  code?: number;
  name?: string;
  keyPattern?: Record<string, unknown>;
};

const DUPLICATE_MESSAGES: Record<string, string> = {
  pigId: "That pig ID is already used on this farm.",
  earTag: "That ear tag is already used on this farm.",
  qrCode: "That QR code is already used on this farm.",
  litterNumber: "That litter number already exists.",
  email: "A user with that email already exists.",
  clientTransactionId: "This record was already saved.",
  slug: "A farm with that name already exists.",
  code: "That code is already used.",
};

export function duplicateField(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const mongo = error as MongoLike;
  if (mongo.code !== 11000) return null;
  const field = mongo.keyPattern ? Object.keys(mongo.keyPattern)[0] : undefined;
  return field ?? "record";
}

export function errorPayload(error: unknown): { status: number; body: ApiFailure } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { success: false, error: { code: error.code, message: error.message } },
    };
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Check the form and try again.";
    return {
      status: 400,
      body: { success: false, error: { code: "VALIDATION_ERROR", message } },
    };
  }

  const field = duplicateField(error);
  if (field) {
    return {
      status: 409,
      body: {
        success: false,
        error: {
          code: "CONFLICT",
          message: DUPLICATE_MESSAGES[field] ?? "That record already exists.",
        },
      },
    };
  }

  if (typeof error === "object" && error !== null && (error as MongoLike).name === "CastError") {
    return {
      status: 400,
      body: { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid identifier." } },
    };
  }

  const name = typeof error === "object" && error !== null && "name" in error ? String((error as MongoLike).name) : "";
  if (name.includes("Mongo") || name === "MongooseError") {
    console.error("Database failure");
    return {
      status: 500,
      body: {
        success: false,
        error: { code: "DATABASE_ERROR", message: "The database is unavailable. Try again shortly." },
      },
    };
  }

  console.error(error);
  return {
    status: 500,
    body: {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    },
  };
}

export function toErrorResponse(error: unknown): Response {
  const { status, body } = errorPayload(error);
  return Response.json(body, { status });
}
