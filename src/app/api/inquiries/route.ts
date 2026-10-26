import { AppError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, requestIp } from "@/lib/public-api";
import { rateLimit } from "@/lib/rate-limit";
import { createInquirySchema } from "@/schemas";
import { createFarmInquiry } from "@/services/inquiries";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    rateLimit(`inquiry:${requestIp(request)}`, 8, 60 * 60 * 1000);
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError("VALIDATION_ERROR", "Request body must be JSON.", 400);
    }
    const input = createInquirySchema.parse(body);
    rateLimit(`inquiry:email:${input.email.toLowerCase()}`, 3, 24 * 60 * 60 * 1000);
    const data = await createFarmInquiry(input);
    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
