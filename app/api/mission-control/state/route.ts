import { NextResponse } from "next/server";
import { getMissionControlState } from "@/lib/stability";

export async function GET() {
  const state = await getMissionControlState();
  return NextResponse.json(state);
}
