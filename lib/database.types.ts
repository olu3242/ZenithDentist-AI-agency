export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type LeadStatus = "new" | "roi_completed" | "audit_requested" | "booked" | "qualified" | "won" | "lost";
export type BookingStatus = "clicked" | "scheduled" | "cancelled" | "completed";
export type OutreachEventType =
  | "lead_created"
  | "roi_completed"
  | "audit_requested"
  | "booking_clicked"
  | "booking_confirmed"
  | "email_sent"
  | "cta_clicked"
  | "faq_interaction"
  | "funnel_abandoned";
export type AutomationEventStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";
export type NotificationSeverity = "info" | "success" | "warning" | "critical";
export type ReportPeriod = "weekly" | "monthly";
export type RecommendationPriority = "low" | "medium" | "high" | "critical";
export type OrganizationRole = "owner" | "admin" | "practice_manager" | "front_desk" | "analyst" | "executive_readonly";
export type OrganizationType = "single_practice" | "multi_location" | "dso" | "enterprise";
export type OnboardingStatus = "not_started" | "baseline" | "workflows" | "review" | "live";
export type SubscriptionPlanKey = "starter" | "growth" | "enterprise";
export type AliceMessageRole = "user" | "alice" | "system";
export type EventSeverity = "info" | "success" | "warning" | "critical";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "implemented" | "rolled_back";
export type PlaybookStatus = "draft" | "active" | "paused" | "retired";
export type PMSProviderKey = "dentrix" | "eaglesoft" | "open_dental" | "carestream" | "future_provider";
export type IntegrationStatus = "configured" | "syncing" | "degraded" | "paused" | "failed";
export type CloudLayerKey =
  | "operational_intelligence"
  | "revenue_orchestration"
  | "patient_engagement"
  | "benchmark_intelligence"
  | "autonomous_optimization"
  | "ai_recommendation"
  | "enterprise_governance"
  | "healthcare_api"
  | "operational_memory"
  | "simulation_intelligence";
export type AliceOperationalMode =
  | "executive_intelligence"
  | "forecasting"
  | "benchmark_analysis"
  | "enterprise_coordination"
  | "autonomous_recommendation"
  | "operational_risk_analysis";
export type GovernanceStatus = "draft" | "review_required" | "approved" | "rejected" | "active" | "rolled_back";
export type QueueStatus = "pending" | "processing" | "completed" | "failed" | "dead_letter" | "replayed";
export type PipelineKey = "ingestion" | "intelligence" | "recommendation" | "forecasting" | "orchestration" | "notification";
export type ReplayStatus = "requested" | "running" | "completed" | "failed" | "cancelled";
export type IntelligenceRunStatus = "queued" | "running" | "passed" | "warning" | "failed";
export type ConfidenceGrade = "excellent" | "good" | "watch" | "poor";
export type AutomationDomainKey =
  | "scheduling_intelligence"
  | "recall_recovery"
  | "review_acceleration"
  | "patient_retention"
  | "revenue_recovery"
  | "staffing_intelligence"
  | "executive_intelligence"
  | "ai_intelligence"
  | "benchmark_intelligence"
  | "enterprise_coordination";
export type AutomationCoverageStatus = "complete" | "partial" | "missing" | "risk";
export type AutomationTraceStatus = "running" | "completed" | "failed" | "replayed";
export type AutomationTraceStageStatus = "started" | "completed" | "failed" | "skipped";
export type AutomationFailureCategory =
  | "infra"
  | "auth"
  | "provider"
  | "timeout"
  | "business_rule"
  | "validation"
  | "dependency"
  | "partial_success"
  | "retry_exhausted";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          slug: string;
          organization_type: OrganizationType;
          practice_size: number;
          active_plan: SubscriptionPlanKey;
          onboarding_status: OnboardingStatus;
          settings: Json;
          branding: Json;
          timezone: string;
          primary_location_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["organizations"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Row"]>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          role: OrganizationRole;
          permissions: Json;
          invited_by: string | null;
          invited_at: string;
          accepted_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["organization_members"]["Row"]> & {
          organization_id: string;
          role: OrganizationRole;
        };
        Update: Partial<Database["public"]["Tables"]["organization_members"]["Row"]>;
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          organization_id: string;
          created_at: string;
          name: string;
          slug: string;
          address: string | null;
          timezone: string;
          chair_count: number;
          is_primary: boolean;
          settings: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["locations"]["Row"]> & {
          organization_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Row"]>;
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: OrganizationRole;
          description: string;
          default_permissions: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_roles"]["Row"]> & {
          role: OrganizationRole;
          description: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          plan_key: SubscriptionPlanKey;
          name: string;
          price_monthly: number;
          included_locations: number;
          included_usage: Json;
          features: Json;
          stripe_price_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscription_plans"]["Row"]> & {
          plan_key: SubscriptionPlanKey;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Row"]>;
        Relationships: [];
      };
      usage_metrics: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          metric_month: string;
          reminders_sent: number;
          recalls_processed: number;
          reviews_generated: number;
          portal_users: number;
          reports_generated: number;
          ai_insights_consumed: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["usage_metrics"]["Row"]> & {
          organization_id: string;
          metric_month: string;
        };
        Update: Partial<Database["public"]["Tables"]["usage_metrics"]["Row"]>;
        Relationships: [];
      };
      benchmark_snapshots: {
        Row: {
          id: string;
          organization_id: string | null;
          location_id: string | null;
          benchmark_date: string;
          cohort: string;
          no_show_rate_p50: number;
          recall_recovery_p50: number;
          review_conversion_p50: number;
          admin_efficiency_p50: number;
          percentile_rankings: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["benchmark_snapshots"]["Row"]> & {
          benchmark_date: string;
          cohort: string;
        };
        Update: Partial<Database["public"]["Tables"]["benchmark_snapshots"]["Row"]>;
        Relationships: [];
      };
      operational_scores: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          score_date: string;
          overall_score: number;
          no_show_score: number;
          recall_score: number;
          retention_score: number;
          review_score: number;
          efficiency_score: number;
          reliability_score: number;
          recommendation_adoption_score: number;
          risk_indicators: Json;
          opportunities: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["operational_scores"]["Row"]> & {
          organization_id: string;
          score_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_scores"]["Row"]>;
        Relationships: [];
      };
      alice_conversations: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          title: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alice_conversations"]["Row"]> & {
          organization_id: string;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["alice_conversations"]["Row"]>;
        Relationships: [];
      };
      alice_messages: {
        Row: {
          id: string;
          conversation_id: string;
          organization_id: string;
          role: AliceMessageRole;
          content: string;
          response_framework: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alice_messages"]["Row"]> & {
          conversation_id: string;
          organization_id: string;
          role: AliceMessageRole;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["alice_messages"]["Row"]>;
        Relationships: [];
      };
      alice_memory: {
        Row: {
          id: string;
          organization_id: string;
          memory_type: string;
          title: string;
          content: string;
          embedding_ref: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alice_memory"]["Row"]> & {
          organization_id: string;
          memory_type: string;
          title: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["alice_memory"]["Row"]>;
        Relationships: [];
      };
      operational_playbooks: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          category: string;
          status: PlaybookStatus;
          trigger_conditions: Json;
          operational_goals: Json;
          recommended_actions: Json;
          expected_outcomes: Json;
          rollback_logic: Json;
          approval_flow: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["operational_playbooks"]["Row"]> & {
          name: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_playbooks"]["Row"]>;
        Relationships: [];
      };
      recommendation_events: EventTable<"recommendation">;
      prediction_events: EventTable<"prediction">;
      anomaly_events: EventTable<"anomaly">;
      simulation_events: EventTable<"simulation">;
      optimization_events: EventTable<"optimization">;
      approval_events: {
        Row: {
          id: string;
          organization_id: string;
          related_event_id: string | null;
          approval_status: ApprovalStatus;
          requested_by: string | null;
          reviewed_by: string | null;
          decision_notes: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["approval_events"]["Row"]> & {
          organization_id: string;
          approval_status?: ApprovalStatus;
        };
        Update: Partial<Database["public"]["Tables"]["approval_events"]["Row"]>;
        Relationships: [];
      };
      pms_integrations: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          provider: PMSProviderKey;
          status: IntegrationStatus;
          display_name: string;
          sync_cursor: string | null;
          last_sync_at: string | null;
          last_success_at: string | null;
          failover_provider: PMSProviderKey | null;
          configuration: Json;
          health_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pms_integrations"]["Row"]> & {
          organization_id: string;
          provider: PMSProviderKey;
          display_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["pms_integrations"]["Row"]>;
        Relationships: [];
      };
      normalized_healthcare_events: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          integration_id: string | null;
          source_provider: PMSProviderKey;
          event_type: string;
          occurred_at: string;
          patient_ref: string | null;
          provider_ref: string | null;
          appointment_ref: string | null;
          normalized_payload: Json;
          forecast_features: Json;
          benchmark_features: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["normalized_healthcare_events"]["Row"]> & {
          organization_id: string;
          source_provider: PMSProviderKey;
          event_type: string;
          occurred_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["normalized_healthcare_events"]["Row"]>;
        Relationships: [];
      };
      healthcare_cloud_layers: {
        Row: {
          id: string;
          organization_id: string;
          layer_key: CloudLayerKey;
          status: IntegrationStatus;
          confidence: number;
          throughput_score: number;
          coordination_score: number;
          metadata: Json;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["healthcare_cloud_layers"]["Row"]> & {
          organization_id: string;
          layer_key: CloudLayerKey;
        };
        Update: Partial<Database["public"]["Tables"]["healthcare_cloud_layers"]["Row"]>;
        Relationships: [];
      };
      revenue_orchestration_runs: {
        Row: {
          id: string;
          organization_id: string;
          run_at: string;
          leakage_detected: number;
          recovery_prioritized: number;
          chair_utilization: number;
          hygiene_retention: number;
          bottlenecks: Json;
          recommendations: Json;
          confidence: number;
        };
        Insert: Partial<Database["public"]["Tables"]["revenue_orchestration_runs"]["Row"]> & {
          organization_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["revenue_orchestration_runs"]["Row"]>;
        Relationships: [];
      };
      knowledge_graph_nodes: {
        Row: {
          id: string;
          organization_id: string | null;
          node_type: string;
          label: string;
          properties: Json;
          confidence: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["knowledge_graph_nodes"]["Row"]> & {
          node_type: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["knowledge_graph_nodes"]["Row"]>;
        Relationships: [];
      };
      knowledge_graph_edges: {
        Row: {
          id: string;
          organization_id: string | null;
          source_node_id: string;
          target_node_id: string;
          relationship_type: string;
          weight: number;
          evidence: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["knowledge_graph_edges"]["Row"]> & {
          source_node_id: string;
          target_node_id: string;
          relationship_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["knowledge_graph_edges"]["Row"]>;
        Relationships: [];
      };
      enterprise_forecasts: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          forecast_type: string;
          forecast_window: string;
          probability: number;
          projected_impact: Json;
          drivers: Json;
          recommended_response: Json;
          confidence: number;
          generated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enterprise_forecasts"]["Row"]> & {
          organization_id: string;
          forecast_type: string;
          forecast_window: string;
          probability: number;
        };
        Update: Partial<Database["public"]["Tables"]["enterprise_forecasts"]["Row"]>;
        Relationships: [];
      };
      enterprise_playbooks: {
        Row: {
          id: string;
          organization_id: string | null;
          name: string;
          category: string;
          trigger_logic: Json;
          escalation_paths: Json;
          optimization_recommendations: Json;
          rollback_logic: Json;
          generated_adaptations: Json;
          outcome_tracking: Json;
          status: PlaybookStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enterprise_playbooks"]["Row"]> & {
          name: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["enterprise_playbooks"]["Row"]>;
        Relationships: [];
      };
      alice_enterprise_memory: {
        Row: {
          id: string;
          organization_id: string;
          mode: AliceOperationalMode;
          memory_title: string;
          memory_body: string;
          semantic_ref: string | null;
          lineage: Json;
          benchmark_context: Json;
          effectiveness_score: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alice_enterprise_memory"]["Row"]> & {
          organization_id: string;
          mode: AliceOperationalMode;
          memory_title: string;
          memory_body: string;
        };
        Update: Partial<Database["public"]["Tables"]["alice_enterprise_memory"]["Row"]>;
        Relationships: [];
      };
      enterprise_simulations: {
        Row: {
          id: string;
          organization_id: string;
          scenario_name: string;
          scenario_inputs: Json;
          projected_enterprise_impact: Json;
          staffing_pressure: number;
          retention_trajectory: number;
          operational_resilience: number;
          revenue_recovery_projection: number;
          benchmark_movement: Json;
          confidence: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["enterprise_simulations"]["Row"]> & {
          organization_id: string;
          scenario_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["enterprise_simulations"]["Row"]>;
        Relationships: [];
      };
      ai_governance_records: {
        Row: {
          id: string;
          organization_id: string;
          governed_object_type: string;
          governed_object_id: string | null;
          status: GovernanceStatus;
          approval_chain: Json;
          risk_controls: Json;
          rollback_plan: Json;
          audit_notes: string | null;
          created_at: string;
          decided_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_governance_records"]["Row"]> & {
          organization_id: string;
          governed_object_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_governance_records"]["Row"]>;
        Relationships: [];
      };
      orchestration_events: EventTable<"orchestration">;
      enterprise_events: EventTable<"enterprise">;
      intelligence_events: EventTable<"intelligence">;
      benchmark_events: EventTable<"benchmark">;
      operational_risk_events: EventTable<"operational_risk">;
      forecasting_events: EventTable<"forecasting">;
      open_dental_sync_checkpoints: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          integration_id: string | null;
          sync_scope: string;
          checkpoint_cursor: string;
          last_seen_remote_id: string | null;
          last_synced_at: string;
          reconciliation_hash: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["open_dental_sync_checkpoints"]["Row"]> & {
          organization_id: string;
          sync_scope: string;
          checkpoint_cursor: string;
        };
        Update: Partial<Database["public"]["Tables"]["open_dental_sync_checkpoints"]["Row"]>;
        Relationships: [];
      };
      operational_event_ledger: {
        Row: {
          id: string;
          organization_id: string;
          location_id: string | null;
          source_system: string;
          source_event_id: string;
          normalized_event_type: string;
          event_version: number;
          correlation_id: string;
          idempotency_key: string;
          lineage: Json;
          payload: Json;
          emitted_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["operational_event_ledger"]["Row"]> & {
          organization_id: string;
          source_system: string;
          source_event_id: string;
          normalized_event_type: string;
          idempotency_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_event_ledger"]["Row"]>;
        Relationships: [];
      };
      queue_events: {
        Row: {
          id: string;
          organization_id: string;
          operational_event_id: string | null;
          pipeline: PipelineKey;
          status: QueueStatus;
          correlation_id: string;
          idempotency_key: string;
          attempt_count: number;
          max_attempts: number;
          visible_at: string;
          next_retry_at: string | null;
          dead_letter_reason: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["queue_events"]["Row"]> & {
          organization_id: string;
          pipeline: PipelineKey;
          correlation_id: string;
          idempotency_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["queue_events"]["Row"]>;
        Relationships: [];
      };
      replay_events: {
        Row: {
          id: string;
          organization_id: string;
          requested_by: string | null;
          replay_scope: string;
          target_pipeline: PipelineKey;
          source_queue_event_id: string | null;
          status: ReplayStatus;
          replay_reason: string;
          replay_payload: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["replay_events"]["Row"]> & {
          organization_id: string;
          replay_scope: string;
          target_pipeline: PipelineKey;
          replay_reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["replay_events"]["Row"]>;
        Relationships: [];
      };
      intelligence_runs: {
        Row: {
          id: string;
          organization_id: string;
          run_type: string;
          status: IntelligenceRunStatus;
          grounding_sources: Json;
          input_fingerprint: string;
          output_summary: string | null;
          hallucination_score: number;
          operational_relevance: number;
          benchmark_correctness: number;
          confidence: number;
          evaluation: Json;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["intelligence_runs"]["Row"]> & {
          organization_id: string;
          run_type: string;
          input_fingerprint: string;
        };
        Update: Partial<Database["public"]["Tables"]["intelligence_runs"]["Row"]>;
        Relationships: [];
      };
      recommendation_lineage: {
        Row: {
          id: string;
          organization_id: string;
          recommendation_id: string | null;
          source_event_ids: string[];
          source_signals: Json;
          operational_reasoning: string;
          supporting_metrics: Json;
          confidence_score: number;
          historical_effectiveness: number;
          expected_outcome: string;
          accepted_at: string | null;
          rejected_at: string | null;
          outcome_payload: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recommendation_lineage"]["Row"]> & {
          organization_id: string;
          operational_reasoning: string;
          expected_outcome: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendation_lineage"]["Row"]>;
        Relationships: [];
      };
      forecast_accuracy: {
        Row: {
          id: string;
          organization_id: string;
          forecast_id: string | null;
          forecast_type: string;
          predicted_value: number;
          actual_value: number | null;
          drift_score: number;
          quality_score: number;
          evaluation_window: string;
          measured_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["forecast_accuracy"]["Row"]> & {
          organization_id: string;
          forecast_type: string;
          predicted_value: number;
          evaluation_window: string;
        };
        Update: Partial<Database["public"]["Tables"]["forecast_accuracy"]["Row"]>;
        Relationships: [];
      };
      anomaly_validations: {
        Row: {
          id: string;
          organization_id: string;
          anomaly_event_id: string | null;
          anomaly_type: string;
          severity: EventSeverity;
          precision_score: number;
          false_positive: boolean;
          escalation_quality: number;
          operational_relevance: number;
          validator_notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["anomaly_validations"]["Row"]> & {
          organization_id: string;
          anomaly_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["anomaly_validations"]["Row"]>;
        Relationships: [];
      };
      orchestration_logs: {
        Row: {
          id: string;
          organization_id: string;
          correlation_id: string;
          sequence_name: string;
          step_name: string;
          status: QueueStatus;
          dependency_keys: Json;
          trace_payload: Json;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orchestration_logs"]["Row"]> & {
          organization_id: string;
          correlation_id: string;
          sequence_name: string;
          step_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["orchestration_logs"]["Row"]>;
        Relationships: [];
      };
      operational_health_snapshots: {
        Row: {
          id: string;
          organization_id: string;
          snapshot_at: string;
          orchestration_health: number;
          ai_reliability_score: number;
          forecast_quality_score: number;
          queue_stability_score: number;
          operational_confidence_score: number;
          resilience_score: number;
          summary: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["operational_health_snapshots"]["Row"]> & {
          organization_id: string;
          orchestration_health: number;
          ai_reliability_score: number;
          forecast_quality_score: number;
          queue_stability_score: number;
          operational_confidence_score: number;
          resilience_score: number;
        };
        Update: Partial<Database["public"]["Tables"]["operational_health_snapshots"]["Row"]>;
        Relationships: [];
      };
      recommendation_outcome_events: EventTable<"recommendation_outcome">;
      simulation_accuracy_events: EventTable<"simulation_accuracy">;
      intelligence_quality_events: EventTable<"intelligence_quality">;
      resilience_events: EventTable<"resilience">;
      confidence_events: EventTable<"confidence">;
      orchestration_dependency_events: EventTable<"orchestration_dependency">;
      automation_blueprints: {
        Row: {
          id: string;
          organization_id: string | null;
          domain: AutomationDomainKey;
          name: string;
          purpose: string;
          triggers: Json;
          actions: Json;
          intelligence_outputs: Json;
          alice_visibility: Json;
          emitted_event_types: Json;
          required_pipelines: Json;
          required_controls: Json;
          coverage_status: AutomationCoverageStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_blueprints"]["Row"]> & {
          domain: AutomationDomainKey;
          name: string;
          purpose: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_blueprints"]["Row"]>;
        Relationships: [];
      };
      automation_audit_runs: {
        Row: {
          id: string;
          organization_id: string;
          run_at: string;
          total_blueprints: number;
          complete_count: number;
          partial_count: number;
          missing_count: number;
          risk_count: number;
          coverage_score: number;
          critical_gaps: Json;
          recommendations: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_audit_runs"]["Row"]> & {
          organization_id: string;
          total_blueprints: number;
          complete_count: number;
          partial_count: number;
          missing_count: number;
          risk_count: number;
          coverage_score: number;
        };
        Update: Partial<Database["public"]["Tables"]["automation_audit_runs"]["Row"]>;
        Relationships: [];
      };
      automation_coverage_results: {
        Row: {
          id: string;
          organization_id: string;
          audit_run_id: string | null;
          blueprint_id: string | null;
          domain: AutomationDomainKey;
          name: string;
          coverage_status: AutomationCoverageStatus;
          missing_controls: Json;
          missing_event_types: Json;
          missing_pipelines: Json;
          alice_visibility_score: number;
          replay_readiness_score: number;
          telemetry_score: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_coverage_results"]["Row"]> & {
          organization_id: string;
          domain: AutomationDomainKey;
          name: string;
          coverage_status: AutomationCoverageStatus;
        };
        Update: Partial<Database["public"]["Tables"]["automation_coverage_results"]["Row"]>;
        Relationships: [];
      };
      automation_traces: {
        Row: {
          id: string;
          trace_id: string;
          workflow_id: string;
          organization_id: string;
          domain: string;
          event_name: string;
          status: AutomationTraceStatus;
          correlation_id: string;
          started_at: string;
          completed_at: string | null;
          latency_ms: number | null;
          retry_count: number;
          failure_category: AutomationFailureCategory | null;
          failure_reason: string | null;
          metadata: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_traces"]["Row"]> & {
          workflow_id: string;
          organization_id: string;
          domain: string;
          event_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_traces"]["Row"]>;
        Relationships: [];
      };
      automation_trace_events: {
        Row: {
          id: string;
          trace_id: string;
          stage: string;
          status: AutomationTraceStageStatus;
          message: string;
          created_at: string;
          metadata: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_trace_events"]["Row"]> & {
          trace_id: string;
          stage: string;
          status: AutomationTraceStageStatus;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_trace_events"]["Row"]>;
        Relationships: [];
      };
      automation_dead_letters: {
        Row: {
          id: string;
          trace_id: string;
          workflow_id: string;
          payload: Json;
          failure_reason: string;
          replayable: boolean;
          replayed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_dead_letters"]["Row"]> & {
          trace_id: string;
          workflow_id: string;
          failure_reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["automation_dead_letters"]["Row"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
          dentist_name: string | null;
          practice_name: string;
          email: string;
          phone: string | null;
          locations: number;
          staff_size: number | null;
          pms_software: string | null;
          no_show_rate: number | null;
          operational_pain: string | null;
          status: LeadStatus;
          source: string;
          notes: string | null;
          attribution: Json;
        };
        Insert: Partial<Database["public"]["Tables"]["leads"]["Row"]> & {
          practice_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Row"]>;
        Relationships: [];
      };
      roi_calculations: {
        Row: {
          id: string;
          organization_id: string | null;
          lead_id: string;
          chairs: number;
          monthly_appointments: number;
          avg_appointment_value: number;
          no_show_rate: number;
          recall_patients_lost: number;
          admin_hours_per_day: number;
          monthly_revenue_loss: number;
          yearly_revenue_loss: number;
          recoverable_revenue: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["roi_calculations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["roi_calculations"]["Row"]>;
        Relationships: [];
      };
      audits: {
        Row: {
          id: string;
          organization_id: string | null;
          lead_id: string;
          audit_summary: string;
          recommendations: Json;
          projected_recovery: number;
          generated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audits"]["Row"], "id" | "generated_at">;
        Update: Partial<Database["public"]["Tables"]["audits"]["Row"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          organization_id: string | null;
          lead_id: string | null;
          calendly_event_id: string | null;
          scheduled_at: string | null;
          booking_status: BookingStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      outreach_events: {
        Row: {
          id: string;
          organization_id: string | null;
          lead_id: string | null;
          event_type: OutreachEventType;
          event_metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["outreach_events"]["Row"]> & {
          event_type: OutreachEventType;
        };
        Update: Partial<Database["public"]["Tables"]["outreach_events"]["Row"]>;
        Relationships: [];
      };
      faq_interactions: {
        Row: {
          id: string;
          question: string;
          category: string;
          interaction_type: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["faq_interactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["faq_interactions"]["Row"]>;
        Relationships: [];
      };
      automation_events: {
        Row: {
          id: string;
          organization_id: string | null;
          location_id: string | null;
          practice_id: string | null;
          workflow: string;
          trigger_name: string;
          action_name: string;
          outcome: string | null;
          status: AutomationEventStatus;
          success_rate: number | null;
          recovery_amount: number;
          event_metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["automation_events"]["Row"]> & {
          workflow: string;
          trigger_name: string;
          action_name: string;
          status?: AutomationEventStatus;
        };
        Update: Partial<Database["public"]["Tables"]["automation_events"]["Row"]>;
        Relationships: [];
      };
      operational_metrics: {
        Row: {
          id: string;
          organization_id: string | null;
          location_id: string | null;
          practice_id: string | null;
          metric_date: string;
          no_show_rate: number;
          recovered_revenue: number;
          recall_recovery_count: number;
          patient_engagement_rate: number;
          review_requests_sent: number;
          reviews_generated: number;
          admin_hours_saved: number;
          confirmation_rate: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["operational_metrics"]["Row"]> & {
          metric_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_metrics"]["Row"]>;
        Relationships: [];
      };
      insight_snapshots: {
        Row: {
          id: string;
          organization_id: string | null;
          practice_id: string | null;
          title: string;
          summary: string;
          category: string;
          severity: NotificationSeverity;
          confidence: number;
          evidence: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["insight_snapshots"]["Row"]> & {
          title: string;
          summary: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["insight_snapshots"]["Row"]>;
        Relationships: [];
      };
      recommendations: {
        Row: {
          id: string;
          organization_id: string | null;
          practice_id: string | null;
          title: string;
          recommendation: string;
          priority: RecommendationPriority;
          expected_impact: string;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recommendations"]["Row"]> & {
          title: string;
          recommendation: string;
        };
        Update: Partial<Database["public"]["Tables"]["recommendations"]["Row"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          organization_id: string | null;
          practice_id: string | null;
          period: ReportPeriod;
          title: string;
          summary: string;
          metrics: Json;
          recommendations: Json;
          report_url: string | null;
          generated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reports"]["Row"]> & {
          period: ReportPeriod;
          title: string;
          summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string | null;
          practice_id: string | null;
          title: string;
          body: string;
          severity: NotificationSeverity;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          title: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_status: LeadStatus;
      booking_status: BookingStatus;
      outreach_event_type: OutreachEventType;
      automation_event_status: AutomationEventStatus;
      notification_severity: NotificationSeverity;
      report_period: ReportPeriod;
      recommendation_priority: RecommendationPriority;
      organization_role: OrganizationRole;
      organization_type: OrganizationType;
      onboarding_status: OnboardingStatus;
      subscription_plan_key: SubscriptionPlanKey;
      alice_message_role: AliceMessageRole;
      event_severity: EventSeverity;
      approval_status: ApprovalStatus;
      playbook_status: PlaybookStatus;
      pms_provider_key: PMSProviderKey;
      integration_status: IntegrationStatus;
      cloud_layer_key: CloudLayerKey;
      alice_operational_mode: AliceOperationalMode;
      governance_status: GovernanceStatus;
      queue_status: QueueStatus;
      pipeline_key: PipelineKey;
      replay_status: ReplayStatus;
      intelligence_run_status: IntelligenceRunStatus;
      confidence_grade: ConfidenceGrade;
      automation_domain_key: AutomationDomainKey;
      automation_coverage_status: AutomationCoverageStatus;
      automation_trace_status: AutomationTraceStatus;
      automation_trace_stage_status: AutomationTraceStageStatus;
      automation_failure_category: AutomationFailureCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}

type EventTable<T extends string> = {
  Row: {
    id: string;
    organization_id: string;
    location_id: string | null;
    event_type: T;
    title: string;
    summary: string;
    severity: EventSeverity;
    confidence: number;
    event_payload: Json;
    created_at: string;
  };
  Insert: Partial<EventTable<T>["Row"]> & {
    organization_id: string;
    event_type: T;
    title: string;
    summary: string;
  };
  Update: Partial<EventTable<T>["Row"]>;
  Relationships: [];
};
