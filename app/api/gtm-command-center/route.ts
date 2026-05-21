import { NextResponse } from "next/server";
import { getBusinessGrowthState } from "@/lib/gtm/business-growth";

export async function GET() {
  const state = await getBusinessGrowthState();
  return NextResponse.json(state);
}
