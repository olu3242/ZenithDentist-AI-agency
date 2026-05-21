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
