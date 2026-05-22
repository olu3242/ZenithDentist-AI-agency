import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseServerEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export function createServiceClient() {
  const serverKey = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasSupabaseServerEnv || !env.NEXT_PUBLIC_SUPABASE_URL || !serverKey) {
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
