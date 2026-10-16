import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { populationReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query } = reportQuery(request, ctx);
  const rows = await populationReport(ctx);
  return maybeCsv(ctx, query.format, "population.csv", ["Pig", "Sex", "Breed", "Category", "Status", "Date of birth", "Weight kg"], rows.map((row) => [row.pigId, row.sex, row.breed, row.category, row.status, row.dateOfBirth ?? null, row.weightKg]), { rows });
}, { permission: "pigs:read" });
