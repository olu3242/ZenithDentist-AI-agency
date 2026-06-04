import { NextResponse } from "next/server";
import { getLizAdvisorResponse, lizMessageSchema } from "@/lib/liz";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = lizMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid LIZ message." }, { status: 400 });
  }

  const response = getLizAdvisorResponse(parsed.data.message);
  return NextResponse.json({ ok: true, response });
}
