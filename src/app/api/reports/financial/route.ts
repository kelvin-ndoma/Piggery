import { apiHandler } from "@/lib/api";
import { reportQuery } from "@/lib/report-route";
import { csvResponse, toCsv } from "@/lib/csv";
import { financialReport } from "@/services/reports";

export const GET = apiHandler(async (request, ctx) => {
  const { query, range } = reportQuery(request, ctx);
  const data = await financialReport(ctx, range.from, range.to);
  if (query.format === "csv") {
    return csvResponse("financial.csv", toCsv(["Type", "Date", "Detail", "Amount"], [
      ...data.sales.map((sale) => ["Sale", sale.date, sale.buyerName, sale.totalAmount] as Array<string | number | null>),
      ...data.expenses.map((expense) => ["Expense", expense.date, expense.description, expense.amount] as Array<string | number | null>),
    ]));
  }
  return { range, ...data };
}, { permission: "finance:read" });
