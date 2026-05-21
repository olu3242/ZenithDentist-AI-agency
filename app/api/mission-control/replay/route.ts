import { NextResponse } from "next/server";
import { createReplayRequest } from "@/lib/stability";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const replay = await createReplayRequest({
    replayScope: typeof body.replayScope === "string" ? body.replayScope : undefined,
    targetPipeline: typeof body.targetPipeline === "string" ? body.targetPipeline : undefined,
    reason: typeof body.reason === "string" ? body.reason : undefined,
    sourceQueueEventId: typeof body.sourceQueueEventId === "string" ? body.sourceQueueEventId : null
  });
  return NextResponse.json(replay);
}
