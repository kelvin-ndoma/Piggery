import { apiHandler } from "@/lib/api";
import { listNotifications } from "@/services/notifications";

export const GET = apiHandler(async (_request, ctx) => listNotifications(ctx));
