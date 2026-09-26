import { apiHandler } from "@/lib/api";
import { maybeCsv, reportQuery } from "@/lib/report-route";
import { vaccinationBoard } from "@/services/health";

export const GET = apiHandler(async (request, ctx) => {
  const { query } = reportQuery(request, ctx);
  const board = await vaccinationBoard(ctx);
  const rows = [
    ...board.overdue.map((row) => ({ list: "Overdue", ...row })),
    ...board.dueToday.map((row) => ({ list: "Due today", ...row })),
    ...board.dueThisWeek.map((row) => ({ list: "Due this week", ...row })),
    ...board.recent.map((row) => ({ list: "Recent", ...row })),
  ];
  return maybeCsv(
    query.format,
    "vaccination.csv",
    ["List", "Pig", "Vaccine", "Date", "Due"],
    rows.map((row) => [row.list, row.pigId, row.vaccine, row.date, row.nextDueDate ?? ""]),
    { rows },
  );
}, { permission: "pigs:read" });
