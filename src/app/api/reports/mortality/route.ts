import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { mortalityReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const rows = await mortalityReport(ctx, range.from, range.to);
  return maybeCsv(query.format, "mortality.csv", ["Pig", "Category", "Date", "Age days", "Weight kg", "Suspected cause", "Confirmed cause"], rows.map((row) => [row.pigId, row.category, row.date, row.ageDays, row.weightKg, row.suspectedCause, row.confirmedCause]), { range, rows });
}, { permission: "pigs:read" });
