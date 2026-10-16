import "server-only";
import { csvResponse, toCsv } from "@/lib/csv";
import { dateRangeSchema } from "@/schemas";
import { parseQuery } from "@/lib/api";
import { assertPermission } from "@/lib/permissions";
import { resolveRange } from "@/services/reports";
import { today } from "@/services/support";
import type { FarmContext } from "@/lib/context";

export function reportQuery(request: Request, ctx: FarmContext) {
  const query = parseQuery(request, dateRangeSchema);
  return { query, range: resolveRange(today(ctx), query) };
}

export function maybeCsv(
  ctx: FarmContext,
  format: string | undefined,
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null>>,
  data: unknown,
) {
  if (format === "csv") {
    assertPermission(ctx.role, "reports:export");
    return csvResponse(filename, toCsv(headers, rows));
  }
  return data;
}
