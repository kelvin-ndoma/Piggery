import "server-only";
import type { ZodType } from "zod";
import { AppError, toErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { requirePlatformAdminApi, type PlatformContext } from "@/lib/platform";

type RouteContext = { params: Promise<Record<string, string>> };

type Handler<T> = (req: Request, ctx: PlatformContext, route: RouteContext) => Promise<T>;

export function platformOk<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function platformApiHandler<T>(
  handler: Handler<T>,
  options: { mutation?: boolean } = {},
) {
  return async (req: Request, route?: RouteContext): Promise<Response> => {
    try {
      if (options.mutation) assertSameOrigin(req);
      const ctx = await requirePlatformAdminApi();
      if (options.mutation) rateLimit(`platform:${ctx.userId}`, 60, 60_000);
      const data = await handler(req, ctx, route ?? { params: Promise.resolve({}) });
      if (data instanceof Response) return data;
      return platformOk(data);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parsePlatformJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be JSON.", 400);
  }
  return schema.parse(body);
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    throw new AppError("FORBIDDEN", "This action must be sent from the platform app.", 403);
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN", "This action must be sent from the platform app.", 403);
  }
  if (originHost !== host) {
    throw new AppError("FORBIDDEN", "Cross-origin request rejected.", 403);
  }
}
