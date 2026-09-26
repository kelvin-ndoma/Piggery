import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { growthReport } from "@/services/reports";
import { compareGrowth } from "@/services/growth";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  if (query.pigIds || query.litterId || query.penId) {
    return compareGrowth(ctx, { pigIds: query.pigIds, litterId: query.litterId || undefined, penId: query.penId || undefined });
  }
  const rows = await growthReport(ctx, range.from, range.to);
  return maybeCsv(query.format, "growth.csv", ["Pig", "Date", "Weight kg"], rows.map((row) => [row.pigId, row.date, row.weightKg]), { range, rows });
}, { permission: "pigs:read" });
