import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { healthReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const rows = await healthReport(ctx, range.from, range.to);
  return maybeCsv(query.format, "health.csv", ["Pig", "Date", "Severity", "Status", "Symptoms"], rows.map((row) => [row.pigId, row.date, row.severity, row.status, row.symptoms]), { range, rows });
}, { permission: "pigs:read" });
