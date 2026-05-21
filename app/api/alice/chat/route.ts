import { NextResponse } from "next/server";
import { z } from "zod";
import { answerOperationalQuery } from "@/lib/alice";

const schema = z.object({
  question: z.string().min(3).max(1000)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Question is required." }, { status: 400 });
  }

  const response = await answerOperationalQuery(parsed.data.question);
  return NextResponse.json({ ok: true, response });
}
