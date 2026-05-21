import { NextResponse } from "next/server";
import { runOpenDentalPilotSync } from "@/lib/stability";

export async function POST() {
  const result = await runOpenDentalPilotSync();
  return NextResponse.json(result);
}
