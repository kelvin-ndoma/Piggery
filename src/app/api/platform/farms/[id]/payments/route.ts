import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { recordFarmPaymentSchema } from "@/schemas";
import { listFarmPayments, recordFarmPayment } from "@/services/platform";

export const GET = platformApiHandler(async (_req, _ctx, route) => {
  const { id } = await route.params;
  return listFarmPayments(id);
});

export const POST = platformApiHandler(
  async (req, ctx, route) => {
    const { id } = await route.params;
    const input = await parsePlatformJson(req, recordFarmPaymentSchema);
    return recordFarmPayment(ctx, id, input);
  },
  { mutation: true },
);
