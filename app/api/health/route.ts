import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

type ServiceStatus = "healthy" | "degraded" | "unavailable";

interface ServiceCheck {
  service: string;
  status: ServiceStatus;
  latencyMs: number;
  error?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    if (!supabase) return { service: "database", status: "unavailable", latencyMs: 0, error: "Client init failed" };
    const { error } = await supabase.from("organizations").select("id").limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { service: "database", status: "degraded", latencyMs, error: error.message };
    return { service: "database", status: "healthy", latencyMs };
  } catch (err) {
    return { service: "database", status: "unavailable", latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkRuntime(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    if (!supabase) return { service: "runtime", status: "unavailable", latencyMs: 0 };
    const { error } = await supabase.from("automation_traces").select("trace_id").limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { service: "runtime", status: "degraded", latencyMs, error: error.message };
    return { service: "runtime", status: "healthy", latencyMs };
  } catch (err) {
    return { service: "runtime", status: "unavailable", latencyMs: Date.now() - start, error: String(err) };
  }
}

async function checkEventFabric(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    if (!supabase) return { service: "event_fabric", status: "unavailable", latencyMs: 0 };
    const { error } = await supabase.from("runtime_event_fabric_events").select("id").limit(1);
    const latencyMs = Date.now() - start;
    if (error) return { service: "event_fabric", status: "degraded", latencyMs, error: error.message };
    return { service: "event_fabric", status: "healthy", latencyMs };
  } catch (err) {
    return { service: "event_fabric", status: "unavailable", latencyMs: Date.now() - start, error: String(err) };
  }
}

function checkAuth(): ServiceCheck {
  const start = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { service: "auth", status: "degraded", latencyMs: Date.now() - start, error: "Supabase env vars missing" };
  }
  return { service: "auth", status: "healthy", latencyMs: Date.now() - start };
}

function checkAI(): ServiceCheck {
  const start = Date.now();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  return {
    service: "ai",
    status: hasKey ? "healthy" : "degraded",
    latencyMs: Date.now() - start,
    error: hasKey ? undefined : "ANTHROPIC_API_KEY not configured",
  };
}

export async function GET() {
  const [database, runtime, eventFabric] = await Promise.all([
    checkDatabase(),
    checkRuntime(),
    checkEventFabric(),
  ]);

  const auth = checkAuth();
  const ai = checkAI();

  const checks: ServiceCheck[] = [database, runtime, eventFabric, auth, ai];
  const hasUnavailable = checks.some(c => c.status === "unavailable");
  const hasDegraded = checks.some(c => c.status === "degraded");

  const overallStatus: ServiceStatus = hasUnavailable ? "unavailable" : hasDegraded ? "degraded" : "healthy";
  const httpStatus = hasUnavailable ? 503 : hasDegraded ? 200 : 200;

  logger.info("health_check", { overallStatus, checks: checks.map(c => ({ service: c.service, status: c.status })) });

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    services: checks,
  }, { status: httpStatus });
}
