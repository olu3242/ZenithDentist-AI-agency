import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Certification-safe deployment metadata.
 * Never expose secrets, patient data, credentials, or database contents here.
 */
export async function GET() {
  return NextResponse.json(
    {
      service: "zenith-pros",
      certificationContract: "runtime-e2e-v1",
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
      deploymentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      capabilities: {
        dentalOnboarding: true,
        flowOrchestration: true,
        flowIntelligence: true,
        zeroLiveDispatchRequired: true,
        humanGovernanceRequired: true,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
