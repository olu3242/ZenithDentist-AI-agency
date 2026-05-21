import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export function createServiceClient() {
  if (!hasSupabaseServerEnv || !env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
