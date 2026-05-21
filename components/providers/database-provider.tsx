"use client";

import { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type DatabaseContextValue = {
  client: SupabaseClient<Database> | null;
  isConfigured: boolean;
};

const DatabaseContext = createContext<DatabaseContextValue>({
  client: null,
  isConfigured: false
});

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => {
    const client = createBrowserClient();
    return { client, isConfigured: Boolean(client) };
  }, []);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
