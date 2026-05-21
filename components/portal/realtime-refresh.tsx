"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useOperationalRealtime } from "@/hooks/use-operational-realtime";

export function RealtimeRefresh() {
  const router = useRouter();
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useOperationalRealtime(refresh);
  return null;
}
