import { AppError } from "@/lib/errors";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    throw new AppError("FORBIDDEN", "This action must be sent from the Piggery site.", 403);
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN", "This action must be sent from the Piggery site.", 403);
  }
  if (originHost !== host) {
    throw new AppError("FORBIDDEN", "Cross-origin request rejected.", 403);
  }
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
