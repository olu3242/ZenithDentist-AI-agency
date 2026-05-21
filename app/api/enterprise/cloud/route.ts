import { NextResponse } from "next/server";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export async function GET() {
  const state = await getEnterpriseCloudState();
  return NextResponse.json(state);
}
