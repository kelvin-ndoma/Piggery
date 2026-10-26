import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { AppError, toErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { assertPermission } from "@/lib/permissions";
import { requireFarmContextApi, type FarmContext } from "@/lib/context";
import type { Permission } from "@/types/domain";

type RouteContext = { params: Promise<Record<string, string>> };

type Handler<T> = (req: Request, ctx: FarmContext, route: RouteContext) => Promise<T>;

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function apiHandler<T>(
  handler: Handler<T>,
  options: { permission?: Permission; mutation?: boolean } = {},
) {
  return async (req: Request, route?: RouteContext): Promise<Response> => {
    try {
      if (options.mutation) assertSameOrigin(req);
      const ctx = await requireFarmContextApi();
      if (options.permission) assertPermission(ctx.role, options.permission);
      if (options.mutation) rateLimit(`mutation:${ctx.userId}`, 120, 60_000);
      const data = await handler(req, ctx, route ?? { params: Promise.resolve({}) });
      if (options.mutation) revalidatePath("/", "layout");
      if (data instanceof Response) return data;
      return ok(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }
  return schema.parse(body);
}

export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const entries = Object.fromEntries(new URL(request.url).searchParams.entries());
  return schema.parse(entries);
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    throw new AppError("FORBIDDEN", "This action must be sent from the farm app.", 403);
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN", "This action must be sent from the farm app.", 403);
  }
  if (originHost !== host) {
    throw new AppError("FORBIDDEN", "Cross-origin request rejected.", 403);
  }
}
