import { NextResponse } from "next/server";
import { getPricingComparison } from "@/lib/commercialization/pricing-engine";

export async function GET() {
  const plans = getPricingComparison("monthly");
  return NextResponse.json({ plans });
}
