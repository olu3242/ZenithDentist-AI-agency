"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export function useOperationalRealtime(onChange: () => void) {
  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("portal-operational-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_metrics" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "recommendation_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "prediction_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "anomaly_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "optimization_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_events" }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
