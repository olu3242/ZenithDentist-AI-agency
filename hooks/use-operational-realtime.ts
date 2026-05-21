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
      .on("postgres_changes", { event: "*", schema: "public", table: "orchestration_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "enterprise_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "intelligence_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "benchmark_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_risk_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "forecasting_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "replay_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "intelligence_runs" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "orchestration_logs" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_health_snapshots" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "recommendation_outcome_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "simulation_accuracy_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "intelligence_quality_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "resilience_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "confidence_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "orchestration_dependency_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_traces" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_trace_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "automation_dead_letters" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_memory_entries" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_incidents" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "operational_incident_events" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "provider_health_snapshots" }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: "executive_report_snapshots" }, onChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
