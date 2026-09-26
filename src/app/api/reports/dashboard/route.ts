import { apiHandler } from "@/lib/api";
import { dashboardReport } from "@/services/reports";

export const GET = apiHandler(async (_request, ctx) => dashboardReport(ctx), { permission: "pigs:read" });
