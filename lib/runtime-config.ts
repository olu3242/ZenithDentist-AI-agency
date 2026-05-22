import "server-only";

import { env, hasSupabaseBrowserEnv, hasSupabaseServerEnv } from "@/lib/env";

export type RuntimeConfigGroup = "supabase" | "stripe" | "ai" | "telemetry" | "auth" | "automation";

export interface RuntimeDiagnostic {
  group: RuntimeConfigGroup;
  status: "ready" | "disabled" | "warning" | "error";
  message: string;
  missingEnv?: string[];
}

export interface RuntimeDiagnostics {
  production: boolean;
  groups: Record<RuntimeConfigGroup, RuntimeDiagnostic>;
  safeEnv: Record<string, string | undefined>;
}

const SECRET_PATTERN = /(KEY|TOKEN|SECRET|PASSWORD)/i;

export function validateRuntimeConfig() {
  const diagnostics = getRuntimeDiagnostics();
  const blocking = Object.values(diagnostics.groups).filter(item => item.status === "error");
  if (diagnostics.production && blocking.length) {
    throw new Error(`Runtime configuration is incomplete: ${blocking.map(item => `${item.group}:${item.missingEnv?.join(",")}`).join(";")}`);
  }
  return diagnostics;
}

export function getRuntimeDiagnostics(): RuntimeDiagnostics {
  const serverSupabaseMissing = missing({
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY
  });
  const browserSupabaseMissing = missing({
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
  const aiMissing = env.AI_PROVIDER === "openai"
    ? missing({ OPENAI_API_KEY: env.OPENAI_API_KEY })
    : env.AI_PROVIDER === "anthropic"
      ? missing({ ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY })
      : [];

  return {
    production: process.env.NODE_ENV === "production",
    safeEnv: maskEnv({
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      STRIPE_API_KEY: env.STRIPE_API_KEY,
      RESEND_API_KEY: env.RESEND_API_KEY,
      OPENAI_API_KEY: env.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      ADMIN_ACCESS_TOKEN: env.ADMIN_ACCESS_TOKEN,
      PORTAL_ACCESS_TOKEN: env.PORTAL_ACCESS_TOKEN,
      INTERNAL_ACCESS_TOKEN: env.INTERNAL_ACCESS_TOKEN
    }),
    groups: {
      supabase: serverSupabaseMissing.length || browserSupabaseMissing.length
        ? diagnostic("supabase", process.env.NODE_ENV === "production" ? "error" : "warning", "Supabase is partially configured.", [...serverSupabaseMissing, ...browserSupabaseMissing])
        : diagnostic("supabase", hasSupabaseServerEnv && hasSupabaseBrowserEnv ? "ready" : "warning", "Supabase runtime access is configured."),
      stripe: env.STRIPE_API_KEY
        ? diagnostic("stripe", "ready", "Stripe server key is configured.")
        : diagnostic("stripe", "disabled", "Stripe billing is disabled until STRIPE_API_KEY is configured.", ["STRIPE_API_KEY"]),
      ai: aiMissing.length
        ? diagnostic("ai", "warning", `${env.AI_PROVIDER} provider is selected but not fully configured.`, aiMissing)
        : diagnostic("ai", env.AI_PROVIDER === "local" ? "disabled" : "ready", `${env.AI_PROVIDER} AI provider is active.`),
      telemetry: env.NEXT_PUBLIC_GA_ID || env.NEXT_PUBLIC_META_PIXEL_ID || env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID
        ? diagnostic("telemetry", "ready", "At least one external analytics destination is configured.")
        : diagnostic("telemetry", "disabled", "External analytics destinations are disabled."),
      auth: env.ADMIN_ACCESS_TOKEN && env.PORTAL_ACCESS_TOKEN && env.INTERNAL_ACCESS_TOKEN
        ? diagnostic("auth", "ready", "Route access tokens are configured.")
        : diagnostic("auth", process.env.NODE_ENV === "production" ? "error" : "warning", "One or more access tokens are missing.", missing({
          ADMIN_ACCESS_TOKEN: env.ADMIN_ACCESS_TOKEN,
          PORTAL_ACCESS_TOKEN: env.PORTAL_ACCESS_TOKEN,
          INTERNAL_ACCESS_TOKEN: env.INTERNAL_ACCESS_TOKEN
        })),
      automation: hasSupabaseServerEnv
        ? diagnostic("automation", "ready", "Automation runtime persistence is configured.")
        : diagnostic("automation", process.env.NODE_ENV === "production" ? "error" : "warning", "Automation persistence requires Supabase server credentials.", serverSupabaseMissing)
    }
  };
}

export function maskSecret(value: string | undefined) {
  if (!value) return undefined;
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function diagnostic(group: RuntimeConfigGroup, status: RuntimeDiagnostic["status"], message: string, missingEnv: string[] = []): RuntimeDiagnostic {
  return { group, status, message, missingEnv };
}

function missing(values: Record<string, unknown>) {
  return Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
}

function maskEnv(values: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, SECRET_PATTERN.test(key) ? maskSecret(value) : value]));
}
