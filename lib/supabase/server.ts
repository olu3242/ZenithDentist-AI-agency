import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";

function isSupabaseJwt(value: string | undefined) {
  return Boolean(value && value.startsWith("eyJ") && value.split(".").length === 3);
}

function isModernSupabaseSecret(value: string | undefined) {
  return Boolean(value && value.startsWith("sb_secret_"));
}

function getSupabaseJwtRole(value: string | undefined) {
  return getSupabaseJwtDiagnostics(value)?.role;
}

function getSupabaseJwtDiagnostics(value: string | undefined) {
  if (!isSupabaseJwt(value)) return undefined;
  try {
    const payload = value!.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(payload, "base64").toString("utf8");
    const claims = JSON.parse(decoded) as { role?: string; ref?: string; iss?: string };
    return {
      role: claims.role,
      projectRef: claims.ref,
      issuer: claims.iss,
      keyPrefix: value!.slice(0, 8),
      validationResult: claims.role === "service_role" ? "valid_service_role" : "invalid_role"
    };
  } catch {
    return undefined;
  }
}

function getSupabaseServiceKey() {
  // Prefer an explicit SUPABASE_SERVICE_ROLE_KEY when it decodes to a service_role JWT
  if (getSupabaseJwtDiagnostics(env.SUPABASE_SERVICE_ROLE_KEY)?.role === "service_role") return env.SUPABASE_SERVICE_ROLE_KEY;

  // Accept modern Supabase secret keys starting with `sb_secret_`
  if (isModernSupabaseSecret(env.SUPABASE_SERVICE_ROLE_KEY)) return env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback: allow SUPABASE_SECRET_KEY if it's a modern secret
  if (isModernSupabaseSecret(env.SUPABASE_SECRET_KEY)) return env.SUPABASE_SECRET_KEY;

  return undefined;
}

export function createServiceClient() {
  const serverKey = getSupabaseServiceKey();
  const diagnostics = getSupabaseJwtDiagnostics(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !serverKey) {
    logger.warn("supabase_service_client_unavailable", {
      supabaseUrlLoaded: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
      serviceRoleLoaded: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      serviceRoleJwtLike: isSupabaseJwt(env.SUPABASE_SERVICE_ROLE_KEY),
      serviceRoleClaim: diagnostics?.role ?? "missing",
      serviceRoleProjectRef: diagnostics?.projectRef ?? "missing",
      serviceRoleKeyPrefix: diagnostics?.keyPrefix ?? "missing",
      serviceRoleValidationResult: diagnostics?.validationResult ?? "missing",
      legacySecretLoaded: Boolean(env.SUPABASE_SECRET_KEY),
      legacySecretJwtLike: isSupabaseJwt(env.SUPABASE_SECRET_KEY),
      modernServiceSecret: isModernSupabaseSecret(env.SUPABASE_SERVICE_ROLE_KEY) || isModernSupabaseSecret(env.SUPABASE_SECRET_KEY)
    });
    return null;
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export function createServerAuthClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
