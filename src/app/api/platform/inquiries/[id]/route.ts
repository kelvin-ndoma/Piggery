import { parsePlatformJson, platformApiHandler } from "@/lib/platform-api";
import { acceptInquirySchema, declineInquirySchema } from "@/schemas";
import { acceptFarmInquiry, declineFarmInquiry, getFarmInquiry } from "@/services/inquiries";

export const GET = platformApiHandler(async (_req, _ctx, route) => {
  const { id } = await route.params;
  return getFarmInquiry(id);
});

export const POST = platformApiHandler(
  async (req, ctx, route) => {
    const { id } = await route.params;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (action === "decline") {
      const input = await parsePlatformJson(req, declineInquirySchema);
      return declineFarmInquiry(ctx, id, input.reviewNote);
    }
    const input = await parsePlatformJson(req, acceptInquirySchema);
    return acceptFarmInquiry(ctx, id, input);
  },
  { mutation: true },
);
