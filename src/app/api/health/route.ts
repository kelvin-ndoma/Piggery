import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mongoose = await connectDB();
    const db = mongoose.connection.db;
    if (mongoose.connection.readyState !== 1 || !db) {
      return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    await db.admin().command({ ping: 1 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
