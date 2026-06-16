export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adoption_scores: {
        Row: {
          adoption_score: number
          feature_key: string
          id: string
          measured_at: string
          metadata: Json
          organization_id: string
          usage_count: number
        }
        Insert: {
          adoption_score?: number
          feature_key: string
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id: string
          usage_count?: number
        }
        Update: {
          adoption_score?: number
          feature_key?: string
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "adoption_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_bus_messages: {
        Row: {
          correlation_id: string | null
          created_at: string
          id: string
          message_type: string
          organization_id: string
          payload: Json
          priority: Database["public"]["Enums"]["agent_message_priority"]
          source_agent_key: string
          target_agent_key: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          id?: string
          message_type: string
          organization_id: string
          payload?: Json
          priority?: Database["public"]["Enums"]["agent_message_priority"]
          source_agent_key: string
          target_agent_key?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          id?: string
          message_type?: string
          organization_id?: string
          payload?: Json
          priority?: Database["public"]["Enums"]["agent_message_priority"]
          source_agent_key?: string
          target_agent_key?: string | null
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          agent_key: string
          created_at: string | null
          event_type: string
          id: string
          organization_id: string
          patient_external_id: string | null
          payload: Json | null
          task_id: string | null
        }
        Insert: {
          agent_key: string
          created_at?: string | null
          event_type: string
          id?: string
          organization_id: string
          patient_external_id?: string | null
          payload?: Json | null
          task_id?: string | null
        }
        Update: {
          agent_key?: string
          created_at?: string | null
          event_type?: string
          id?: string
          organization_id?: string
          patient_external_id?: string | null
          payload?: Json | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          agent_key: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string | null
          duration_ms: number | null
          execution_status: string
          fallback_used: boolean | null
          id: string
          model_used: string | null
          organization_id: string
          result_data: Json | null
          result_summary: string | null
          started_at: string | null
          task_id: string | null
          tokens_used: number | null
        }
        Insert: {
          agent_key: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          duration_ms?: number | null
          execution_status?: string
          fallback_used?: boolean | null
          id?: string
          model_used?: string | null
          organization_id: string
          result_data?: Json | null
          result_summary?: string | null
          started_at?: string | null
          task_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          agent_key?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          duration_ms?: number | null
          execution_status?: string
          fallback_used?: boolean | null
          id?: string
          model_used?: string | null
          organization_id?: string
          result_data?: Json | null
          result_summary?: string | null
          started_at?: string | null
          task_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_executions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          agent_name: string
          correlation_id: string | null
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          agent_name: string
          correlation_id?: string | null
          created_at?: string
          id?: string
          level?: string
          message: string
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          agent_name?: string
          correlation_id?: string | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_metrics: {
        Row: {
          agent_key: string
          avg_confidence: number | null
          created_at: string | null
          id: string
          metric_date: string
          organization_id: string
          patients_influenced: number | null
          recommendations_actioned: number | null
          recommendations_generated: number | null
          revenue_influenced: number | null
          tasks_executed: number | null
          tasks_failed: number | null
          tasks_succeeded: number | null
        }
        Insert: {
          agent_key: string
          avg_confidence?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          organization_id: string
          patients_influenced?: number | null
          recommendations_actioned?: number | null
          recommendations_generated?: number | null
          revenue_influenced?: number | null
          tasks_executed?: number | null
          tasks_failed?: number | null
          tasks_succeeded?: number | null
        }
        Update: {
          agent_key?: string
          avg_confidence?: number | null
          created_at?: string | null
          id?: string
          metric_date?: string
          organization_id?: string
          patients_influenced?: number | null
          recommendations_actioned?: number | null
          recommendations_generated?: number | null
          revenue_influenced?: number | null
          tasks_executed?: number | null
          tasks_failed?: number | null
          tasks_succeeded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_recommendations: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          agent_key: string
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          organization_id: string
          patient_external_id: string | null
          priority: string | null
          reasoning: string | null
          recommendation_type: string
          recommended_action: string
          recommended_channel: string | null
          recommended_script_theme: string | null
          revenue_potential: number | null
          status: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          agent_key: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          patient_external_id?: string | null
          priority?: string | null
          reasoning?: string | null
          recommendation_type: string
          recommended_action: string
          recommended_channel?: string | null
          recommended_script_theme?: string | null
          revenue_potential?: number | null
          status?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          agent_key?: string
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          patient_external_id?: string | null
          priority?: string | null
          reasoning?: string | null
          recommendation_type?: string
          recommended_action?: string
          recommended_channel?: string | null
          recommended_script_theme?: string | null
          revenue_potential?: number | null
          status?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_registry: {
        Row: {
          agent_key: string
          agent_name: string
          capabilities: Json | null
          created_at: string | null
          description: string | null
          domain: string
          id: string
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          agent_key: string
          agent_name: string
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          agent_key?: string
          agent_name?: string
          capabilities?: Json | null
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          agent_key: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_context: Json | null
          organization_id: string
          patient_external_id: string | null
          priority: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          task_type: string
        }
        Insert: {
          agent_key: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          organization_id: string
          patient_external_id?: string | null
          priority?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          task_type: string
        }
        Update: {
          agent_key?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_context?: Json | null
          organization_id?: string
          patient_external_id?: string | null
          priority?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_key_fkey"
            columns: ["agent_key"]
            isOneToOne: false
            referencedRelation: "agent_registry"
            referencedColumns: ["agent_key"]
          },
          {
            foreignKeyName: "agent_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_governance_records: {
        Row: {
          approval_chain: Json
          audit_notes: string | null
          created_at: string
          decided_at: string | null
          governed_object_id: string | null
          governed_object_type: string
          id: string
          organization_id: string
          risk_controls: Json
          rollback_plan: Json
          status: Database["public"]["Enums"]["governance_status"]
        }
        Insert: {
          approval_chain?: Json
          audit_notes?: string | null
          created_at?: string
          decided_at?: string | null
          governed_object_id?: string | null
          governed_object_type: string
          id?: string
          organization_id: string
          risk_controls?: Json
          rollback_plan?: Json
          status?: Database["public"]["Enums"]["governance_status"]
        }
        Update: {
          approval_chain?: Json
          audit_notes?: string | null
          created_at?: string
          decided_at?: string | null
          governed_object_id?: string | null
          governed_object_type?: string
          id?: string
          organization_id?: string
          risk_controls?: Json
          rollback_plan?: Json
          status?: Database["public"]["Enums"]["governance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_governance_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_change_events: {
        Row: {
          change_metadata: Json
          change_type: string
          created_at: string
          entity_key: string | null
          id: string
          impact: string
          source_module: string
        }
        Insert: {
          change_metadata?: Json
          change_type: string
          created_at?: string
          entity_key?: string | null
          id?: string
          impact?: string
          source_module: string
        }
        Update: {
          change_metadata?: Json
          change_type?: string
          created_at?: string
          entity_key?: string | null
          id?: string
          impact?: string
          source_module?: string
        }
        Relationships: []
      }
      alice_confidence: {
        Row: {
          alice_decision_id: string | null
          confidence_reason: string | null
          confidence_score: number
          id: string
          measured_at: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          alice_decision_id?: string | null
          confidence_reason?: string | null
          confidence_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          alice_decision_id?: string | null
          confidence_reason?: string | null
          confidence_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_confidence_alice_decision_id_fkey"
            columns: ["alice_decision_id"]
            isOneToOne: false
            referencedRelation: "alice_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alice_confidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_decisions: {
        Row: {
          business_impact: string | null
          confidence: number
          decided_at: string
          decision_type: string
          id: string
          inputs: Json
          metadata: Json
          organization_id: string
          outcome: string | null
          reasoning: string | null
          recommendation: string
          trace_id: string
        }
        Insert: {
          business_impact?: string | null
          confidence?: number
          decided_at?: string
          decision_type: string
          id?: string
          inputs?: Json
          metadata?: Json
          organization_id: string
          outcome?: string | null
          reasoning?: string | null
          recommendation: string
          trace_id: string
        }
        Update: {
          business_impact?: string | null
          confidence?: number
          decided_at?: string
          decision_type?: string
          id?: string
          inputs?: Json
          metadata?: Json
          organization_id?: string
          outcome?: string | null
          reasoning?: string | null
          recommendation?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_enterprise_memory: {
        Row: {
          benchmark_context: Json
          created_at: string
          effectiveness_score: number | null
          id: string
          lineage: Json
          memory_body: string
          memory_title: string
          mode: Database["public"]["Enums"]["alice_operational_mode"]
          organization_id: string
          semantic_ref: string | null
        }
        Insert: {
          benchmark_context?: Json
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          lineage?: Json
          memory_body: string
          memory_title: string
          mode: Database["public"]["Enums"]["alice_operational_mode"]
          organization_id: string
          semantic_ref?: string | null
        }
        Update: {
          benchmark_context?: Json
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          lineage?: Json
          memory_body?: string
          memory_title?: string
          mode?: Database["public"]["Enums"]["alice_operational_mode"]
          organization_id?: string
          semantic_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alice_enterprise_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_executive_briefings: {
        Row: {
          briefing_date: string
          created_at: string
          executive_intelligence_score: number | null
          growth_forecast: Json | null
          id: string
          opportunities: Json
          organization_id: string
          priority_actions: Json
          projected_business_impact: Json | null
          revenue_forecast: Json | null
          risks: Json
          top_recommendations: Json
          workflow_health: Json | null
        }
        Insert: {
          briefing_date?: string
          created_at?: string
          executive_intelligence_score?: number | null
          growth_forecast?: Json | null
          id?: string
          opportunities?: Json
          organization_id: string
          priority_actions?: Json
          projected_business_impact?: Json | null
          revenue_forecast?: Json | null
          risks?: Json
          top_recommendations?: Json
          workflow_health?: Json | null
        }
        Update: {
          briefing_date?: string
          created_at?: string
          executive_intelligence_score?: number | null
          growth_forecast?: Json | null
          id?: string
          opportunities?: Json
          organization_id?: string
          priority_actions?: Json
          projected_business_impact?: Json | null
          revenue_forecast?: Json | null
          risks?: Json
          top_recommendations?: Json
          workflow_health?: Json | null
        }
        Relationships: []
      }
      alice_knowledge_versions: {
        Row: {
          confidence_score: number | null
          created_at: string
          effective_date: string
          id: string
          performance_impact: number | null
          promoted_at: string | null
          rollback_reason: string | null
          rolled_back_at: string | null
          status: string
          summary: string | null
          training_source: string
          version_number: number
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          effective_date?: string
          id?: string
          performance_impact?: number | null
          promoted_at?: string | null
          rollback_reason?: string | null
          rolled_back_at?: string | null
          status?: string
          summary?: string | null
          training_source: string
          version_number: number
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          effective_date?: string
          id?: string
          performance_impact?: number | null
          promoted_at?: string | null
          rollback_reason?: string | null
          rolled_back_at?: string | null
          status?: string
          summary?: string | null
          training_source?: string
          version_number?: number
        }
        Relationships: []
      }
      alice_memory: {
        Row: {
          content: string
          created_at: string
          embedding_ref: string | null
          id: string
          memory_type: string
          metadata: Json
          organization_id: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding_ref?: string | null
          id?: string
          memory_type: string
          metadata?: Json
          organization_id: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding_ref?: string | null
          id?: string
          memory_type?: string
          metadata?: Json
          organization_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          organization_id: string
          response_framework: Json
          role: Database["public"]["Enums"]["alice_message_role"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          organization_id: string
          response_framework?: Json
          role: Database["public"]["Enums"]["alice_message_role"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          response_framework?: Json
          role?: Database["public"]["Enums"]["alice_message_role"]
        }
        Relationships: [
          {
            foreignKeyName: "alice_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "alice_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alice_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_outcome_records: {
        Row: {
          alice_decision_id: string | null
          attribution_confidence: number
          created_at: string
          days_to_outcome: number | null
          decision_type: string
          feedback_signal: string | null
          id: string
          organization_id: string
          outcome_recorded_at: string | null
          outcome_type: string | null
          patient_external_id: string
          recommended_action: string | null
          revenue_attributed: number
          workflow_execution_id: string | null
        }
        Insert: {
          alice_decision_id?: string | null
          attribution_confidence?: number
          created_at?: string
          days_to_outcome?: number | null
          decision_type: string
          feedback_signal?: string | null
          id?: string
          organization_id: string
          outcome_recorded_at?: string | null
          outcome_type?: string | null
          patient_external_id: string
          recommended_action?: string | null
          revenue_attributed?: number
          workflow_execution_id?: string | null
        }
        Update: {
          alice_decision_id?: string | null
          attribution_confidence?: number
          created_at?: string
          days_to_outcome?: number | null
          decision_type?: string
          feedback_signal?: string | null
          id?: string
          organization_id?: string
          outcome_recorded_at?: string | null
          outcome_type?: string | null
          patient_external_id?: string
          recommended_action?: string | null
          revenue_attributed?: number
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alice_outcome_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_outcomes: {
        Row: {
          alice_decision_id: string | null
          id: string
          impact_value: number
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string
          verified: boolean
        }
        Insert: {
          alice_decision_id?: string | null
          id?: string
          impact_value?: number
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome: string
          verified?: boolean
        }
        Update: {
          alice_decision_id?: string | null
          id?: string
          impact_value?: number
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "alice_outcomes_alice_decision_id_fkey"
            columns: ["alice_decision_id"]
            isOneToOne: false
            referencedRelation: "alice_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alice_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_performance_snapshots: {
        Row: {
          acceptance_rate: number
          avg_confidence: number | null
          created_at: string
          id: string
          intent_score_accuracy: number | null
          learning_signals_processed: number
          organization_id: string
          prediction_accuracy: number | null
          recommendations_accepted: number
          recommendations_generated: number
          recommendations_rejected: number
          revenue_forecast_accuracy: number | null
          snapshot_date: string
          treatment_acceptance_accuracy: number | null
        }
        Insert: {
          acceptance_rate?: number
          avg_confidence?: number | null
          created_at?: string
          id?: string
          intent_score_accuracy?: number | null
          learning_signals_processed?: number
          organization_id: string
          prediction_accuracy?: number | null
          recommendations_accepted?: number
          recommendations_generated?: number
          recommendations_rejected?: number
          revenue_forecast_accuracy?: number | null
          snapshot_date?: string
          treatment_acceptance_accuracy?: number | null
        }
        Update: {
          acceptance_rate?: number
          avg_confidence?: number | null
          created_at?: string
          id?: string
          intent_score_accuracy?: number | null
          learning_signals_processed?: number
          organization_id?: string
          prediction_accuracy?: number | null
          recommendations_accepted?: number
          recommendations_generated?: number
          recommendations_rejected?: number
          revenue_forecast_accuracy?: number | null
          snapshot_date?: string
          treatment_acceptance_accuracy?: number | null
        }
        Relationships: []
      }
      alice_platform_observations: {
        Row: {
          confidence: number
          created_at: string
          domain: string
          id: string
          observation: string
          observation_metadata: Json
          source_path: string[]
        }
        Insert: {
          confidence?: number
          created_at?: string
          domain: string
          id?: string
          observation: string
          observation_metadata?: Json
          source_path?: string[]
        }
        Update: {
          confidence?: number
          created_at?: string
          domain?: string
          id?: string
          observation?: string
          observation_metadata?: Json
          source_path?: string[]
        }
        Relationships: []
      }
      alice_reasoning: {
        Row: {
          alice_decision_id: string | null
          created_at: string
          evidence: Json
          id: string
          metadata: Json
          organization_id: string
          reasoning_step: string
        }
        Insert: {
          alice_decision_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          metadata?: Json
          organization_id: string
          reasoning_step: string
        }
        Update: {
          alice_decision_id?: string | null
          created_at?: string
          evidence?: Json
          id?: string
          metadata?: Json
          organization_id?: string
          reasoning_step?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_reasoning_alice_decision_id_fkey"
            columns: ["alice_decision_id"]
            isOneToOne: false
            referencedRelation: "alice_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alice_reasoning_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_recommendation_feedback: {
        Row: {
          accepted: boolean | null
          accuracy_score: number | null
          adoption_rate_contribution: number | null
          id: string
          impact_score: number | null
          issued_at: string
          organization_id: string
          outcome_recorded: boolean
          outcome_recorded_at: string | null
          outcome_revenue_impact: number | null
          recommendation_id: string | null
          recommendation_type: string | null
          rejected: boolean | null
        }
        Insert: {
          accepted?: boolean | null
          accuracy_score?: number | null
          adoption_rate_contribution?: number | null
          id?: string
          impact_score?: number | null
          issued_at?: string
          organization_id: string
          outcome_recorded?: boolean
          outcome_recorded_at?: string | null
          outcome_revenue_impact?: number | null
          recommendation_id?: string | null
          recommendation_type?: string | null
          rejected?: boolean | null
        }
        Update: {
          accepted?: boolean | null
          accuracy_score?: number | null
          adoption_rate_contribution?: number | null
          id?: string
          impact_score?: number | null
          issued_at?: string
          organization_id?: string
          outcome_recorded?: boolean
          outcome_recorded_at?: string | null
          outcome_revenue_impact?: number | null
          recommendation_id?: string | null
          recommendation_type?: string | null
          rejected?: boolean | null
        }
        Relationships: []
      }
      alice_recommendation_traces: {
        Row: {
          confidence_score: number
          evidence_summary: string
          generated_at: string
          id: string
          organization_id: string | null
          outcome_id: string | null
          recommendation_id: string
          resolved_at: string | null
          source_events: Json
          supporting_metrics: Json
        }
        Insert: {
          confidence_score?: number
          evidence_summary: string
          generated_at?: string
          id?: string
          organization_id?: string | null
          outcome_id?: string | null
          recommendation_id: string
          resolved_at?: string | null
          source_events?: Json
          supporting_metrics?: Json
        }
        Update: {
          confidence_score?: number
          evidence_summary?: string
          generated_at?: string
          id?: string
          organization_id?: string | null
          outcome_id?: string | null
          recommendation_id?: string
          resolved_at?: string | null
          source_events?: Json
          supporting_metrics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "alice_recommendation_traces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_recommendations: {
        Row: {
          alice_decision_id: string | null
          confidence: number
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          recommendation: string
          recommended_action: string
          status: string
        }
        Insert: {
          alice_decision_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          recommendation: string
          recommended_action: string
          status?: string
        }
        Update: {
          alice_decision_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          recommendation?: string
          recommended_action?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "alice_recommendations_alice_decision_id_fkey"
            columns: ["alice_decision_id"]
            isOneToOne: false
            referencedRelation: "alice_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alice_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      alice_refresh_events: {
        Row: {
          created_at: string
          id: string
          knowledge_version: string
          refresh_metadata: Json
          refresh_reason: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          knowledge_version: string
          refresh_metadata?: Json
          refresh_reason: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          knowledge_version?: string
          refresh_metadata?: Json
          refresh_reason?: string
          status?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          attribution: Json
          created_at: string
          destination: string
          event_name: string
          id: string
          lead_id: string | null
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          attribution?: Json
          created_at?: string
          destination?: string
          event_name: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          attribution?: Json
          created_at?: string
          destination?: string
          event_name?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_analytics_events_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      anomaly_validations: {
        Row: {
          anomaly_event_id: string | null
          anomaly_type: string
          created_at: string
          escalation_quality: number
          false_positive: boolean
          id: string
          operational_relevance: number
          organization_id: string
          precision_score: number
          severity: Database["public"]["Enums"]["event_severity"]
          validator_notes: string | null
        }
        Insert: {
          anomaly_event_id?: string | null
          anomaly_type: string
          created_at?: string
          escalation_quality?: number
          false_positive?: boolean
          id?: string
          operational_relevance?: number
          organization_id: string
          precision_score?: number
          severity?: Database["public"]["Enums"]["event_severity"]
          validator_notes?: string | null
        }
        Update: {
          anomaly_event_id?: string | null
          anomaly_type?: string
          created_at?: string
          escalation_quality?: number
          false_positive?: boolean
          id?: string
          operational_relevance?: number
          organization_id?: string
          precision_score?: number
          severity?: Database["public"]["Enums"]["event_severity"]
          validator_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_validations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_attributions: {
        Row: {
          appointment_id: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
        }
        Insert: {
          appointment_id: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Update: {
          appointment_id?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_events: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          created_at: string
          decided_at: string | null
          decision_notes: string | null
          id: string
          organization_id: string
          related_event_id: string | null
          requested_by: string | null
          reviewed_by: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          organization_id: string
          related_event_id?: string | null
          requested_by?: string | null
          reviewed_by?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          created_at?: string
          decided_at?: string | null
          decision_notes?: string | null
          id?: string
          organization_id?: string
          related_event_id?: string | null
          requested_by?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          alice_report: Json | null
          audit_summary: string
          generated_at: string
          id: string
          lead_id: string
          ninety_day_snapshot: Json | null
          organization_id: string | null
          projected_recovery: number
          recommendations: Json
        }
        Insert: {
          alice_report?: Json | null
          audit_summary: string
          generated_at?: string
          id?: string
          lead_id: string
          ninety_day_snapshot?: Json | null
          organization_id?: string | null
          projected_recovery: number
          recommendations?: Json
        }
        Update: {
          alice_report?: Json | null
          audit_summary?: string
          generated_at?: string
          id?: string
          lead_id?: string
          ninety_day_snapshot?: Json | null
          organization_id?: string | null
          projected_recovery?: number
          recommendations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      authority_content_assets: {
        Row: {
          asset_payload: Json
          content_type: string
          created_at: string
          id: string
          organization_id: string | null
          status: string
          target_channel: string
          theme: string
          title: string
        }
        Insert: {
          asset_payload?: Json
          content_type: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          target_channel?: string
          theme: string
          title: string
        }
        Update: {
          asset_payload?: Json
          content_type?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          target_channel?: string
          theme?: string
          title?: string
        }
        Relationships: []
      }
      authorized_domains: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string | null
          status: string
          value: string
          value_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          status?: string
          value: string
          value_type?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          status?: string
          value?: string
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_domains_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_audit_runs: {
        Row: {
          complete_count: number
          coverage_score: number
          critical_gaps: Json
          id: string
          missing_count: number
          organization_id: string
          partial_count: number
          recommendations: Json
          risk_count: number
          run_at: string
          total_blueprints: number
        }
        Insert: {
          complete_count: number
          coverage_score: number
          critical_gaps?: Json
          id?: string
          missing_count: number
          organization_id: string
          partial_count: number
          recommendations?: Json
          risk_count: number
          run_at?: string
          total_blueprints: number
        }
        Update: {
          complete_count?: number
          coverage_score?: number
          critical_gaps?: Json
          id?: string
          missing_count?: number
          organization_id?: string
          partial_count?: number
          recommendations?: Json
          risk_count?: number
          run_at?: string
          total_blueprints?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_audit_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_blueprints: {
        Row: {
          actions: Json
          alice_visibility: Json
          coverage_status: Database["public"]["Enums"]["automation_coverage_status"]
          created_at: string
          domain: Database["public"]["Enums"]["automation_domain_key"]
          emitted_event_types: Json
          id: string
          intelligence_outputs: Json
          name: string
          organization_id: string | null
          purpose: string
          required_controls: Json
          required_pipelines: Json
          triggers: Json
          updated_at: string
        }
        Insert: {
          actions?: Json
          alice_visibility?: Json
          coverage_status?: Database["public"]["Enums"]["automation_coverage_status"]
          created_at?: string
          domain: Database["public"]["Enums"]["automation_domain_key"]
          emitted_event_types?: Json
          id?: string
          intelligence_outputs?: Json
          name: string
          organization_id?: string | null
          purpose: string
          required_controls?: Json
          required_pipelines?: Json
          triggers?: Json
          updated_at?: string
        }
        Update: {
          actions?: Json
          alice_visibility?: Json
          coverage_status?: Database["public"]["Enums"]["automation_coverage_status"]
          created_at?: string
          domain?: Database["public"]["Enums"]["automation_domain_key"]
          emitted_event_types?: Json
          id?: string
          intelligence_outputs?: Json
          name?: string
          organization_id?: string | null
          purpose?: string
          required_controls?: Json
          required_pipelines?: Json
          triggers?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_blueprints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_coverage_results: {
        Row: {
          alice_visibility_score: number
          audit_run_id: string | null
          blueprint_id: string | null
          coverage_status: Database["public"]["Enums"]["automation_coverage_status"]
          created_at: string
          domain: Database["public"]["Enums"]["automation_domain_key"]
          id: string
          missing_controls: Json
          missing_event_types: Json
          missing_pipelines: Json
          name: string
          organization_id: string
          replay_readiness_score: number
          telemetry_score: number
        }
        Insert: {
          alice_visibility_score?: number
          audit_run_id?: string | null
          blueprint_id?: string | null
          coverage_status: Database["public"]["Enums"]["automation_coverage_status"]
          created_at?: string
          domain: Database["public"]["Enums"]["automation_domain_key"]
          id?: string
          missing_controls?: Json
          missing_event_types?: Json
          missing_pipelines?: Json
          name: string
          organization_id: string
          replay_readiness_score?: number
          telemetry_score?: number
        }
        Update: {
          alice_visibility_score?: number
          audit_run_id?: string | null
          blueprint_id?: string | null
          coverage_status?: Database["public"]["Enums"]["automation_coverage_status"]
          created_at?: string
          domain?: Database["public"]["Enums"]["automation_domain_key"]
          id?: string
          missing_controls?: Json
          missing_event_types?: Json
          missing_pipelines?: Json
          name?: string
          organization_id?: string
          replay_readiness_score?: number
          telemetry_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_coverage_results_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "automation_audit_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_coverage_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_dead_letters: {
        Row: {
          created_at: string
          failure_reason: string
          id: string
          payload: Json
          replayable: boolean
          replayed_at: string | null
          trace_id: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          failure_reason: string
          id?: string
          payload?: Json
          replayable?: boolean
          replayed_at?: string | null
          trace_id: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          failure_reason?: string
          id?: string
          payload?: Json
          replayable?: boolean
          replayed_at?: string | null
          trace_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_dead_letters_trace_id_fkey"
            columns: ["trace_id"]
            isOneToOne: false
            referencedRelation: "automation_traces"
            referencedColumns: ["trace_id"]
          },
        ]
      }
      automation_events: {
        Row: {
          action_name: string
          created_at: string
          event_metadata: Json
          id: string
          location_id: string | null
          organization_id: string | null
          outcome: string | null
          practice_id: string | null
          recovery_amount: number
          status: Database["public"]["Enums"]["automation_event_status"]
          success_rate: number | null
          trigger_name: string
          workflow: string
        }
        Insert: {
          action_name: string
          created_at?: string
          event_metadata?: Json
          id?: string
          location_id?: string | null
          organization_id?: string | null
          outcome?: string | null
          practice_id?: string | null
          recovery_amount?: number
          status?: Database["public"]["Enums"]["automation_event_status"]
          success_rate?: number | null
          trigger_name: string
          workflow: string
        }
        Update: {
          action_name?: string
          created_at?: string
          event_metadata?: Json
          id?: string
          location_id?: string | null
          organization_id?: string | null
          outcome?: string | null
          practice_id?: string | null
          recovery_amount?: number
          status?: Database["public"]["Enums"]["automation_event_status"]
          success_rate?: number | null
          trigger_name?: string
          workflow?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_failures: {
        Row: {
          correlation_id: string
          created_at: string
          failure_reason: string
          id: string
          idempotency_key: string
          organization_id: string | null
          payload: Json
          replayable: boolean
          resolved_at: string | null
          workflow_id: string
        }
        Insert: {
          correlation_id: string
          created_at?: string
          failure_reason: string
          id?: string
          idempotency_key: string
          organization_id?: string | null
          payload?: Json
          replayable?: boolean
          resolved_at?: string | null
          workflow_id: string
        }
        Update: {
          correlation_id?: string
          created_at?: string
          failure_reason?: string
          id?: string
          idempotency_key?: string
          organization_id?: string | null
          payload?: Json
          replayable?: boolean
          resolved_at?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_failures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_queue: {
        Row: {
          attempt_count: number
          automation_event_id: string | null
          completed_at: string | null
          correlation_id: string
          dead_lettered_at: string | null
          id: string
          idempotency_key: string
          max_attempts: number
          next_retry_at: string | null
          organization_id: string | null
          payload: Json
          processing_started_at: string | null
          queued_at: string
          status: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          attempt_count?: number
          automation_event_id?: string | null
          completed_at?: string | null
          correlation_id: string
          dead_lettered_at?: string | null
          id?: string
          idempotency_key: string
          max_attempts?: number
          next_retry_at?: string | null
          organization_id?: string | null
          payload?: Json
          processing_started_at?: string | null
          queued_at?: string
          status?: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          attempt_count?: number
          automation_event_id?: string | null
          completed_at?: string | null
          correlation_id?: string
          dead_lettered_at?: string | null
          id?: string
          idempotency_key?: string
          max_attempts?: number
          next_retry_at?: string | null
          organization_id?: string | null
          payload?: Json
          processing_started_at?: string | null
          queued_at?: string
          status?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_registry: {
        Row: {
          category: string
          configuration: Json
          created_at: string
          description: string
          id: string
          name: string
          organization_id: string
          owner: string
          runtime_id: string
          status: string
          trigger: string
          updated_at: string
          version: string
          workflow_id: string
        }
        Insert: {
          category: string
          configuration?: Json
          created_at?: string
          description: string
          id?: string
          name: string
          organization_id: string
          owner?: string
          runtime_id: string
          status?: string
          trigger: string
          updated_at?: string
          version?: string
          workflow_id: string
        }
        Update: {
          category?: string
          configuration?: Json
          created_at?: string
          description?: string
          id?: string
          name?: string
          organization_id?: string
          owner?: string
          runtime_id?: string
          status?: string
          trigger?: string
          updated_at?: string
          version?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_trace_events: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json
          stage: string
          status: Database["public"]["Enums"]["automation_trace_stage_status"]
          trace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          stage: string
          status: Database["public"]["Enums"]["automation_trace_stage_status"]
          trace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          stage?: string
          status?: Database["public"]["Enums"]["automation_trace_stage_status"]
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_trace_events_trace_id_fkey"
            columns: ["trace_id"]
            isOneToOne: false
            referencedRelation: "automation_traces"
            referencedColumns: ["trace_id"]
          },
        ]
      }
      automation_traces: {
        Row: {
          completed_at: string | null
          correlation_id: string
          domain: string
          event_name: string
          failure_category:
            | Database["public"]["Enums"]["automation_failure_category"]
            | null
          failure_reason: string | null
          id: string
          latency_ms: number | null
          metadata: Json
          organization_id: string
          retry_count: number
          started_at: string
          status: Database["public"]["Enums"]["automation_trace_status"]
          trace_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string
          domain: string
          event_name: string
          failure_category?:
            | Database["public"]["Enums"]["automation_failure_category"]
            | null
          failure_reason?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          organization_id: string
          retry_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["automation_trace_status"]
          trace_id?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          domain?: string
          event_name?: string
          failure_category?:
            | Database["public"]["Enums"]["automation_failure_category"]
            | null
          failure_reason?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json
          organization_id?: string
          retry_count?: number
          started_at?: string
          status?: Database["public"]["Enums"]["automation_trace_status"]
          trace_id?: string
          workflow_id?: string
        }
        Relationships: []
      }
      autonomous_recovery_actions: {
        Row: {
          action_key: string
          action_name: string
          approval_required: boolean
          confidence: number
          created_at: string
          executed_at: string | null
          id: string
          organization_id: string
          result_payload: Json
          risk_level: Database["public"]["Enums"]["runtime_action_risk"]
          rollback_safe: boolean
          simulation: Json
          status: string
          trace_id: string | null
        }
        Insert: {
          action_key: string
          action_name: string
          approval_required?: boolean
          confidence?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          organization_id: string
          result_payload?: Json
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          rollback_safe?: boolean
          simulation?: Json
          status?: string
          trace_id?: string | null
        }
        Update: {
          action_key?: string
          action_name?: string
          approval_required?: boolean
          confidence?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          organization_id?: string
          result_payload?: Json
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          rollback_safe?: boolean
          simulation?: Json
          status?: string
          trace_id?: string | null
        }
        Relationships: []
      }
      behavioral_signals: {
        Row: {
          attention_score: number
          created_at: string
          id: string
          membership_eligibility: boolean
          organization_id: string
          patient_external_id: string | null
          recommended_next_action: string | null
          relationship_score: number
          retention_risk: number
          signal_strength: number
          signal_type: string
          source_event_id: string | null
        }
        Insert: {
          attention_score?: number
          created_at?: string
          id?: string
          membership_eligibility?: boolean
          organization_id: string
          patient_external_id?: string | null
          recommended_next_action?: string | null
          relationship_score?: number
          retention_risk?: number
          signal_strength?: number
          signal_type: string
          source_event_id?: string | null
        }
        Update: {
          attention_score?: number
          created_at?: string
          id?: string
          membership_eligibility?: boolean
          organization_id?: string
          patient_external_id?: string | null
          recommended_next_action?: string | null
          relationship_score?: number
          retention_risk?: number
          signal_strength?: number
          signal_type?: string
          source_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_signals_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "video_engagement_events"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmark_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      benchmark_snapshots: {
        Row: {
          admin_efficiency_p50: number
          benchmark_date: string
          cohort: string
          created_at: string
          id: string
          location_id: string | null
          no_show_rate_p50: number
          organization_id: string | null
          percentile_rankings: Json
          recall_recovery_p50: number
          review_conversion_p50: number
        }
        Insert: {
          admin_efficiency_p50?: number
          benchmark_date: string
          cohort: string
          created_at?: string
          id?: string
          location_id?: string | null
          no_show_rate_p50?: number
          organization_id?: string | null
          percentile_rankings?: Json
          recall_recovery_p50?: number
          review_conversion_p50?: number
        }
        Update: {
          admin_efficiency_p50?: number
          benchmark_date?: string
          cohort?: string
          created_at?: string
          id?: string
          location_id?: string | null
          no_show_rate_p50?: number
          organization_id?: string | null
          percentile_rankings?: Json
          recall_recovery_p50?: number
          review_conversion_p50?: number
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_snapshots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmark_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          client_account_id: string | null
          created_at: string | null
          current_period_end: string | null
          email: string
          id: string
          metadata: Json | null
          name: string | null
          organization_id: string | null
          stripe_customer_id: string
          stripe_subscription_id: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          client_account_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email: string
          id?: string
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_account_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email?: string
          id?: string
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_billing_customers_client_account_id"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          event_type: string
          id: string
          organization_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string
          status: string
        }
        Insert: {
          event_type: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id: string
          received_at?: string
          status?: string
        }
        Update: {
          event_type?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          assessment_id: string | null
          booking_status: Database["public"]["Enums"]["booking_status"]
          calendly_event_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string | null
          scheduled_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          calendly_event_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          scheduled_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          booking_status?: Database["public"]["Enums"]["booking_status"]
          calendly_event_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string | null
          scheduled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_attributions: {
        Row: {
          campaign_id: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
        }
        Insert: {
          campaign_id: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Update: {
          campaign_id?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies_public: {
        Row: {
          challenge: string
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          organization_id: string | null
          practice_size: string | null
          practice_type: string | null
          recall_rate_improvement: number | null
          result_summary: string
          revenue_recovered: number | null
          slug: string | null
          solution: string
          sort_order: number
          timeframe_weeks: number | null
          title: string
          treatment_acceptance_improvement: number | null
          updated_at: string
        }
        Insert: {
          challenge: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id?: string | null
          practice_size?: string | null
          practice_type?: string | null
          recall_rate_improvement?: number | null
          result_summary: string
          revenue_recovered?: number | null
          slug?: string | null
          solution: string
          sort_order?: number
          timeframe_weeks?: number | null
          title: string
          treatment_acceptance_improvement?: number | null
          updated_at?: string
        }
        Update: {
          challenge?: string
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id?: string | null
          practice_size?: string | null
          practice_type?: string | null
          recall_rate_improvement?: number | null
          result_summary?: string
          revenue_recovered?: number | null
          slug?: string | null
          solution?: string
          sort_order?: number
          timeframe_weeks?: number | null
          title?: string
          treatment_acceptance_improvement?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_studies_public_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      case_study_results: {
        Row: {
          admin_hours_saved: number
          after_metrics: Json
          before_metrics: Json
          client_name: string
          created_at: string
          id: string
          no_show_reduction: number
          organization_id: string
          recall_patients_recovered: number
          recovered_revenue: number
          reviews_generated: number
          status: string
          testimonial_prompt: string | null
        }
        Insert: {
          admin_hours_saved?: number
          after_metrics?: Json
          before_metrics?: Json
          client_name: string
          created_at?: string
          id?: string
          no_show_reduction?: number
          organization_id: string
          recall_patients_recovered?: number
          recovered_revenue?: number
          reviews_generated?: number
          status?: string
          testimonial_prompt?: string | null
        }
        Update: {
          admin_hours_saved?: number
          after_metrics?: Json
          before_metrics?: Json
          client_name?: string
          created_at?: string
          id?: string
          no_show_reduction?: number
          organization_id?: string
          recall_patients_recovered?: number
          recovered_revenue?: number
          reviews_generated?: number
          status?: string
          testimonial_prompt?: string | null
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          approved_at: string | null
          client_commercial_control_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          quoted_amount: number
          request_scope: string
          request_title: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          quoted_amount?: number
          request_scope: string
          request_title: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          quoted_amount?: number
          request_scope?: string
          request_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_client_commercial_control_id_fkey"
            columns: ["client_commercial_control_id"]
            isOneToOne: false
            referencedRelation: "client_commercial_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_scores: {
        Row: {
          churn_reason: string | null
          churn_score: number
          id: string
          measured_at: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          churn_reason?: string | null
          churn_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          churn_reason?: string | null
          churn_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "churn_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_registry: {
        Row: {
          certification_status: string
          claim: string
          evidence_required: Json
          feature: string
          id: string
          organization_id: string | null
          owner: string
          public_allowed: boolean
          updated_at: string
        }
        Insert: {
          certification_status?: string
          claim: string
          evidence_required?: Json
          feature: string
          id?: string
          organization_id?: string | null
          owner?: string
          public_allowed?: boolean
          updated_at?: string
        }
        Update: {
          certification_status?: string
          claim?: string
          evidence_required?: Json
          feature?: string
          id?: string
          organization_id?: string | null
          owner?: string
          public_allowed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_registry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_for_access: boolean
          contract_signed: boolean
          created_at: string
          email: string
          full_name: string | null
          id: string
          implementation_started: boolean
          invitation_sent_at: string | null
          metadata: Json
          organization_id: string | null
          package_type: string
          practice_name: string | null
          revoked_at: string | null
          setup_fee_paid: boolean
          status: string
          subscription_active: boolean
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_for_access?: boolean
          contract_signed?: boolean
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          implementation_started?: boolean
          invitation_sent_at?: string | null
          metadata?: Json
          organization_id?: string | null
          package_type?: string
          practice_name?: string | null
          revoked_at?: string | null
          setup_fee_paid?: boolean
          status?: string
          subscription_active?: boolean
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_for_access?: boolean
          contract_signed?: boolean
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          implementation_started?: boolean
          invitation_sent_at?: string | null
          metadata?: Json
          organization_id?: string | null
          package_type?: string
          practice_name?: string | null
          revoked_at?: string | null
          setup_fee_paid?: boolean
          status?: string
          subscription_active?: boolean
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_commercial_controls: {
        Row: {
          billing_entity: string
          brand: string
          client_id: string | null
          contract_entity: string
          contract_id: string | null
          contract_value: number
          created_at: string
          expansion_potential: number
          go_live_status: string
          health_score: number
          id: string
          implementation_project_id: string | null
          implementation_status: string
          legal_entity: string
          metadata: Json
          monthly_revenue: number
          organization_id: string
          package_key: string
          payment_recipient: string
          payment_status: string
          renewal_date: string | null
          risk_status: string
          scope_status: string
          tax_entity: string
          updated_at: string
        }
        Insert: {
          billing_entity?: string
          brand?: string
          client_id?: string | null
          contract_entity?: string
          contract_id?: string | null
          contract_value?: number
          created_at?: string
          expansion_potential?: number
          go_live_status?: string
          health_score?: number
          id?: string
          implementation_project_id?: string | null
          implementation_status?: string
          legal_entity?: string
          metadata?: Json
          monthly_revenue?: number
          organization_id: string
          package_key: string
          payment_recipient?: string
          payment_status?: string
          renewal_date?: string | null
          risk_status?: string
          scope_status?: string
          tax_entity?: string
          updated_at?: string
        }
        Update: {
          billing_entity?: string
          brand?: string
          client_id?: string | null
          contract_entity?: string
          contract_id?: string | null
          contract_value?: number
          created_at?: string
          expansion_potential?: number
          go_live_status?: string
          health_score?: number
          id?: string
          implementation_project_id?: string | null
          implementation_status?: string
          legal_entity?: string
          metadata?: Json
          monthly_revenue?: number
          organization_id?: string
          package_key?: string
          payment_recipient?: string
          payment_status?: string
          renewal_date?: string | null
          risk_status?: string
          scope_status?: string
          tax_entity?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_commercial_controls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_commercial_controls_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_commercial_controls_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_commercial_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_rollups: {
        Row: {
          adoption_score: number
          automation_usage_score: number
          expansion_score: number
          health_score: number
          id: string
          implementation_project_id: string | null
          measured_at: string
          metadata: Json
          organization_id: string
          revenue_growth_score: number
          risk_score: number
          support_activity_score: number
        }
        Insert: {
          adoption_score?: number
          automation_usage_score?: number
          expansion_score?: number
          health_score?: number
          id?: string
          implementation_project_id?: string | null
          measured_at?: string
          metadata?: Json
          organization_id: string
          revenue_growth_score?: number
          risk_score?: number
          support_activity_score?: number
        }
        Update: {
          adoption_score?: number
          automation_usage_score?: number
          expansion_score?: number
          health_score?: number
          id?: string
          implementation_project_id?: string | null
          measured_at?: string
          metadata?: Json
          organization_id?: string
          revenue_growth_score?: number
          risk_score?: number
          support_activity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_health_rollups_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_rollups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_scores: {
        Row: {
          communication_health_score: number
          created_at: string
          health_tier: string
          id: string
          journey_completion_score: number
          measured_at: string
          organization_id: string
          overall_score: number
          patient_engagement_score: number
          provider_adoption_score: number
          revenue_attribution_score: number
          score_date: string
          top_opportunity: string | null
          top_risk: string | null
          usage_score: number
        }
        Insert: {
          communication_health_score?: number
          created_at?: string
          health_tier?: string
          id?: string
          journey_completion_score?: number
          measured_at?: string
          organization_id: string
          overall_score?: number
          patient_engagement_score?: number
          provider_adoption_score?: number
          revenue_attribution_score?: number
          score_date?: string
          top_opportunity?: string | null
          top_risk?: string | null
          usage_score?: number
        }
        Update: {
          communication_health_score?: number
          created_at?: string
          health_tier?: string
          id?: string
          journey_completion_score?: number
          measured_at?: string
          organization_id?: string
          overall_score?: number
          patient_engagement_score?: number
          provider_adoption_score?: number
          revenue_attribution_score?: number
          score_date?: string
          top_opportunity?: string | null
          top_risk?: string | null
          usage_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_health_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_offboarding_checklists: {
        Row: {
          checklist_complete: boolean
          client_commercial_control_id: string | null
          completed_at: string | null
          created_at: string
          export_package_generated: boolean
          id: string
          metadata: Json
          notice_received: boolean
          offboarding_status: string
          organization_id: string
          outstanding_balance_paid: boolean
        }
        Insert: {
          checklist_complete?: boolean
          client_commercial_control_id?: string | null
          completed_at?: string | null
          created_at?: string
          export_package_generated?: boolean
          id?: string
          metadata?: Json
          notice_received?: boolean
          offboarding_status?: string
          organization_id: string
          outstanding_balance_paid?: boolean
        }
        Update: {
          checklist_complete?: boolean
          client_commercial_control_id?: string | null
          completed_at?: string | null
          created_at?: string
          export_package_generated?: boolean
          id?: string
          metadata?: Json
          notice_received?: boolean
          offboarding_status?: string
          organization_id?: string
          outstanding_balance_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_offboarding_checklists_client_commercial_control_id_fkey"
            columns: ["client_commercial_control_id"]
            isOneToOne: false
            referencedRelation: "client_commercial_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_offboarding_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_items: {
        Row: {
          category: string
          certification_gate: string | null
          completed_at: string | null
          created_at: string
          due_date: string | null
          evidence_record_id: string | null
          evidence_status: string
          evidence_type: string | null
          go_live_requirement: boolean
          id: string
          implementation_project_id: string | null
          implementation_task_id: string | null
          item_key: string
          label: string
          metadata: Json
          organization_id: string
          owner: string | null
          owner_role: string
          required: boolean
          section: string
          sort_order: number
          stage: string
          status: string
        }
        Insert: {
          category: string
          certification_gate?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          implementation_project_id?: string | null
          implementation_task_id?: string | null
          item_key: string
          label: string
          metadata?: Json
          organization_id: string
          owner?: string | null
          owner_role?: string
          required?: boolean
          section?: string
          sort_order?: number
          stage?: string
          status?: string
        }
        Update: {
          category?: string
          certification_gate?: string | null
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          implementation_project_id?: string | null
          implementation_task_id?: string | null
          item_key?: string
          label?: string
          metadata?: Json
          organization_id?: string
          owner?: string | null
          owner_role?: string
          required?: boolean
          section?: string
          sort_order?: number
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_items_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_items_implementation_task_id_fkey"
            columns: ["implementation_task_id"]
            isOneToOne: false
            referencedRelation: "implementation_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_onboarding_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_playbooks: {
        Row: {
          baseline_scores: Json
          client_name: string
          created_at: string
          id: string
          implementation_roadmap: Json
          launch_checklist: Json
          organization_id: string
          pms_assessment: Json
          progress: number
          status: string
          updated_at: string
        }
        Insert: {
          baseline_scores?: Json
          client_name: string
          created_at?: string
          id?: string
          implementation_roadmap?: Json
          launch_checklist?: Json
          organization_id: string
          pms_assessment?: Json
          progress?: number
          status?: string
          updated_at?: string
        }
        Update: {
          baseline_scores?: Json
          client_name?: string
          created_at?: string
          id?: string
          implementation_roadmap?: Json
          launch_checklist?: Json
          organization_id?: string
          pms_assessment?: Json
          progress?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_operating_playbook_items: {
        Row: {
          completion_timestamp: string | null
          created_at: string
          due_date: string | null
          evidence_record_id: string | null
          evidence_status: string
          evidence_type: string | null
          feeds_agency_crm: boolean
          feeds_customer_success: boolean
          feeds_evidence_os: boolean
          feeds_executive: boolean
          feeds_mission_control: boolean
          id: string
          implementation_project_id: string | null
          item_key: string
          label: string
          metadata: Json
          organization_id: string
          owner: string | null
          owner_role: string
          playbook_key: string
          section: string
          sort_order: number
          stage: string
          status: string
        }
        Insert: {
          completion_timestamp?: string | null
          created_at?: string
          due_date?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          feeds_agency_crm?: boolean
          feeds_customer_success?: boolean
          feeds_evidence_os?: boolean
          feeds_executive?: boolean
          feeds_mission_control?: boolean
          id?: string
          implementation_project_id?: string | null
          item_key: string
          label: string
          metadata?: Json
          organization_id: string
          owner?: string | null
          owner_role?: string
          playbook_key: string
          section: string
          sort_order?: number
          stage: string
          status?: string
        }
        Update: {
          completion_timestamp?: string | null
          created_at?: string
          due_date?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          feeds_agency_crm?: boolean
          feeds_customer_success?: boolean
          feeds_evidence_os?: boolean
          feeds_executive?: boolean
          feeds_mission_control?: boolean
          id?: string
          implementation_project_id?: string | null
          item_key?: string
          label?: string
          metadata?: Json
          organization_id?: string
          owner?: string | null
          owner_role?: string
          playbook_key?: string
          section?: string
          sort_order?: number
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_operating_playbook_items_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_operating_playbook_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_operating_playbook_templates: {
        Row: {
          cadence: string
          created_at: string
          id: string
          lifecycle_stage: string
          metadata: Json
          objective: string
          organization_id: string
          playbook_key: string
          playbook_name: string
          required_destinations: string[]
          success_metrics: string[]
        }
        Insert: {
          cadence: string
          created_at?: string
          id?: string
          lifecycle_stage: string
          metadata?: Json
          objective: string
          organization_id: string
          playbook_key: string
          playbook_name: string
          required_destinations?: string[]
          success_metrics?: string[]
        }
        Update: {
          cadence?: string
          created_at?: string
          id?: string
          lifecycle_stage?: string
          metadata?: Json
          objective?: string
          organization_id?: string
          playbook_key?: string
          playbook_name?: string
          required_destinations?: string[]
          success_metrics?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "client_operating_playbook_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payment_milestones: {
        Row: {
          amount: number
          blocked_reason: string | null
          client_commercial_control_id: string | null
          created_at: string
          due_date: string | null
          gate_key: string
          gate_name: string
          id: string
          invoice_id: string | null
          metadata: Json
          organization_id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount?: number
          blocked_reason?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          due_date?: string | null
          gate_key: string
          gate_name: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          organization_id: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          blocked_reason?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          due_date?: string | null
          gate_key?: string
          gate_name?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          organization_id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_milestones_client_commercial_control_id_fkey"
            columns: ["client_commercial_control_id"]
            isOneToOne: false
            referencedRelation: "client_commercial_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_milestones_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_slas: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          recovery_minutes: number
          resolution_minutes: number
          response_minutes: number
          sla_type: string
          status: string
          target_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          recovery_minutes?: number
          resolution_minutes?: number
          response_minutes?: number
          sla_type: string
          status?: string
          target_percent?: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          recovery_minutes?: number
          resolution_minutes?: number
          response_minutes?: number
          sla_type?: string
          status?: string
          target_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_slas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_success_accounts: {
        Row: {
          adoption_score: number
          client_name: string
          created_at: string
          expansion_score: number
          health_score: number
          id: string
          next_check_in_at: string | null
          organization_id: string
          qbr_due_at: string | null
          retention_score: number
          status: Database["public"]["Enums"]["client_success_status"]
          updated_at: string
        }
        Insert: {
          adoption_score?: number
          client_name: string
          created_at?: string
          expansion_score?: number
          health_score?: number
          id?: string
          next_check_in_at?: string | null
          organization_id: string
          qbr_due_at?: string | null
          retention_score?: number
          status?: Database["public"]["Enums"]["client_success_status"]
          updated_at?: string
        }
        Update: {
          adoption_score?: number
          client_name?: string
          created_at?: string
          expansion_score?: number
          health_score?: number
          id?: string
          next_check_in_at?: string | null
          organization_id?: string
          qbr_due_at?: string | null
          retention_score?: number
          status?: Database["public"]["Enums"]["client_success_status"]
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          arr: number
          created_at: string
          id: string
          metadata: Json
          mrr: number
          name: string
          organization_id: string
          status: string
        }
        Insert: {
          arr?: number
          created_at?: string
          id?: string
          metadata?: Json
          mrr?: number
          name: string
          organization_id: string
          status?: string
        }
        Update: {
          arr?: number
          created_at?: string
          id?: string
          metadata?: Json
          mrr?: number
          name?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_contracts: {
        Row: {
          activated_at: string | null
          cancelled_at: string | null
          contact_email: string | null
          contract_start_date: string | null
          contract_status: string
          contract_term_months: number
          created_at: string
          id: string
          monthly_mrr: number
          organization_id: string | null
          package_key: string | null
          pipeline_entry_id: string | null
          practice_name: string
          proposal_id: string | null
          setup_fee: number
          signed_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contract_start_date?: string | null
          contract_status?: string
          contract_term_months?: number
          created_at?: string
          id?: string
          monthly_mrr: number
          organization_id?: string | null
          package_key?: string | null
          pipeline_entry_id?: string | null
          practice_name: string
          proposal_id?: string | null
          setup_fee?: number
          signed_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contract_start_date?: string | null
          contract_status?: string
          contract_term_months?: number
          created_at?: string
          id?: string
          monthly_mrr?: number
          organization_id?: string | null
          package_key?: string | null
          pipeline_entry_id?: string | null
          practice_name?: string
          proposal_id?: string | null
          setup_fee?: number
          signed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_contracts_package_key_fkey"
            columns: ["package_key"]
            isOneToOne: false
            referencedRelation: "commercial_packages"
            referencedColumns: ["package_key"]
          },
          {
            foreignKeyName: "commercial_contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "commercial_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_packages: {
        Row: {
          active: boolean
          annual_price: number | null
          billing_entity: string
          brand: string
          client_responsibilities: string[]
          contract_entity: string
          created_at: string
          deliverables: Json
          id: string
          included_features: Json
          ip_ownership_clause: string
          is_active: boolean
          legal_entity: string
          metadata: Json
          monthly_fee: number
          monthly_price: number
          name: string | null
          organization_id: string | null
          package_key: string
          package_name: string
          payment_recipient: string
          payment_schedule: Json
          setup_fee: number
          sla: string
          stripe_product_keys: Json
          subscription_license_clause: string
          success_criteria: string[]
          tax_entity: string
          tier_order: number
        }
        Insert: {
          active?: boolean
          annual_price?: number | null
          billing_entity?: string
          brand?: string
          client_responsibilities?: string[]
          contract_entity?: string
          created_at?: string
          deliverables?: Json
          id?: string
          included_features?: Json
          ip_ownership_clause?: string
          is_active?: boolean
          legal_entity?: string
          metadata?: Json
          monthly_fee?: number
          monthly_price: number
          name?: string | null
          organization_id?: string | null
          package_key: string
          package_name: string
          payment_recipient?: string
          payment_schedule?: Json
          setup_fee?: number
          sla?: string
          stripe_product_keys?: Json
          subscription_license_clause?: string
          success_criteria?: string[]
          tax_entity?: string
          tier_order?: number
        }
        Update: {
          active?: boolean
          annual_price?: number | null
          billing_entity?: string
          brand?: string
          client_responsibilities?: string[]
          contract_entity?: string
          created_at?: string
          deliverables?: Json
          id?: string
          included_features?: Json
          ip_ownership_clause?: string
          is_active?: boolean
          legal_entity?: string
          metadata?: Json
          monthly_fee?: number
          monthly_price?: number
          name?: string | null
          organization_id?: string | null
          package_key?: string
          package_name?: string
          payment_recipient?: string
          payment_schedule?: Json
          setup_fee?: number
          sla?: string
          stripe_product_keys?: Json
          subscription_license_clause?: string
          success_criteria?: string[]
          tax_entity?: string
          tier_order?: number
        }
        Relationships: []
      }
      commercial_payment_gates: {
        Row: {
          billable: boolean
          commercial_package_id: string | null
          created_at: string
          gate_key: string
          gate_name: string
          id: string
          metadata: Json
          organization_id: string
          percentage: number
          required_criteria: string[]
          trigger_event: string
        }
        Insert: {
          billable?: boolean
          commercial_package_id?: string | null
          created_at?: string
          gate_key: string
          gate_name: string
          id?: string
          metadata?: Json
          organization_id: string
          percentage?: number
          required_criteria?: string[]
          trigger_event: string
        }
        Update: {
          billable?: boolean
          commercial_package_id?: string | null
          created_at?: string
          gate_key?: string
          gate_name?: string
          id?: string
          metadata?: Json
          organization_id?: string
          percentage?: number
          required_criteria?: string[]
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_payment_gates_commercial_package_id_fkey"
            columns: ["commercial_package_id"]
            isOneToOne: false
            referencedRelation: "commercial_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_payment_gates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_proposals: {
        Row: {
          accepted_at: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          current_state_analysis: Json | null
          expires_at: string | null
          id: string
          implementation_timeline: Json | null
          monthly_mrr: number | null
          notes: string | null
          organization_id: string | null
          pipeline_entry_id: string | null
          practice_name: string
          pricing_summary: Json | null
          recommended_package_key: string | null
          revenue_opportunity_summary: Json | null
          roi_projection: Json | null
          sent_at: string | null
          status: string
          total_setup_fee: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          current_state_analysis?: Json | null
          expires_at?: string | null
          id?: string
          implementation_timeline?: Json | null
          monthly_mrr?: number | null
          notes?: string | null
          organization_id?: string | null
          pipeline_entry_id?: string | null
          practice_name: string
          pricing_summary?: Json | null
          recommended_package_key?: string | null
          revenue_opportunity_summary?: Json | null
          roi_projection?: Json | null
          sent_at?: string | null
          status?: string
          total_setup_fee?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          current_state_analysis?: Json | null
          expires_at?: string | null
          id?: string
          implementation_timeline?: Json | null
          monthly_mrr?: number | null
          notes?: string | null
          organization_id?: string | null
          pipeline_entry_id?: string | null
          practice_name?: string
          pricing_summary?: Json | null
          recommended_package_key?: string | null
          revenue_opportunity_summary?: Json | null
          roi_projection?: Json | null
          sent_at?: string | null
          status?: string
          total_setup_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_proposals_recommended_package_key_fkey"
            columns: ["recommended_package_key"]
            isOneToOne: false
            referencedRelation: "commercial_packages"
            referencedColumns: ["package_key"]
          },
        ]
      }
      commercial_subscriptions: {
        Row: {
          activated_at: string | null
          cancelled_at: string | null
          churn_reason: string | null
          contract_id: string | null
          created_at: string
          health_score: number | null
          id: string
          last_payment_at: string | null
          monthly_mrr: number
          next_billing_date: string | null
          organization_id: string
          package_key: string | null
          status: string
          trial_started_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          cancelled_at?: string | null
          churn_reason?: string | null
          contract_id?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          last_payment_at?: string | null
          monthly_mrr: number
          next_billing_date?: string | null
          organization_id: string
          package_key?: string | null
          status?: string
          trial_started_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          cancelled_at?: string | null
          churn_reason?: string | null
          contract_id?: string | null
          created_at?: string
          health_score?: number | null
          id?: string
          last_payment_at?: string | null
          monthly_mrr?: number
          next_billing_date?: string | null
          organization_id?: string
          package_key?: string | null
          status?: string
          trial_started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_subscriptions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "commercial_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_subscriptions_package_key_fkey"
            columns: ["package_key"]
            isOneToOne: false
            referencedRelation: "commercial_packages"
            referencedColumns: ["package_key"]
          },
        ]
      }
      compliance_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      confidence_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      connector_certifications: {
        Row: {
          certification_status: string
          certified_at: string | null
          connection_test: boolean
          connector: string
          evidence: Json
          id: string
          organization_id: string | null
          read_test: boolean
          rollback_test: boolean
          tenant: string
          updated_at: string
          write_test: boolean
        }
        Insert: {
          certification_status?: string
          certified_at?: string | null
          connection_test?: boolean
          connector: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          read_test?: boolean
          rollback_test?: boolean
          tenant: string
          updated_at?: string
          write_test?: boolean
        }
        Update: {
          certification_status?: string
          certified_at?: string | null
          connection_test?: boolean
          connector?: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          read_test?: boolean
          rollback_test?: boolean
          tenant?: string
          updated_at?: string
          write_test?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "connector_certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string | null
          contract_status: string
          contract_value: number
          created_at: string
          end_date: string | null
          id: string
          metadata: Json
          organization_id: string
          start_date: string | null
        }
        Insert: {
          client_id?: string | null
          contract_status?: string
          contract_value?: number
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          start_date?: string | null
        }
        Update: {
          client_id?: string | null
          contract_status?: string
          contract_value?: number
          created_at?: string
          end_date?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_profiles: {
        Row: {
          best_cta: string | null
          best_timing: string | null
          confidence_score: number
          expected_revenue_impact: number
          id: string
          metadata: Json
          organization_id: string
          patient_external_id: string | null
          preferred_channel: string | null
          profile_type: string
          readiness_score: number
          updated_at: string
        }
        Insert: {
          best_cta?: string | null
          best_timing?: string | null
          confidence_score?: number
          expected_revenue_impact?: number
          id?: string
          metadata?: Json
          organization_id: string
          patient_external_id?: string | null
          preferred_channel?: string | null
          profile_type: string
          readiness_score?: number
          updated_at?: string
        }
        Update: {
          best_cta?: string | null
          best_timing?: string | null
          confidence_score?: number
          expected_revenue_impact?: number
          id?: string
          metadata?: Json
          organization_id?: string
          patient_external_id?: string | null
          preferred_channel?: string | null
          profile_type?: string
          readiness_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cta_events: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          metadata: Json | null
          page: string | null
          referrer: string | null
          session_id: string | null
          source: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          page?: string | null
          referrer?: string | null
          session_id?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      customer_success_reviews: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          implementation_project_id: string | null
          metadata: Json
          organization_id: string
          review_type: string
          scheduled_at: string
          status: string
          summary: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          organization_id: string
          review_type: string
          scheduled_at: string
          status?: string
          summary?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          organization_id?: string
          review_type?: string
          scheduled_at?: string
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_success_reviews_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_success_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_events: {
        Row: {
          detail: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          system_failure_id: string | null
          trace_id: string | null
        }
        Insert: {
          detail?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          system_failure_id?: string | null
          trace_id?: string | null
        }
        Update: {
          detail?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          system_failure_id?: string | null
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debug_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debug_events_system_failure_id_fkey"
            columns: ["system_failure_id"]
            isOneToOne: false
            referencedRelation: "system_failures"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_journeys: {
        Row: {
          alice_strategy: Json
          created_at: string
          id: string
          journey_key: string
          journey_type: string
          lifecycle_stage: string
          name: string
          objective: string
          organization_id: string
          status: string
          updated_at: string
          video_campaign_id: string | null
        }
        Insert: {
          alice_strategy?: Json
          created_at?: string
          id?: string
          journey_key: string
          journey_type?: string
          lifecycle_stage: string
          name: string
          objective: string
          organization_id: string
          status?: string
          updated_at?: string
          video_campaign_id?: string | null
        }
        Update: {
          alice_strategy?: Json
          created_at?: string
          id?: string
          journey_key?: string
          journey_type?: string
          lifecycle_stage?: string
          name?: string
          objective?: string
          organization_id?: string
          status?: string
          updated_at?: string
          video_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_journeys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_journeys_video_campaign_id_fkey"
            columns: ["video_campaign_id"]
            isOneToOne: false
            referencedRelation: "video_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_twin_forecast_accuracy: {
        Row: {
          accuracy_score: number | null
          actual_value: number | null
          forecast_date: string
          horizon_days: number
          id: string
          organization_id: string
          predicted_value: number
          recorded_at: string | null
          twin_type: string
          variance_pct: number | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: number | null
          forecast_date: string
          horizon_days: number
          id?: string
          organization_id: string
          predicted_value: number
          recorded_at?: string | null
          twin_type: string
          variance_pct?: number | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: number | null
          forecast_date?: string
          horizon_days?: number
          id?: string
          organization_id?: string
          predicted_value?: number
          recorded_at?: string | null
          twin_type?: string
          variance_pct?: number | null
        }
        Relationships: []
      }
      digital_twin_simulations: {
        Row: {
          confidence_score: number | null
          created_at: string
          horizon_days: number
          id: string
          input_parameters: Json
          organization_id: string
          projected_impact: Json
          simulation_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          horizon_days?: number
          id?: string
          input_parameters: Json
          organization_id: string
          projected_impact: Json
          simulation_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          horizon_days?: number
          id?: string
          input_parameters?: Json
          organization_id?: string
          projected_impact?: Json
          simulation_type?: string
        }
        Relationships: []
      }
      digital_twin_snapshots: {
        Row: {
          confidence_score: number | null
          created_at: string
          current_state: Json
          data_freshness_minutes: number | null
          forecast_state: Json
          id: string
          organization_id: string
          simulation_inputs: Json | null
          simulation_outputs: Json | null
          snapshot_date: string
          twin_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          current_state?: Json
          data_freshness_minutes?: number | null
          forecast_state?: Json
          id?: string
          organization_id: string
          simulation_inputs?: Json | null
          simulation_outputs?: Json | null
          snapshot_date?: string
          twin_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          current_state?: Json
          data_freshness_minutes?: number | null
          forecast_state?: Json
          id?: string
          organization_id?: string
          simulation_inputs?: Json | null
          simulation_outputs?: Json | null
          snapshot_date?: string
          twin_type?: string
        }
        Relationships: []
      }
      engagement_patterns: {
        Row: {
          attention_score: number
          completion_rate: number
          computed_at: string
          conversion_rate: number
          cta_rate: number
          id: string
          metadata: Json
          open_rate: number
          organization_id: string
          patient_external_id: string | null
          pattern_name: string
          pattern_window: string
        }
        Insert: {
          attention_score?: number
          completion_rate?: number
          computed_at?: string
          conversion_rate?: number
          cta_rate?: number
          id?: string
          metadata?: Json
          open_rate?: number
          organization_id: string
          patient_external_id?: string | null
          pattern_name: string
          pattern_window?: string
        }
        Update: {
          attention_score?: number
          completion_rate?: number
          computed_at?: string
          conversion_rate?: number
          cta_rate?: number
          id?: string
          metadata?: Json
          open_rate?: number
          organization_id?: string
          patient_external_id?: string | null
          pattern_name?: string
          pattern_window?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_scores: {
        Row: {
          active_users: number
          engagement_score: number
          id: string
          measured_at: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          active_users?: number
          engagement_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          active_users?: number
          engagement_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "engagement_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_certification_results: {
        Row: {
          certification_run_id: string | null
          created_at: string
          detail: string | null
          evidence: Json
          id: string
          organization_id: string
          score: number
          status: string
          subsystem: string
          threshold: number
        }
        Insert: {
          certification_run_id?: string | null
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          organization_id: string
          score?: number
          status: string
          subsystem: string
          threshold?: number
        }
        Update: {
          certification_run_id?: string | null
          created_at?: string
          detail?: string | null
          evidence?: Json
          id?: string
          organization_id?: string
          score?: number
          status?: string
          subsystem?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_certification_results_certification_run_id_fkey"
            columns: ["certification_run_id"]
            isOneToOne: false
            referencedRelation: "enterprise_certification_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_certification_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_certification_runs: {
        Row: {
          completed_at: string | null
          id: string
          metadata: Json
          organization_id: string
          readiness_index: number
          run_type: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          readiness_index?: number
          run_type?: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          readiness_index?: number
          run_type?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_certification_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      enterprise_forecasts: {
        Row: {
          confidence: number
          drivers: Json
          forecast_type: string
          forecast_window: string
          generated_at: string
          id: string
          location_id: string | null
          organization_id: string
          probability: number
          projected_impact: Json
          recommended_response: Json
        }
        Insert: {
          confidence?: number
          drivers?: Json
          forecast_type: string
          forecast_window: string
          generated_at?: string
          id?: string
          location_id?: string | null
          organization_id: string
          probability: number
          projected_impact?: Json
          recommended_response?: Json
        }
        Update: {
          confidence?: number
          drivers?: Json
          forecast_type?: string
          forecast_window?: string
          generated_at?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          probability?: number
          projected_impact?: Json
          recommended_response?: Json
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_forecasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_playbooks: {
        Row: {
          category: string
          created_at: string
          escalation_paths: Json
          generated_adaptations: Json
          id: string
          name: string
          optimization_recommendations: Json
          organization_id: string | null
          outcome_tracking: Json
          rollback_logic: Json
          status: Database["public"]["Enums"]["playbook_status"]
          trigger_logic: Json
        }
        Insert: {
          category: string
          created_at?: string
          escalation_paths?: Json
          generated_adaptations?: Json
          id?: string
          name: string
          optimization_recommendations?: Json
          organization_id?: string | null
          outcome_tracking?: Json
          rollback_logic?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger_logic?: Json
        }
        Update: {
          category?: string
          created_at?: string
          escalation_paths?: Json
          generated_adaptations?: Json
          id?: string
          name?: string
          optimization_recommendations?: Json
          organization_id?: string | null
          outcome_tracking?: Json
          rollback_logic?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger_logic?: Json
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_playbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_simulations: {
        Row: {
          benchmark_movement: Json
          confidence: number
          created_at: string
          id: string
          operational_resilience: number
          organization_id: string
          projected_enterprise_impact: Json
          retention_trajectory: number
          revenue_recovery_projection: number
          scenario_inputs: Json
          scenario_name: string
          staffing_pressure: number
        }
        Insert: {
          benchmark_movement?: Json
          confidence?: number
          created_at?: string
          id?: string
          operational_resilience?: number
          organization_id: string
          projected_enterprise_impact?: Json
          retention_trajectory?: number
          revenue_recovery_projection?: number
          scenario_inputs?: Json
          scenario_name: string
          staffing_pressure?: number
        }
        Update: {
          benchmark_movement?: Json
          confidence?: number
          created_at?: string
          id?: string
          operational_resilience?: number
          organization_id?: string
          projected_enterprise_impact?: Json
          retention_trajectory?: number
          revenue_recovery_projection?: number
          scenario_inputs?: Json
          scenario_name?: string
          staffing_pressure?: number
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_simulations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_report_snapshots: {
        Row: {
          export_metadata: Json
          generated_at: string
          id: string
          organization_id: string
          payload: Json
          report_type: string
          status: string
          summary: string
          title: string
        }
        Insert: {
          export_metadata?: Json
          generated_at?: string
          id?: string
          organization_id: string
          payload?: Json
          report_type: string
          status?: string
          summary: string
          title: string
        }
        Update: {
          export_metadata?: Json
          generated_at?: string
          id?: string
          organization_id?: string
          payload?: Json
          report_type?: string
          status?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      expansion_quotes: {
        Row: {
          approved_at: string | null
          client_commercial_control_id: string | null
          created_at: string
          expansion_type: string
          id: string
          metadata: Json
          organization_id: string
          quote_amount: number
          status: string
        }
        Insert: {
          approved_at?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          expansion_type: string
          id?: string
          metadata?: Json
          organization_id: string
          quote_amount?: number
          status?: string
        }
        Update: {
          approved_at?: string | null
          client_commercial_control_id?: string | null
          created_at?: string
          expansion_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          quote_amount?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expansion_quotes_client_commercial_control_id_fkey"
            columns: ["client_commercial_control_id"]
            isOneToOne: false
            referencedRelation: "client_commercial_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansion_quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_scores: {
        Row: {
          expansion_score: number
          id: string
          measured_at: string
          metadata: Json
          opportunity_value: number
          organization_id: string
        }
        Insert: {
          expansion_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          opportunity_value?: number
          organization_id: string
        }
        Update: {
          expansion_score?: number
          id?: string
          measured_at?: string
          metadata?: Json
          opportunity_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expansion_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expansions: {
        Row: {
          client_id: string | null
          created_at: string
          expansion_type: string
          expansion_value: number
          id: string
          metadata: Json
          organization_id: string
          stage: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          expansion_type: string
          expansion_value?: number
          id?: string
          metadata?: Json
          organization_id: string
          stage?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          expansion_type?: string
          expansion_value?: number
          id?: string
          metadata?: Json
          organization_id?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "expansions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expansions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      failure_patterns: {
        Row: {
          confidence: number
          detected_at: string
          failure_type: string
          frequency: number
          id: string
          metadata: Json
          organization_id: string
          pattern_key: string
          recommended_recovery: string | null
        }
        Insert: {
          confidence?: number
          detected_at?: string
          failure_type: string
          frequency?: number
          id?: string
          metadata?: Json
          organization_id: string
          pattern_key: string
          recommended_recovery?: string | null
        }
        Update: {
          confidence?: number
          detected_at?: string
          failure_type?: string
          frequency?: number
          id?: string
          metadata?: Json
          organization_id?: string
          pattern_key?: string
          recommended_recovery?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failure_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_interactions: {
        Row: {
          category: string
          created_at: string
          id: string
          interaction_type: string
          question: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          interaction_type: string
          question: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          interaction_type?: string
          question?: string
        }
        Relationships: []
      }
      financing_applications: {
        Row: {
          application_status: string
          financing_referral_id: string | null
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
          requested_amount: number
          submitted_at: string | null
        }
        Insert: {
          application_status?: string
          financing_referral_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
          requested_amount?: number
          submitted_at?: string | null
        }
        Update: {
          application_status?: string
          financing_referral_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
          requested_amount?: number
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_applications_financing_referral_id_fkey"
            columns: ["financing_referral_id"]
            isOneToOne: false
            referencedRelation: "financing_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_decisions: {
        Row: {
          approved_amount: number
          decided_at: string
          decision: string
          financing_application_id: string | null
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
        }
        Insert: {
          approved_amount?: number
          decided_at?: string
          decision: string
          financing_application_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
        }
        Update: {
          approved_amount?: number
          decided_at?: string
          decision?: string
          financing_application_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_decisions_financing_application_id_fkey"
            columns: ["financing_application_id"]
            isOneToOne: false
            referencedRelation: "financing_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financing_referrals: {
        Row: {
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
          provider: string
          referral_amount: number
          referral_status: string
          referred_at: string
          treatment_plan_id: string | null
        }
        Insert: {
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
          provider: string
          referral_amount?: number
          referral_status?: string
          referred_at?: string
          treatment_plan_id?: string | null
        }
        Update: {
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
          provider?: string
          referral_amount?: number
          referral_status?: string
          referred_at?: string
          treatment_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financing_referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_referrals_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_accuracy: {
        Row: {
          actual_value: number | null
          drift_score: number
          evaluation_window: string
          forecast_id: string | null
          forecast_type: string
          id: string
          measured_at: string
          organization_id: string
          predicted_value: number
          quality_score: number
        }
        Insert: {
          actual_value?: number | null
          drift_score?: number
          evaluation_window: string
          forecast_id?: string | null
          forecast_type: string
          id?: string
          measured_at?: string
          organization_id: string
          predicted_value: number
          quality_score?: number
        }
        Update: {
          actual_value?: number | null
          drift_score?: number
          evaluation_window?: string
          forecast_id?: string | null
          forecast_type?: string
          id?: string
          measured_at?: string
          organization_id?: string
          predicted_value?: number
          quality_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_accuracy_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_runs: {
        Row: {
          data_source: string
          forecast_accuracy: number | null
          forecast_output: Json
          forecast_type: string
          generated_at: string
          id: string
          organization_id: string | null
          source_data_version: string
          trace_id: string | null
        }
        Insert: {
          data_source?: string
          forecast_accuracy?: number | null
          forecast_output?: Json
          forecast_type: string
          generated_at?: string
          id?: string
          organization_id?: string | null
          source_data_version: string
          trace_id?: string | null
        }
        Update: {
          data_source?: string
          forecast_accuracy?: number | null
          forecast_output?: Json
          forecast_type?: string
          generated_at?: string
          id?: string
          organization_id?: string | null
          source_data_version?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forecast_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasting_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      gallery_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          caption: string
          category_id: string
          component_type: string
          created_at: string
          cta_href: string | null
          cta_label: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          sort_order: number
          stat_label: string | null
          stat_value: string | null
          title: string
          updated_at: string
        }
        Insert: {
          caption: string
          category_id: string
          component_type?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          sort_order?: number
          stat_label?: string | null
          stat_value?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string
          category_id?: string
          component_type?: string
          created_at?: string
          cta_href?: string | null
          cta_label?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          sort_order?: number
          stat_label?: string | null
          stat_value?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "gallery_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      go_live_checklists: {
        Row: {
          certified: boolean
          certified_at: string | null
          created_at: string
          id: string
          implementation_project_id: string | null
          integrations_connected: boolean
          metadata: Json
          organization_id: string
          templates_configured: boolean
          testing_passed: boolean
          training_completed: boolean
          workflows_active: boolean
        }
        Insert: {
          certified?: boolean
          certified_at?: string | null
          created_at?: string
          id?: string
          implementation_project_id?: string | null
          integrations_connected?: boolean
          metadata?: Json
          organization_id: string
          templates_configured?: boolean
          testing_passed?: boolean
          training_completed?: boolean
          workflows_active?: boolean
        }
        Update: {
          certified?: boolean
          certified_at?: string | null
          created_at?: string
          id?: string
          implementation_project_id?: string | null
          integrations_connected?: boolean
          metadata?: Json
          organization_id?: string
          templates_configured?: boolean
          testing_passed?: boolean
          training_completed?: boolean
          workflows_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "go_live_checklists_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "go_live_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_scores: {
        Row: {
          created_at: string | null
          id: string
          membership_score: number | null
          new_patient_score: number | null
          organization_id: string
          overall_score: number | null
          recall_score: number | null
          referral_score: number | null
          revenue_growth_score: number | null
          review_score: number | null
          score_date: string
          treatment_acceptance_score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          membership_score?: number | null
          new_patient_score?: number | null
          organization_id: string
          overall_score?: number | null
          recall_score?: number | null
          referral_score?: number | null
          revenue_growth_score?: number | null
          review_score?: number | null
          score_date: string
          treatment_acceptance_score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          membership_score?: number | null
          new_patient_score?: number | null
          organization_id?: string
          overall_score?: number | null
          recall_score?: number | null
          referral_score?: number | null
          revenue_growth_score?: number | null
          review_score?: number | null
          score_date?: string
          treatment_acceptance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gtm_prospects: {
        Row: {
          city: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          estimated_monthly_opportunity: number
          id: string
          lead_score: number
          next_action: string | null
          organization_id: string | null
          personalization_notes: string | null
          phone: string | null
          pipeline_stage: Database["public"]["Enums"]["gtm_pipeline_stage"]
          practice_name: string
          source: string
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          estimated_monthly_opportunity?: number
          id?: string
          lead_score?: number
          next_action?: string | null
          organization_id?: string | null
          personalization_notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["gtm_pipeline_stage"]
          practice_name: string
          source?: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          estimated_monthly_opportunity?: number
          id?: string
          lead_score?: number
          next_action?: string | null
          organization_id?: string | null
          personalization_notes?: string | null
          phone?: string | null
          pipeline_stage?: Database["public"]["Enums"]["gtm_pipeline_stage"]
          practice_name?: string
          source?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      healthcare_cloud_layers: {
        Row: {
          confidence: number
          coordination_score: number
          id: string
          layer_key: Database["public"]["Enums"]["cloud_layer_key"]
          metadata: Json
          organization_id: string
          status: Database["public"]["Enums"]["integration_status"]
          throughput_score: number
          updated_at: string
        }
        Insert: {
          confidence?: number
          coordination_score?: number
          id?: string
          layer_key: Database["public"]["Enums"]["cloud_layer_key"]
          metadata?: Json
          organization_id: string
          status?: Database["public"]["Enums"]["integration_status"]
          throughput_score?: number
          updated_at?: string
        }
        Update: {
          confidence?: number
          coordination_score?: number
          id?: string
          layer_key?: Database["public"]["Enums"]["cloud_layer_key"]
          metadata?: Json
          organization_id?: string
          status?: Database["public"]["Enums"]["integration_status"]
          throughput_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_cloud_layers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_adoption_metrics: {
        Row: {
          adoption_score: number
          alice_usage: number
          classification: string
          id: string
          implementation_project_id: string | null
          login_frequency: number
          measured_at: string
          metadata: Json
          organization_id: string
          revenue_dashboard_usage: number
          treatment_acceptance_usage: number
          video_usage: number
          workflow_usage: number
        }
        Insert: {
          adoption_score?: number
          alice_usage?: number
          classification?: string
          id?: string
          implementation_project_id?: string | null
          login_frequency?: number
          measured_at?: string
          metadata?: Json
          organization_id: string
          revenue_dashboard_usage?: number
          treatment_acceptance_usage?: number
          video_usage?: number
          workflow_usage?: number
        }
        Update: {
          adoption_score?: number
          alice_usage?: number
          classification?: string
          id?: string
          implementation_project_id?: string | null
          login_frequency?: number
          measured_at?: string
          metadata?: Json
          organization_id?: string
          revenue_dashboard_usage?: number
          treatment_acceptance_usage?: number
          video_usage?: number
          workflow_usage?: number
        }
        Relationships: [
          {
            foreignKeyName: "implementation_adoption_metrics_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_adoption_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_blueprints: {
        Row: {
          blueprint_key: string
          created_at: string
          id: string
          metadata: Json
          name: string
          organization_id: string
          package_key: string
          required_data: string[]
          required_integrations: string[]
          required_training: string[]
          required_workflows: string[]
          success_criteria: string[]
          updated_at: string
        }
        Insert: {
          blueprint_key: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          package_key: string
          required_data?: string[]
          required_integrations?: string[]
          required_training?: string[]
          required_workflows?: string[]
          success_criteria?: string[]
          updated_at?: string
        }
        Update: {
          blueprint_key?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          package_key?: string
          required_data?: string[]
          required_integrations?: string[]
          required_training?: string[]
          required_workflows?: string[]
          success_criteria?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_blueprints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_checklist_templates: {
        Row: {
          created_at: string
          default_due_offset_days: number
          default_owner_role: string
          evidence_type: string | null
          go_live_requirement: boolean
          id: string
          item_key: string
          label: string
          metadata: Json
          organization_id: string
          required: boolean
          section: string
          sort_order: number
          stage: string
          task_type: string
        }
        Insert: {
          created_at?: string
          default_due_offset_days?: number
          default_owner_role?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          item_key: string
          label: string
          metadata?: Json
          organization_id: string
          required?: boolean
          section: string
          sort_order?: number
          stage: string
          task_type?: string
        }
        Update: {
          created_at?: string
          default_due_offset_days?: number
          default_owner_role?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          item_key?: string
          label?: string
          metadata?: Json
          organization_id?: string
          required?: boolean
          section?: string
          sort_order?: number
          stage?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_checklist_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string
          id: string
          kpis: Json
          milestone_name: string
          notes: string | null
          organization_id: string
          project_id: string | null
          status: string
          target_day: number
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          id?: string
          kpis?: Json
          milestone_name: string
          notes?: string | null
          organization_id: string
          project_id?: string | null
          status?: string
          target_day: number
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          id?: string
          kpis?: Json
          milestone_name?: string
          notes?: string | null
          organization_id?: string
          project_id?: string | null
          status?: string
          target_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "implementation_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_projects: {
        Row: {
          actual_go_live_date: string | null
          assigned_csm: string | null
          client_account_id: string | null
          client_name: string | null
          completion_percent: number
          created_at: string
          current_phase: string
          go_live_date: string | null
          health_status: string
          id: string
          implementation_owner: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          package_key: string | null
          phase: string
          project_name: string
          risk_level: string
          signed_at: string | null
          start_date: string | null
          status: string
          target_go_live_date: string | null
          updated_at: string
        }
        Insert: {
          actual_go_live_date?: string | null
          assigned_csm?: string | null
          client_account_id?: string | null
          client_name?: string | null
          completion_percent?: number
          created_at?: string
          current_phase?: string
          go_live_date?: string | null
          health_status?: string
          id?: string
          implementation_owner?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          package_key?: string | null
          phase?: string
          project_name: string
          risk_level?: string
          signed_at?: string | null
          start_date?: string | null
          status?: string
          target_go_live_date?: string | null
          updated_at?: string
        }
        Update: {
          actual_go_live_date?: string | null
          assigned_csm?: string | null
          client_account_id?: string | null
          client_name?: string | null
          completion_percent?: number
          created_at?: string
          current_phase?: string
          go_live_date?: string | null
          health_status?: string
          id?: string
          implementation_owner?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          package_key?: string | null
          phase?: string
          project_name?: string
          risk_level?: string
          signed_at?: string | null
          start_date?: string | null
          status?: string
          target_go_live_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_implementation_projects_client_account_id"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_tasks: {
        Row: {
          category: string | null
          checklist_item_key: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          due_offset_days: number
          evidence: string | null
          evidence_record_id: string | null
          evidence_status: string
          evidence_type: string | null
          go_live_requirement: boolean
          id: string
          implementation_project_id: string | null
          metadata: Json
          notes: string | null
          organization_id: string
          owner: string | null
          owner_role: string | null
          project_id: string | null
          status: string
          task_key: string
          task_name: string
          task_type: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          checklist_item_key?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          due_offset_days?: number
          evidence?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          notes?: string | null
          organization_id: string
          owner?: string | null
          owner_role?: string | null
          project_id?: string | null
          status?: string
          task_key: string
          task_name: string
          task_type?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          checklist_item_key?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          due_offset_days?: number
          evidence?: string | null
          evidence_record_id?: string | null
          evidence_status?: string
          evidence_type?: string | null
          go_live_requirement?: boolean
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          notes?: string | null
          organization_id?: string
          owner?: string | null
          owner_role?: string | null
          project_id?: string | null
          status?: string
          task_key?: string
          task_name?: string
          task_type?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementation_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementation_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assigned_to: string
          id: string
          incident_id: string | null
          metadata: Json
          organization_id: string
          status: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id: string
          status?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_assignments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_events: {
        Row: {
          actor: string | null
          event_type: string
          id: string
          incident_id: string | null
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          trace_id: string | null
        }
        Insert: {
          actor?: string | null
          event_type: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          trace_id?: string | null
        }
        Update: {
          actor?: string | null
          event_type?: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_recoveries: {
        Row: {
          id: string
          incident_id: string | null
          metadata: Json
          organization_id: string
          recovered_at: string | null
          recovery_action: string
          status: string
          validated: boolean
        }
        Insert: {
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id: string
          recovered_at?: string | null
          recovery_action: string
          status?: string
          validated?: boolean
        }
        Update: {
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id?: string
          recovered_at?: string | null
          recovery_action?: string
          status?: string
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "incident_recoveries_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_recoveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_root_causes: {
        Row: {
          category: string
          confidence: number
          created_at: string
          id: string
          incident_id: string | null
          metadata: Json
          organization_id: string
          root_cause: string
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id: string
          root_cause: string
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          id?: string
          incident_id?: string | null
          metadata?: Json
          organization_id?: string
          root_cause?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_root_causes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_root_causes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_timelines: {
        Row: {
          actor: string | null
          detail: string | null
          id: string
          incident_id: string | null
          label: string
          metadata: Json
          occurred_at: string
          organization_id: string
        }
        Insert: {
          actor?: string | null
          detail?: string | null
          id?: string
          incident_id?: string | null
          label: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
        }
        Update: {
          actor?: string | null
          detail?: string | null
          id?: string
          incident_id?: string | null
          label?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_timelines_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_timelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          closed_at: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          opened_at: string
          organization_id: string
          severity: string
          source: string
          status: string
          summary: string | null
          title: string
          trace_id: string | null
        }
        Insert: {
          closed_at?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          organization_id: string
          severity?: string
          source?: string
          status?: string
          summary?: string | null
          title: string
          trace_id?: string | null
        }
        Update: {
          closed_at?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          opened_at?: string
          organization_id?: string
          severity?: string
          source?: string
          status?: string
          summary?: string | null
          title?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_awareness_snapshots: {
        Row: {
          ecosystem_pressure: number
          generated_at: string
          global_health_score: number
          id: string
          orchestration_bottlenecks: Json
          organization_id: string
          provider_stability: Json
          tenant_patterns: Json
        }
        Insert: {
          ecosystem_pressure?: number
          generated_at?: string
          global_health_score?: number
          id?: string
          orchestration_bottlenecks?: Json
          organization_id: string
          provider_stability?: Json
          tenant_patterns?: Json
        }
        Update: {
          ecosystem_pressure?: number
          generated_at?: string
          global_health_score?: number
          id?: string
          orchestration_bottlenecks?: Json
          organization_id?: string
          provider_stability?: Json
          tenant_patterns?: Json
        }
        Relationships: []
      }
      insight_snapshots: {
        Row: {
          category: string
          confidence: number
          created_at: string
          evidence: Json
          id: string
          organization_id: string | null
          practice_id: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          summary: string
          title: string
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          summary: string
          title: string
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          integration_key: string
          organization_id: string
          payload: Json | null
          records_synced: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          integration_key: string
          organization_id: string
          payload?: Json | null
          records_synced?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          integration_key?: string
          organization_id?: string
          payload?: Json | null
          records_synced?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_health: {
        Row: {
          check_time: string | null
          consecutive_failures: number | null
          created_at: string | null
          details: Json | null
          error_rate: number | null
          id: string
          integration_key: string
          last_error_at: string | null
          last_success_at: string | null
          latency_ms: number | null
          organization_id: string
          status: string
        }
        Insert: {
          check_time?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          details?: Json | null
          error_rate?: number | null
          id?: string
          integration_key: string
          last_error_at?: string | null
          last_success_at?: string | null
          latency_ms?: number | null
          organization_id: string
          status: string
        }
        Update: {
          check_time?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          details?: Json | null
          error_rate?: number | null
          id?: string
          integration_key?: string
          last_error_at?: string | null
          last_success_at?: string | null
          latency_ms?: number | null
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_health_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_installations: {
        Row: {
          config_encrypted: Json | null
          created_at: string | null
          error_count: number | null
          id: string
          installed_at: string | null
          integration_key: string
          last_error: string | null
          last_synced_at: string | null
          metadata: Json | null
          organization_id: string
          status: string | null
          sync_count: number | null
        }
        Insert: {
          config_encrypted?: Json | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          installed_at?: string | null
          integration_key: string
          last_error?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          organization_id: string
          status?: string | null
          sync_count?: number | null
        }
        Update: {
          config_encrypted?: Json | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          installed_at?: string | null
          integration_key?: string
          last_error?: string | null
          last_synced_at?: string | null
          metadata?: Json | null
          organization_id?: string
          status?: string | null
          sync_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_installations_integration_key_fkey"
            columns: ["integration_key"]
            isOneToOne: false
            referencedRelation: "integration_registry"
            referencedColumns: ["integration_key"]
          },
          {
            foreignKeyName: "integration_installations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_readiness_checks: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          implementation_project_id: string | null
          last_checked_at: string | null
          metadata: Json
          organization_id: string
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          implementation_project_id?: string | null
          last_checked_at?: string | null
          metadata?: Json
          organization_id: string
          provider: string
          status?: string
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          implementation_project_id?: string | null
          last_checked_at?: string | null
          metadata?: Json
          organization_id?: string
          provider?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_readiness_checks_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_readiness_checks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_registry: {
        Row: {
          adapter_class: string | null
          capabilities: Json | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          integration_key: string
          integration_name: string
          required_config_keys: Json | null
          status: string | null
          version: string | null
        }
        Insert: {
          adapter_class?: string | null
          capabilities?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          integration_key: string
          integration_name: string
          required_config_keys?: Json | null
          status?: string | null
          version?: string | null
        }
        Update: {
          adapter_class?: string | null
          capabilities?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          integration_key?: string
          integration_name?: string
          required_config_keys?: Json | null
          status?: string | null
          version?: string | null
        }
        Relationships: []
      }
      intelligence_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      intelligence_quality_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      intelligence_runs: {
        Row: {
          benchmark_correctness: number
          completed_at: string | null
          confidence: number
          created_at: string
          evaluation: Json
          grounding_sources: Json
          hallucination_score: number
          id: string
          input_fingerprint: string
          operational_relevance: number
          organization_id: string
          output_summary: string | null
          run_type: string
          status: Database["public"]["Enums"]["intelligence_run_status"]
        }
        Insert: {
          benchmark_correctness?: number
          completed_at?: string | null
          confidence?: number
          created_at?: string
          evaluation?: Json
          grounding_sources?: Json
          hallucination_score?: number
          id?: string
          input_fingerprint: string
          operational_relevance?: number
          organization_id: string
          output_summary?: string | null
          run_type: string
          status?: Database["public"]["Enums"]["intelligence_run_status"]
        }
        Update: {
          benchmark_correctness?: number
          completed_at?: string | null
          confidence?: number
          created_at?: string
          evaluation?: Json
          grounding_sources?: Json
          hallucination_score?: number
          id?: string
          input_fingerprint?: string
          operational_relevance?: number
          organization_id?: string
          output_summary?: string | null
          run_type?: string
          status?: Database["public"]["Enums"]["intelligence_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          metadata: Json
          organization_id: string
          patient_id: string | null
          status: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          metadata?: Json
          organization_id: string
          patient_id?: string | null
          status?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_outcomes: {
        Row: {
          created_at: string
          decision_journey_id: string | null
          evidence: Json
          id: string
          occurred_at: string
          organization_id: string
          outcome_type: string
          outcome_value: number
          patient_external_id: string | null
          revenue_influenced: number
          revenue_protected: number
          revenue_recovered: number
          video_campaign_id: string | null
        }
        Insert: {
          created_at?: string
          decision_journey_id?: string | null
          evidence?: Json
          id?: string
          occurred_at?: string
          organization_id: string
          outcome_type: string
          outcome_value?: number
          patient_external_id?: string | null
          revenue_influenced?: number
          revenue_protected?: number
          revenue_recovered?: number
          video_campaign_id?: string | null
        }
        Update: {
          created_at?: string
          decision_journey_id?: string | null
          evidence?: Json
          id?: string
          occurred_at?: string
          organization_id?: string
          outcome_type?: string
          outcome_value?: number
          patient_external_id?: string | null
          revenue_influenced?: number
          revenue_protected?: number
          revenue_recovered?: number
          video_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_outcomes_decision_journey_id_fkey"
            columns: ["decision_journey_id"]
            isOneToOne: false
            referencedRelation: "decision_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_outcomes_video_campaign_id_fkey"
            columns: ["video_campaign_id"]
            isOneToOne: false
            referencedRelation: "video_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_scheduled_steps: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          executed_at: string | null
          id: string
          journey_assignment_id: string
          metadata: Json
          organization_id: string
          scheduled_for: string
          script_template_id: string | null
          status: string
          step_order: number
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          journey_assignment_id: string
          metadata?: Json
          organization_id: string
          scheduled_for: string
          script_template_id?: string | null
          status?: string
          step_order: number
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          id?: string
          journey_assignment_id?: string
          metadata?: Json
          organization_id?: string
          scheduled_for?: string
          script_template_id?: string | null
          status?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "journey_scheduled_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          channel: string
          created_at: string
          cta_label: string | null
          decision_journey_id: string
          id: string
          next_best_action: string | null
          organization_id: string
          status: string
          step_order: number
          template_id: string | null
          timing_offset: string
          trigger_condition: string
          updated_at: string
          video_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          cta_label?: string | null
          decision_journey_id: string
          id?: string
          next_best_action?: string | null
          organization_id: string
          status?: string
          step_order: number
          template_id?: string | null
          timing_offset: string
          trigger_condition: string
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          cta_label?: string | null
          decision_journey_id?: string
          id?: string
          next_best_action?: string | null
          organization_id?: string
          status?: string
          step_order?: number
          template_id?: string | null
          timing_offset?: string
          trigger_condition?: string
          updated_at?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_decision_journey_id_fkey"
            columns: ["decision_journey_id"]
            isOneToOne: false
            referencedRelation: "decision_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "video_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_edges: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          organization_id: string | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string | null
          relationship_type?: string
          source_node_id?: string
          target_node_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_edges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_nodes: {
        Row: {
          confidence: number
          created_at: string
          id: string
          label: string
          node_type: string
          organization_id: string | null
          properties: Json
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          label: string
          node_type: string
          organization_id?: string | null
          properties?: Json
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          label?: string
          node_type?: string
          organization_id?: string | null
          properties?: Json
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_nodes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          attribution: Json
          created_at: string
          dentist_name: string | null
          email: string
          id: string
          locations: number
          no_show_rate: number | null
          notes: string | null
          operational_pain: string | null
          organization_id: string | null
          phone: string | null
          pms_software: string | null
          practice_name: string
          source: string
          staff_size: number | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          attribution?: Json
          created_at?: string
          dentist_name?: string | null
          email: string
          id?: string
          locations?: number
          no_show_rate?: number | null
          notes?: string | null
          operational_pain?: string | null
          organization_id?: string | null
          phone?: string | null
          pms_software?: string | null
          practice_name: string
          source?: string
          staff_size?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          attribution?: Json
          created_at?: string
          dentist_name?: string | null
          email?: string
          id?: string
          locations?: number
          no_show_rate?: number | null
          notes?: string | null
          operational_pain?: string | null
          organization_id?: string | null
          phone?: string | null
          pms_software?: string | null
          practice_name?: string
          source?: string
          staff_size?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      liz_action_events: {
        Row: {
          action_id: string | null
          action_label: string | null
          action_type: string | null
          created_at: string
          escalation_path: string | null
          event_type: string
          href: string | null
          id: string
          intent: string | null
          lead_score: number | null
          message: string | null
          metadata: Json
          organization_id: string | null
          page: string | null
          session_id: string | null
          workflow_id: string | null
        }
        Insert: {
          action_id?: string | null
          action_label?: string | null
          action_type?: string | null
          created_at?: string
          escalation_path?: string | null
          event_type: string
          href?: string | null
          id?: string
          intent?: string | null
          lead_score?: number | null
          message?: string | null
          metadata?: Json
          organization_id?: string | null
          page?: string | null
          session_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          action_id?: string | null
          action_label?: string | null
          action_type?: string | null
          created_at?: string
          escalation_path?: string | null
          event_type?: string
          href?: string | null
          id?: string
          intent?: string | null
          lead_score?: number | null
          message?: string | null
          metadata?: Json
          organization_id?: string | null
          page?: string | null
          session_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liz_action_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      liz_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liz_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          chair_count: number
          created_at: string
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          settings: Json
          slug: string
          timezone: string
        }
        Insert: {
          address?: string | null
          chair_count?: number
          created_at?: string
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          settings?: Json
          slug: string
          timezone?: string
        }
        Update: {
          address?: string | null
          chair_count?: number
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          settings?: Json
          slug?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_attributions: {
        Row: {
          id: string
          membership_id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
        }
        Insert: {
          id?: string
          membership_id: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Update: {
          id?: string
          membership_id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tracking: {
        Row: {
          annual_value: number | null
          cancelled_at: string | null
          created_at: string | null
          enrolled_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          monthly_value: number | null
          organization_id: string
          patient_external_id: string
          plan_name: string
          renewal_count: number | null
          status: string
        }
        Insert: {
          annual_value?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          monthly_value?: number | null
          organization_id: string
          patient_external_id: string
          plan_name: string
          renewal_count?: number | null
          status?: string
        }
        Update: {
          annual_value?: number | null
          cancelled_at?: string | null
          created_at?: string | null
          enrolled_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          monthly_value?: number | null
          organization_id?: string
          patient_external_id?: string
          plan_name?: string
          renewal_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          category: string
          channel: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          required_variables: string[]
          status: string
          subject: string | null
          template_key: string
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          channel: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          required_variables?: string[]
          status?: string
          subject?: string | null
          template_key: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          required_variables?: string[]
          status?: string
          subject?: string | null
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_control_actions: {
        Row: {
          action_type: string
          actor: string
          completed_at: string | null
          created_at: string
          evidence_id: string | null
          id: string
          organization_id: string | null
          source_card: string
          status: string
          workflow_id: string | null
        }
        Insert: {
          action_type: string
          actor?: string
          completed_at?: string | null
          created_at?: string
          evidence_id?: string | null
          id?: string
          organization_id?: string | null
          source_card: string
          status?: string
          workflow_id?: string | null
        }
        Update: {
          action_type?: string
          actor?: string
          completed_at?: string | null
          created_at?: string
          evidence_id?: string | null
          id?: string
          organization_id?: string | null
          source_card?: string
          status?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_control_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_control_events: {
        Row: {
          created_at: string
          event_type: string
          evidence_id: string | null
          id: string
          organization_id: string | null
          payload: Json
          source_card: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          evidence_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          source_card: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          evidence_id?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          source_card?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_control_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_control_outcomes: {
        Row: {
          action_id: string | null
          created_at: string
          id: string
          metrics: Json
          organization_id: string | null
          outcome_summary: string
          outcome_type: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          organization_id?: string | null
          outcome_summary: string
          outcome_type: string
        }
        Update: {
          action_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          organization_id?: string | null
          outcome_summary?: string
          outcome_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_control_outcomes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "mission_control_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_control_outcomes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      new_patient_leads: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          converted_at: string | null
          created_at: string | null
          id: string
          lead_source: string
          lead_status: string | null
          metadata: Json | null
          organization_id: string
          patient_external_id: string | null
          revenue_attributed: number | null
          treatment_interest: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          lead_source: string
          lead_status?: string | null
          metadata?: Json | null
          organization_id: string
          patient_external_id?: string | null
          revenue_attributed?: number | null
          treatment_interest?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          lead_source?: string
          lead_status?: string | null
          metadata?: Json | null
          organization_id?: string
          patient_external_id?: string | null
          revenue_attributed?: number | null
          treatment_interest?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_patient_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      normalized_healthcare_events: {
        Row: {
          appointment_ref: string | null
          benchmark_features: Json
          created_at: string
          event_type: string
          forecast_features: Json
          id: string
          integration_id: string | null
          location_id: string | null
          normalized_payload: Json
          occurred_at: string
          organization_id: string
          patient_ref: string | null
          provider_ref: string | null
          source_provider: Database["public"]["Enums"]["pms_provider_key"]
        }
        Insert: {
          appointment_ref?: string | null
          benchmark_features?: Json
          created_at?: string
          event_type: string
          forecast_features?: Json
          id?: string
          integration_id?: string | null
          location_id?: string | null
          normalized_payload?: Json
          occurred_at: string
          organization_id: string
          patient_ref?: string | null
          provider_ref?: string | null
          source_provider: Database["public"]["Enums"]["pms_provider_key"]
        }
        Update: {
          appointment_ref?: string | null
          benchmark_features?: Json
          created_at?: string
          event_type?: string
          forecast_features?: Json
          id?: string
          integration_id?: string | null
          location_id?: string | null
          normalized_payload?: Json
          occurred_at?: string
          organization_id?: string
          patient_ref?: string | null
          provider_ref?: string | null
          source_provider?: Database["public"]["Enums"]["pms_provider_key"]
        }
        Relationships: [
          {
            foreignKeyName: "normalized_healthcare_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "pms_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normalized_healthcare_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normalized_healthcare_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          organization_id: string | null
          practice_id: string | null
          read_at: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_states: {
        Row: {
          completed_steps: Json
          created_at: string
          current_step: string
          id: string
          metadata: Json
          organization_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_steps?: Json
          created_at?: string
          current_step?: string
          id?: string
          metadata?: Json
          organization_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_steps?: Json
          created_at?: string
          current_step?: string
          id?: string
          metadata?: Json
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      open_dental_sync_checkpoints: {
        Row: {
          checkpoint_cursor: string
          created_at: string
          id: string
          integration_id: string | null
          last_seen_remote_id: string | null
          last_synced_at: string
          location_id: string | null
          organization_id: string
          reconciliation_hash: string | null
          sync_scope: string
        }
        Insert: {
          checkpoint_cursor: string
          created_at?: string
          id?: string
          integration_id?: string | null
          last_seen_remote_id?: string | null
          last_synced_at?: string
          location_id?: string | null
          organization_id: string
          reconciliation_hash?: string | null
          sync_scope: string
        }
        Update: {
          checkpoint_cursor?: string
          created_at?: string
          id?: string
          integration_id?: string | null
          last_seen_remote_id?: string | null
          last_synced_at?: string
          location_id?: string | null
          organization_id?: string
          reconciliation_hash?: string | null
          sync_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_dental_sync_checkpoints_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "pms_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_dental_sync_checkpoints_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_dental_sync_checkpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_agents: {
        Row: {
          agent_key: string
          agent_name: string
          agent_type: string
          confidence: number
          created_at: string
          id: string
          last_signal_at: string | null
          metadata: Json
          organization_id: string
          responsibilities: string[]
          status: Database["public"]["Enums"]["operational_agent_status"]
          updated_at: string
        }
        Insert: {
          agent_key: string
          agent_name: string
          agent_type: string
          confidence?: number
          created_at?: string
          id?: string
          last_signal_at?: string | null
          metadata?: Json
          organization_id: string
          responsibilities?: string[]
          status?: Database["public"]["Enums"]["operational_agent_status"]
          updated_at?: string
        }
        Update: {
          agent_key?: string
          agent_name?: string
          agent_type?: string
          confidence?: number
          created_at?: string
          id?: string
          last_signal_at?: string | null
          metadata?: Json
          organization_id?: string
          responsibilities?: string[]
          status?: Database["public"]["Enums"]["operational_agent_status"]
          updated_at?: string
        }
        Relationships: []
      }
      operational_api_keys: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          organization_id: string
          scopes: string[]
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          organization_id: string
          scopes?: string[]
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          organization_id?: string
          scopes?: string[]
          status?: string
        }
        Relationships: []
      }
      operational_audits_gtm: {
        Row: {
          audit_type: string
          created_at: string
          delivered_at: string | null
          id: string
          loom_url: string | null
          no_show_findings: string | null
          prospect_id: string | null
          recall_findings: string | null
          retention_findings: string | null
          revenue_leakage_estimate: number
          review_findings: string | null
        }
        Insert: {
          audit_type?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          loom_url?: string | null
          no_show_findings?: string | null
          prospect_id?: string | null
          recall_findings?: string | null
          retention_findings?: string | null
          revenue_leakage_estimate?: number
          review_findings?: string | null
        }
        Update: {
          audit_type?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          loom_url?: string | null
          no_show_findings?: string | null
          prospect_id?: string | null
          recall_findings?: string | null
          retention_findings?: string | null
          revenue_leakage_estimate?: number
          review_findings?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_audits_gtm_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "gtm_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_digital_twins: {
        Row: {
          generated_at: string
          id: string
          organization_id: string
          resilience_score: number
          runtime_model: Json
          simulation_state: Json
          twin_key: string
        }
        Insert: {
          generated_at?: string
          id?: string
          organization_id: string
          resilience_score?: number
          runtime_model?: Json
          simulation_state?: Json
          twin_key: string
        }
        Update: {
          generated_at?: string
          id?: string
          organization_id?: string
          resilience_score?: number
          runtime_model?: Json
          simulation_state?: Json
          twin_key?: string
        }
        Relationships: []
      }
      operational_event_ledger: {
        Row: {
          correlation_id: string
          emitted_at: string
          event_version: number
          id: string
          idempotency_key: string
          lineage: Json
          location_id: string | null
          normalized_event_type: string
          organization_id: string
          payload: Json
          source_event_id: string
          source_system: string
        }
        Insert: {
          correlation_id?: string
          emitted_at?: string
          event_version?: number
          id?: string
          idempotency_key: string
          lineage?: Json
          location_id?: string | null
          normalized_event_type: string
          organization_id: string
          payload?: Json
          source_event_id: string
          source_system: string
        }
        Update: {
          correlation_id?: string
          emitted_at?: string
          event_version?: number
          id?: string
          idempotency_key?: string
          lineage?: Json
          location_id?: string | null
          normalized_event_type?: string
          organization_id?: string
          payload?: Json
          source_event_id?: string
          source_system?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_event_ledger_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_event_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_extensions: {
        Row: {
          created_at: string
          dependency_keys: string[]
          extension_key: string
          extension_name: string
          extension_type: string
          id: string
          observability: Json
          organization_id: string
          permission_scope: string[]
          status: Database["public"]["Enums"]["operational_extension_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dependency_keys?: string[]
          extension_key: string
          extension_name: string
          extension_type: string
          id?: string
          observability?: Json
          organization_id: string
          permission_scope?: string[]
          status?: Database["public"]["Enums"]["operational_extension_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dependency_keys?: string[]
          extension_key?: string
          extension_name?: string
          extension_type?: string
          id?: string
          observability?: Json
          organization_id?: string
          permission_scope?: string[]
          status?: Database["public"]["Enums"]["operational_extension_status"]
          updated_at?: string
        }
        Relationships: []
      }
      operational_health_snapshots: {
        Row: {
          ai_reliability_score: number
          forecast_quality_score: number
          id: string
          operational_confidence_score: number
          orchestration_health: number
          organization_id: string
          queue_stability_score: number
          resilience_score: number
          snapshot_at: string
          summary: Json
        }
        Insert: {
          ai_reliability_score: number
          forecast_quality_score: number
          id?: string
          operational_confidence_score: number
          orchestration_health: number
          organization_id: string
          queue_stability_score: number
          resilience_score: number
          snapshot_at?: string
          summary?: Json
        }
        Update: {
          ai_reliability_score?: number
          forecast_quality_score?: number
          id?: string
          operational_confidence_score?: number
          orchestration_health?: number
          organization_id?: string
          queue_stability_score?: number
          resilience_score?: number
          snapshot_at?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operational_health_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_incident_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          incident_id: string
          message: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          incident_id: string
          message: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          incident_id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operational_incident_events_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "operational_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_incidents: {
        Row: {
          correlation_id: string | null
          id: string
          incident_key: string
          mitigation: string | null
          opened_at: string
          organization_id: string
          resolved_at: string | null
          root_cause: string | null
          severity: Database["public"]["Enums"]["operational_incident_severity"]
          sla_impact_ms: number | null
          status: Database["public"]["Enums"]["operational_incident_status"]
          title: string
        }
        Insert: {
          correlation_id?: string | null
          id?: string
          incident_key: string
          mitigation?: string | null
          opened_at?: string
          organization_id: string
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["operational_incident_severity"]
          sla_impact_ms?: number | null
          status?: Database["public"]["Enums"]["operational_incident_status"]
          title: string
        }
        Update: {
          correlation_id?: string | null
          id?: string
          incident_key?: string
          mitigation?: string | null
          opened_at?: string
          organization_id?: string
          resolved_at?: string | null
          root_cause?: string | null
          severity?: Database["public"]["Enums"]["operational_incident_severity"]
          sla_impact_ms?: number | null
          status?: Database["public"]["Enums"]["operational_incident_status"]
          title?: string
        }
        Relationships: []
      }
      operational_memory_entries: {
        Row: {
          confidence: number
          created_at: string
          evidence: Json
          id: string
          memory_type: string
          organization_id: string
          summary: string
          title: string
          workflow_id: string | null
        }
        Insert: {
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          memory_type: string
          organization_id: string
          summary: string
          title: string
          workflow_id?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          memory_type?: string
          organization_id?: string
          summary?: string
          title?: string
          workflow_id?: string | null
        }
        Relationships: []
      }
      operational_metrics: {
        Row: {
          admin_hours_saved: number
          confirmation_rate: number
          created_at: string
          id: string
          location_id: string | null
          metric_date: string
          no_show_rate: number
          organization_id: string | null
          patient_engagement_rate: number
          practice_id: string | null
          recall_recovery_count: number
          recovered_revenue: number
          review_requests_sent: number
          reviews_generated: number
        }
        Insert: {
          admin_hours_saved?: number
          confirmation_rate?: number
          created_at?: string
          id?: string
          location_id?: string | null
          metric_date: string
          no_show_rate?: number
          organization_id?: string | null
          patient_engagement_rate?: number
          practice_id?: string | null
          recall_recovery_count?: number
          recovered_revenue?: number
          review_requests_sent?: number
          reviews_generated?: number
        }
        Update: {
          admin_hours_saved?: number
          confirmation_rate?: number
          created_at?: string
          id?: string
          location_id?: string | null
          metric_date?: string
          no_show_rate?: number
          organization_id?: string | null
          patient_engagement_rate?: number
          practice_id?: string | null
          recall_recovery_count?: number
          recovered_revenue?: number
          review_requests_sent?: number
          reviews_generated?: number
        }
        Relationships: [
          {
            foreignKeyName: "operational_metrics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_playbooks: {
        Row: {
          approval_flow: Json
          category: string
          created_at: string
          expected_outcomes: Json
          id: string
          name: string
          operational_goals: Json
          organization_id: string | null
          recommended_actions: Json
          rollback_logic: Json
          status: Database["public"]["Enums"]["playbook_status"]
          trigger_conditions: Json
        }
        Insert: {
          approval_flow?: Json
          category: string
          created_at?: string
          expected_outcomes?: Json
          id?: string
          name: string
          operational_goals?: Json
          organization_id?: string | null
          recommended_actions?: Json
          rollback_logic?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger_conditions?: Json
        }
        Update: {
          approval_flow?: Json
          category?: string
          created_at?: string
          expected_outcomes?: Json
          id?: string
          name?: string
          operational_goals?: Json
          organization_id?: string | null
          recommended_actions?: Json
          rollback_logic?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger_conditions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "operational_playbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_risk_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      operational_scores: {
        Row: {
          created_at: string
          efficiency_score: number
          id: string
          location_id: string | null
          no_show_score: number
          opportunities: Json
          organization_id: string
          overall_score: number
          recall_score: number
          recommendation_adoption_score: number
          reliability_score: number
          retention_score: number
          review_score: number
          risk_indicators: Json
          score_date: string
        }
        Insert: {
          created_at?: string
          efficiency_score: number
          id?: string
          location_id?: string | null
          no_show_score: number
          opportunities?: Json
          organization_id: string
          overall_score: number
          recall_score: number
          recommendation_adoption_score: number
          reliability_score: number
          retention_score: number
          review_score: number
          risk_indicators?: Json
          score_date: string
        }
        Update: {
          created_at?: string
          efficiency_score?: number
          id?: string
          location_id?: string | null
          no_show_score?: number
          opportunities?: Json
          organization_id?: string
          overall_score?: number
          recall_score?: number
          recommendation_adoption_score?: number
          reliability_score?: number
          retention_score?: number
          review_score?: number
          risk_indicators?: Json
          score_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_scores_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_simulation_runs: {
        Row: {
          confidence: number
          created_at: string
          id: string
          input_payload: Json
          organization_id: string
          projected_payload: Json
          simulation_type: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          input_payload?: Json
          organization_id: string
          projected_payload?: Json
          simulation_type: string
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          input_payload?: Json
          organization_id?: string
          projected_payload?: Json
          simulation_type?: string
        }
        Relationships: []
      }
      operational_usage_meters: {
        Row: {
          billing_tier: string
          created_at: string
          id: string
          metadata: Json
          meter_key: string
          organization_id: string
          period_end: string
          period_start: string
          quantity: number
          quota: number | null
        }
        Insert: {
          billing_tier?: string
          created_at?: string
          id?: string
          metadata?: Json
          meter_key: string
          organization_id: string
          period_end?: string
          period_start?: string
          quantity?: number
          quota?: number | null
        }
        Update: {
          billing_tier?: string
          created_at?: string
          id?: string
          metadata?: Json
          meter_key?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          quantity?: number
          quota?: number | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          assessment_id: string | null
          audit_id: string | null
          booking_id: string | null
          contact_email: string | null
          created_at: string
          estimated_recovery: number | null
          expected_close: string | null
          id: string
          lead_id: string | null
          metadata: Json
          opportunity_type: string
          organization_id: string
          pipeline_value: number | null
          practice_name: string | null
          probability: number
          stage: string
          updated_at: string
          value: number
        }
        Insert: {
          assessment_id?: string | null
          audit_id?: string | null
          booking_id?: string | null
          contact_email?: string | null
          created_at?: string
          estimated_recovery?: number | null
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          opportunity_type: string
          organization_id: string
          pipeline_value?: number | null
          practice_name?: string | null
          probability?: number
          stage?: string
          updated_at?: string
          value?: number
        }
        Update: {
          assessment_id?: string | null
          audit_id?: string | null
          booking_id?: string | null
          contact_email?: string | null
          created_at?: string
          estimated_recovery?: number | null
          expected_close?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json
          opportunity_type?: string
          organization_id?: string
          pipeline_value?: number | null
          practice_name?: string | null
          probability?: number
          stage?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      orchestration_dependency_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      orchestration_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      orchestration_logs: {
        Row: {
          completed_at: string | null
          correlation_id: string
          dependency_keys: Json
          id: string
          organization_id: string
          sequence_name: string
          started_at: string
          status: Database["public"]["Enums"]["queue_status"]
          step_name: string
          trace_payload: Json
        }
        Insert: {
          completed_at?: string | null
          correlation_id: string
          dependency_keys?: Json
          id?: string
          organization_id: string
          sequence_name: string
          started_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          step_name: string
          trace_payload?: Json
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          dependency_keys?: Json
          id?: string
          organization_id?: string
          sequence_name?: string
          started_at?: string
          status?: Database["public"]["Enums"]["queue_status"]
          step_name?: string
          trace_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "orchestration_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          id: string
          metadata: Json
          organization_id: string
          status: string
          storefront_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          status?: string
          storefront_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          status?: string
          storefront_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          invited_by: string | null
          organization_id: string
          permissions: Json
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          organization_id: string
          permissions?: Json
          role: Database["public"]["Enums"]["organization_role"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          organization_id?: string
          permissions?: Json
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active_plan: Database["public"]["Enums"]["subscription_plan_key"]
          branding: Json
          created_at: string
          id: string
          name: string
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          organization_type: Database["public"]["Enums"]["organization_type"]
          practice_size: number
          primary_location_id: string | null
          settings: Json
          slug: string
          timezone: string
        }
        Insert: {
          active_plan?: Database["public"]["Enums"]["subscription_plan_key"]
          branding?: Json
          created_at?: string
          id?: string
          name: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          organization_type?: Database["public"]["Enums"]["organization_type"]
          practice_size?: number
          primary_location_id?: string | null
          settings?: Json
          slug: string
          timezone?: string
        }
        Update: {
          active_plan?: Database["public"]["Enums"]["subscription_plan_key"]
          branding?: Json
          created_at?: string
          id?: string
          name?: string
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          organization_type?: Database["public"]["Enums"]["organization_type"]
          practice_size?: number
          primary_location_id?: string | null
          settings?: Json
          slug?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_primary_location"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_events: {
        Row: {
          created_at: string
          event_metadata: Json
          event_type: Database["public"]["Enums"]["outreach_event_type"]
          id: string
          lead_id: string | null
          organization_id: string | null
        }
        Insert: {
          created_at?: string
          event_metadata?: Json
          event_type: Database["public"]["Enums"]["outreach_event_type"]
          id?: string
          lead_id?: string | null
          organization_id?: string | null
        }
        Update: {
          created_at?: string
          event_metadata?: Json
          event_type?: Database["public"]["Enums"]["outreach_event_type"]
          id?: string
          lead_id?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_registry: {
        Row: {
          agreement_signed_at: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          notes: string | null
          partner_name: string
          partner_type: string
          referrals_converted: number | null
          referrals_sent: number | null
          status: string | null
          total_revenue_generated: number | null
        }
        Insert: {
          agreement_signed_at?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          partner_name: string
          partner_type: string
          referrals_converted?: number | null
          referrals_sent?: number | null
          status?: string | null
          total_revenue_generated?: number | null
        }
        Update: {
          agreement_signed_at?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          partner_name?: string
          partner_type?: string
          referrals_converted?: number | null
          referrals_sent?: number | null
          status?: string | null
          total_revenue_generated?: number | null
        }
        Relationships: []
      }
      patient_journey_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_journey_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_video_campaigns: {
        Row: {
          completed_at: string | null
          current_step: string | null
          id: string
          journey_key: string
          metadata: Json
          organization_id: string
          patient_external_id: string
          started_at: string
          status: string
          video_campaign_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step?: string | null
          id?: string
          journey_key: string
          metadata?: Json
          organization_id: string
          patient_external_id: string
          started_at?: string
          status?: string
          video_campaign_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step?: string | null
          id?: string
          journey_key?: string
          metadata?: Json
          organization_id?: string
          patient_external_id?: string
          started_at?: string
          status?: string
          video_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_video_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_video_campaigns_video_campaign_id_fkey"
            columns: ["video_campaign_id"]
            isOneToOne: false
            referencedRelation: "video_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_video_events: {
        Row: {
          event_score: number
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_external_id: string
          patient_video_campaign_id: string | null
          video_delivery_id: string | null
        }
        Insert: {
          event_score?: number
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_external_id: string
          patient_video_campaign_id?: string | null
          video_delivery_id?: string | null
        }
        Update: {
          event_score?: number
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_external_id?: string
          patient_video_campaign_id?: string | null
          video_delivery_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_video_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_video_events_patient_video_campaign_id_fkey"
            columns: ["patient_video_campaign_id"]
            isOneToOne: false
            referencedRelation: "patient_video_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_video_events_video_delivery_id_fkey"
            columns: ["video_delivery_id"]
            isOneToOne: false
            referencedRelation: "video_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_video_scores: {
        Row: {
          attention_score: number
          computed_at: string
          id: string
          last_event_at: string | null
          metadata: Json
          organization_id: string
          patient_external_id: string
          referral_activity_score: number
          relationship_health_score: number
          review_activity_score: number
          video_engagement_score: number
          visit_consistency_score: number
        }
        Insert: {
          attention_score?: number
          computed_at?: string
          id?: string
          last_event_at?: string | null
          metadata?: Json
          organization_id: string
          patient_external_id: string
          referral_activity_score?: number
          relationship_health_score?: number
          review_activity_score?: number
          video_engagement_score?: number
          visit_consistency_score?: number
        }
        Update: {
          attention_score?: number
          computed_at?: string
          id?: string
          last_event_at?: string | null
          metadata?: Json
          organization_id?: string
          patient_external_id?: string
          referral_activity_score?: number
          relationship_health_score?: number
          review_activity_score?: number
          video_engagement_score?: number
          visit_consistency_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_video_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_attempts: {
        Row: {
          attempt_number: number
          attempted_at: string
          failure_reason: string | null
          id: string
          metadata: Json
          organization_id: string
          patient_id: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          attempt_number?: number
          attempted_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          patient_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          attempt_number?: number
          attempted_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          metadata: Json
          organization_id: string
          patient_id: string | null
          status: string
          stripe_payment_link_id: string | null
          treatment_plan_id: string | null
          url: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          patient_id?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          treatment_plan_id?: string | null
          url: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string | null
          status?: string
          stripe_payment_link_id?: string | null
          treatment_plan_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_daily_metrics: {
        Row: {
          alice_recommendations: number
          appointments_confirmed: number
          created_at: string
          id: string
          journeys_completed: number
          journeys_started: number
          membership_enrollments: number
          metric_date: string
          organization_id: string
          patients_engaged: number
          recall_recovered: number
          referrals_generated: number
          revenue_influenced: number
          revenue_recovered: number
          reviews_generated: number
          treatment_accepted: number
          videos_delivered: number
          videos_watched: number
          watch_rate: number
        }
        Insert: {
          alice_recommendations?: number
          appointments_confirmed?: number
          created_at?: string
          id?: string
          journeys_completed?: number
          journeys_started?: number
          membership_enrollments?: number
          metric_date?: string
          organization_id: string
          patients_engaged?: number
          recall_recovered?: number
          referrals_generated?: number
          revenue_influenced?: number
          revenue_recovered?: number
          reviews_generated?: number
          treatment_accepted?: number
          videos_delivered?: number
          videos_watched?: number
          watch_rate?: number
        }
        Update: {
          alice_recommendations?: number
          appointments_confirmed?: number
          created_at?: string
          id?: string
          journeys_completed?: number
          journeys_started?: number
          membership_enrollments?: number
          metric_date?: string
          organization_id?: string
          patients_engaged?: number
          recall_recovered?: number
          referrals_generated?: number
          revenue_influenced?: number
          revenue_recovered?: number
          reviews_generated?: number
          treatment_accepted?: number
          videos_delivered?: number
          videos_watched?: number
          watch_rate?: number
        }
        Relationships: []
      }
      pilot_health_events: {
        Row: {
          created_at: string
          event_detail: Json
          event_type: string
          id: string
          milestone_day: number | null
          organization_id: string
          patient_external_id: string | null
        }
        Insert: {
          created_at?: string
          event_detail?: Json
          event_type: string
          id?: string
          milestone_day?: number | null
          organization_id: string
          patient_external_id?: string | null
        }
        Update: {
          created_at?: string
          event_detail?: Json
          event_type?: string
          id?: string
          milestone_day?: number | null
          organization_id?: string
          patient_external_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_health_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_journey_performance: {
        Row: {
          completion_rate: number
          conversion_rate: number
          conversions: number
          created_at: string
          id: string
          journey_type: string
          journeys_completed: number
          journeys_started: number
          organization_id: string
          period_end: string
          period_start: string
          revenue_generated: number
          revenue_influenced: number
        }
        Insert: {
          completion_rate?: number
          conversion_rate?: number
          conversions?: number
          created_at?: string
          id?: string
          journey_type: string
          journeys_completed?: number
          journeys_started?: number
          organization_id: string
          period_end: string
          period_start: string
          revenue_generated?: number
          revenue_influenced?: number
        }
        Update: {
          completion_rate?: number
          conversion_rate?: number
          conversions?: number
          created_at?: string
          id?: string
          journey_type?: string
          journeys_completed?: number
          journeys_started?: number
          organization_id?: string
          period_end?: string
          period_start?: string
          revenue_generated?: number
          revenue_influenced?: number
        }
        Relationships: []
      }
      pilot_roi_reports: {
        Row: {
          baseline_acceptance_rate: number | null
          baseline_membership_count: number | null
          baseline_monthly_revenue: number | null
          baseline_recall_rate: number | null
          baseline_reviews_monthly: number | null
          created_at: string
          current_acceptance_rate: number | null
          current_membership_count: number | null
          current_monthly_revenue: number | null
          current_recall_rate: number | null
          current_reviews_monthly: number | null
          executive_summary: string | null
          id: string
          net_roi: number | null
          next_actions: Json | null
          organization_id: string
          report_date: string
          report_period: string
          revenue_influenced: number
          revenue_recovered: number
          risks: Json | null
          roi_multiple: number | null
          roi_percentage: number | null
          subscription_cost: number | null
          wins: Json | null
        }
        Insert: {
          baseline_acceptance_rate?: number | null
          baseline_membership_count?: number | null
          baseline_monthly_revenue?: number | null
          baseline_recall_rate?: number | null
          baseline_reviews_monthly?: number | null
          created_at?: string
          current_acceptance_rate?: number | null
          current_membership_count?: number | null
          current_monthly_revenue?: number | null
          current_recall_rate?: number | null
          current_reviews_monthly?: number | null
          executive_summary?: string | null
          id?: string
          net_roi?: number | null
          next_actions?: Json | null
          organization_id: string
          report_date?: string
          report_period?: string
          revenue_influenced?: number
          revenue_recovered?: number
          risks?: Json | null
          roi_multiple?: number | null
          roi_percentage?: number | null
          subscription_cost?: number | null
          wins?: Json | null
        }
        Update: {
          baseline_acceptance_rate?: number | null
          baseline_membership_count?: number | null
          baseline_monthly_revenue?: number | null
          baseline_recall_rate?: number | null
          baseline_reviews_monthly?: number | null
          created_at?: string
          current_acceptance_rate?: number | null
          current_membership_count?: number | null
          current_monthly_revenue?: number | null
          current_recall_rate?: number | null
          current_reviews_monthly?: number | null
          executive_summary?: string | null
          id?: string
          net_roi?: number | null
          next_actions?: Json | null
          organization_id?: string
          report_date?: string
          report_period?: string
          revenue_influenced?: number
          revenue_recovered?: number
          risks?: Json | null
          roi_multiple?: number | null
          roi_percentage?: number | null
          subscription_cost?: number | null
          wins?: Json | null
        }
        Relationships: []
      }
      pilot_scorecards: {
        Row: {
          created_at: string
          first_case_study: boolean
          first_journey_completed: boolean
          first_practice_live: boolean
          first_recall_recovered: boolean
          first_referral_generated: boolean
          first_revenue_attribution: boolean
          first_review_generated: boolean
          first_roi_report: boolean
          first_treatment_influence: boolean
          first_video_delivered: boolean
          health_score: number
          id: string
          organization_id: string
          pilot_started_at: string
          pilot_status: string
          tier: string
          total_appointments_confirmed: number
          total_membership_enrollments: number
          total_patients_engaged: number
          total_recall_recovered: number
          total_referrals_generated: number
          total_revenue_influenced: number
          total_revenue_recovered: number
          total_reviews_generated: number
          total_videos_delivered: number
          total_videos_watched: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_case_study?: boolean
          first_journey_completed?: boolean
          first_practice_live?: boolean
          first_recall_recovered?: boolean
          first_referral_generated?: boolean
          first_revenue_attribution?: boolean
          first_review_generated?: boolean
          first_roi_report?: boolean
          first_treatment_influence?: boolean
          first_video_delivered?: boolean
          health_score?: number
          id?: string
          organization_id: string
          pilot_started_at?: string
          pilot_status?: string
          tier?: string
          total_appointments_confirmed?: number
          total_membership_enrollments?: number
          total_patients_engaged?: number
          total_recall_recovered?: number
          total_referrals_generated?: number
          total_revenue_influenced?: number
          total_revenue_recovered?: number
          total_reviews_generated?: number
          total_videos_delivered?: number
          total_videos_watched?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_case_study?: boolean
          first_journey_completed?: boolean
          first_practice_live?: boolean
          first_recall_recovered?: boolean
          first_referral_generated?: boolean
          first_revenue_attribution?: boolean
          first_review_generated?: boolean
          first_roi_report?: boolean
          first_treatment_influence?: boolean
          first_video_delivered?: boolean
          health_score?: number
          id?: string
          organization_id?: string
          pilot_started_at?: string
          pilot_status?: string
          tier?: string
          total_appointments_confirmed?: number
          total_membership_enrollments?: number
          total_patients_engaged?: number
          total_recall_recovered?: number
          total_referrals_generated?: number
          total_revenue_influenced?: number
          total_revenue_recovered?: number
          total_reviews_generated?: number
          total_videos_delivered?: number
          total_videos_watched?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          organization_id: string
          payload: Json
          replayed_at: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          organization_id: string
          payload?: Json
          replayed_at?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          organization_id?: string
          payload?: Json
          replayed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pms_integrations: {
        Row: {
          configuration: Json
          created_at: string
          display_name: string
          failover_provider:
            | Database["public"]["Enums"]["pms_provider_key"]
            | null
          health_score: number
          id: string
          last_success_at: string | null
          last_sync_at: string | null
          location_id: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["pms_provider_key"]
          status: Database["public"]["Enums"]["integration_status"]
          sync_cursor: string | null
          updated_at: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          display_name: string
          failover_provider?:
            | Database["public"]["Enums"]["pms_provider_key"]
            | null
          health_score?: number
          id?: string
          last_success_at?: string | null
          last_sync_at?: string | null
          location_id?: string | null
          organization_id: string
          provider: Database["public"]["Enums"]["pms_provider_key"]
          status?: Database["public"]["Enums"]["integration_status"]
          sync_cursor?: string | null
          updated_at?: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          display_name?: string
          failover_provider?:
            | Database["public"]["Enums"]["pms_provider_key"]
            | null
          health_score?: number
          id?: string
          last_success_at?: string | null
          last_sync_at?: string | null
          location_id?: string | null
          organization_id?: string
          provider?: Database["public"]["Enums"]["pms_provider_key"]
          status?: Database["public"]["Enums"]["integration_status"]
          sync_cursor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pms_integrations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pms_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_benchmarks: {
        Row: {
          benchmark_date: string
          benchmark_type: string | null
          created_at: string | null
          id: string
          metric_name: string
          network_avg: number | null
          organization_id: string
          percentile: number | null
          practice_type_avg: number | null
          practice_value: number | null
          regional_avg: number | null
          trend: string | null
        }
        Insert: {
          benchmark_date?: string
          benchmark_type?: string | null
          created_at?: string | null
          id?: string
          metric_name: string
          network_avg?: number | null
          organization_id: string
          percentile?: number | null
          practice_type_avg?: number | null
          practice_value?: number | null
          regional_avg?: number | null
          trend?: string | null
        }
        Update: {
          benchmark_date?: string
          benchmark_type?: string | null
          created_at?: string | null
          id?: string
          metric_name?: string
          network_avg?: number | null
          organization_id?: string
          percentile?: number | null
          practice_type_avg?: number | null
          practice_value?: number | null
          regional_avg?: number | null
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_benchmarks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_intelligence_snapshots: {
        Row: {
          campaign_intelligence: Json | null
          computed_at: string | null
          created_at: string | null
          id: string
          organization_id: string
          patient_intelligence: Json | null
          practice_intelligence: Json | null
          provider_intelligence: Json | null
          snapshot_date: string
          snapshot_type: string
        }
        Insert: {
          campaign_intelligence?: Json | null
          computed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          patient_intelligence?: Json | null
          practice_intelligence?: Json | null
          provider_intelligence?: Json | null
          snapshot_date: string
          snapshot_type: string
        }
        Update: {
          campaign_intelligence?: Json | null
          computed_at?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          patient_intelligence?: Json | null
          practice_intelligence?: Json | null
          provider_intelligence?: Json | null
          snapshot_date?: string
          snapshot_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_intelligence_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      product_tiers: {
        Row: {
          annual_price: number | null
          created_at: string | null
          features: Json | null
          id: string
          implementation_fee: number | null
          is_active: boolean | null
          max_locations: number | null
          max_providers: number | null
          monthly_price: number
          target_practice_type: string | null
          tier_key: string
          tier_name: string
        }
        Insert: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          implementation_fee?: number | null
          is_active?: boolean | null
          max_locations?: number | null
          max_providers?: number | null
          monthly_price: number
          target_practice_type?: string | null
          tier_key: string
          tier_name: string
        }
        Update: {
          annual_price?: number | null
          created_at?: string | null
          features?: Json | null
          id?: string
          implementation_fee?: number | null
          is_active?: boolean | null
          max_locations?: number | null
          max_providers?: number | null
          monthly_price?: number
          target_practice_type?: string | null
          tier_key?: string
          tier_name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          currency: string
          id: string
          metadata: Json
          name: string
          organization_id: string
          price_cents: number
          sku: string | null
          status: string
          storefront_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          price_cents?: number
          sku?: string | null
          status?: string
          storefront_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          price_cents?: number
          sku?: string | null
          status?: string
          storefront_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_organization_id: string | null
          email: string
          email_verified_at: string | null
          full_name: string
          id: string
          metadata: Json
          onboarding_completed_at: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_organization_id?: string | null
          email: string
          email_verified_at?: string | null
          full_name: string
          id: string
          metadata?: Json
          onboarding_completed_at?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_organization_id?: string | null
          email?: string
          email_verified_at?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          onboarding_completed_at?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_organization_id_fkey"
            columns: ["default_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          organization_id: string
          owner: string | null
          stage: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          owner?: string | null
          stage?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          owner?: string | null
          stage?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "prospects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_health_snapshots: {
        Row: {
          confidence: number
          dependency_impact: number
          failure_rate: number
          id: string
          latency_ms: number | null
          observed_at: string
          organization_id: string
          provider_key: string
          retry_rate: number
          status: string
          uptime_score: number
        }
        Insert: {
          confidence?: number
          dependency_impact?: number
          failure_rate?: number
          id?: string
          latency_ms?: number | null
          observed_at?: string
          organization_id: string
          provider_key: string
          retry_rate?: number
          status?: string
          uptime_score?: number
        }
        Update: {
          confidence?: number
          dependency_impact?: number
          failure_rate?: number
          id?: string
          latency_ms?: number | null
          observed_at?: string
          organization_id?: string
          provider_key?: string
          retry_rate?: number
          status?: string
          uptime_score?: number
        }
        Relationships: []
      }
      provider_performance_snapshots: {
        Row: {
          avatar_watch_rate: number | null
          collections_amount: number | null
          communication_effectiveness: number | null
          created_at: string | null
          id: string
          organization_id: string
          production_amount: number | null
          provider_external_id: string
          referrals_generated: number | null
          revenue_influenced: number | null
          reviews_generated: number | null
          snapshot_date: string
          snapshot_type: string | null
          treatment_acceptance_rate: number | null
          treatments_accepted: number | null
          treatments_proposed: number | null
        }
        Insert: {
          avatar_watch_rate?: number | null
          collections_amount?: number | null
          communication_effectiveness?: number | null
          created_at?: string | null
          id?: string
          organization_id: string
          production_amount?: number | null
          provider_external_id: string
          referrals_generated?: number | null
          revenue_influenced?: number | null
          reviews_generated?: number | null
          snapshot_date?: string
          snapshot_type?: string | null
          treatment_acceptance_rate?: number | null
          treatments_accepted?: number | null
          treatments_proposed?: number | null
        }
        Update: {
          avatar_watch_rate?: number | null
          collections_amount?: number | null
          communication_effectiveness?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string
          production_amount?: number | null
          provider_external_id?: string
          referrals_generated?: number | null
          revenue_influenced?: number | null
          reviews_generated?: number | null
          snapshot_date?: string
          snapshot_type?: string | null
          treatment_acceptance_rate?: number | null
          treatments_accepted?: number | null
          treatments_proposed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_performance_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_video_profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          languages: string[]
          metadata: Json
          organization_id: string
          provider_profile_id: string | null
          specialty: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          languages?: string[]
          metadata?: Json
          organization_id: string
          provider_profile_id?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          languages?: string[]
          metadata?: Json
          organization_id?: string
          provider_profile_id?: string | null
          specialty?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_video_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_video_profiles_provider_profile_id_fkey"
            columns: ["provider_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_events: {
        Row: {
          attempt_count: number
          correlation_id: string
          created_at: string
          dead_letter_reason: string | null
          id: string
          idempotency_key: string
          max_attempts: number
          next_retry_at: string | null
          operational_event_id: string | null
          organization_id: string
          payload: Json
          pipeline: Database["public"]["Enums"]["pipeline_key"]
          status: Database["public"]["Enums"]["queue_status"]
          updated_at: string
          visible_at: string
        }
        Insert: {
          attempt_count?: number
          correlation_id: string
          created_at?: string
          dead_letter_reason?: string | null
          id?: string
          idempotency_key: string
          max_attempts?: number
          next_retry_at?: string | null
          operational_event_id?: string | null
          organization_id: string
          payload?: Json
          pipeline: Database["public"]["Enums"]["pipeline_key"]
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          visible_at?: string
        }
        Update: {
          attempt_count?: number
          correlation_id?: string
          created_at?: string
          dead_letter_reason?: string | null
          id?: string
          idempotency_key?: string
          max_attempts?: number
          next_retry_at?: string | null
          operational_event_id?: string | null
          organization_id?: string
          payload?: Json
          pipeline?: Database["public"]["Enums"]["pipeline_key"]
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
          visible_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_events_operational_event_id_fkey"
            columns: ["operational_event_id"]
            isOneToOne: false
            referencedRelation: "operational_event_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recall_tracking: {
        Row: {
          created_at: string | null
          id: string
          last_outreach_at: string | null
          last_visit_date: string | null
          metadata: Json | null
          months_overdue: number | null
          organization_id: string
          outreach_count: number | null
          patient_external_id: string
          recovered_at: string | null
          revenue_attributed: number | null
          status: string | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_outreach_at?: string | null
          last_visit_date?: string | null
          metadata?: Json | null
          months_overdue?: number | null
          organization_id: string
          outreach_count?: number | null
          patient_external_id: string
          recovered_at?: string | null
          revenue_attributed?: number | null
          status?: string | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_outreach_at?: string | null
          last_visit_date?: string | null
          metadata?: Json | null
          months_overdue?: number | null
          organization_id?: string
          outreach_count?: number | null
          patient_external_id?: string
          recovered_at?: string | null
          revenue_attributed?: number | null
          status?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recall_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_lineage: {
        Row: {
          accepted_at: string | null
          confidence_score: number
          created_at: string
          expected_outcome: string
          historical_effectiveness: number
          id: string
          operational_reasoning: string
          organization_id: string
          outcome_payload: Json
          recommendation_id: string | null
          rejected_at: string | null
          source_event_ids: string[]
          source_signals: Json
          supporting_metrics: Json
        }
        Insert: {
          accepted_at?: string | null
          confidence_score?: number
          created_at?: string
          expected_outcome: string
          historical_effectiveness?: number
          id?: string
          operational_reasoning: string
          organization_id: string
          outcome_payload?: Json
          recommendation_id?: string | null
          rejected_at?: string | null
          source_event_ids?: string[]
          source_signals?: Json
          supporting_metrics?: Json
        }
        Update: {
          accepted_at?: string | null
          confidence_score?: number
          created_at?: string
          expected_outcome?: string
          historical_effectiveness?: number
          id?: string
          operational_reasoning?: string
          organization_id?: string
          outcome_payload?: Json
          recommendation_id?: string | null
          rejected_at?: string | null
          source_event_ids?: string[]
          source_signals?: Json
          supporting_metrics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_lineage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_outcome_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          created_at: string
          expected_impact: string
          id: string
          organization_id: string | null
          practice_id: string | null
          priority: Database["public"]["Enums"]["recommendation_priority"]
          recommendation: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          expected_impact?: string
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          recommendation: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          expected_impact?: string
          id?: string
          organization_id?: string | null
          practice_id?: string | null
          priority?: Database["public"]["Enums"]["recommendation_priority"]
          recommendation?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_actions: {
        Row: {
          action_type: string
          actor: string
          completed_at: string | null
          id: string
          metadata: Json
          organization_id: string
          started_at: string
          status: string
          system_failure_id: string | null
          validated: boolean
        }
        Insert: {
          action_type: string
          actor?: string
          completed_at?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          started_at?: string
          status?: string
          system_failure_id?: string | null
          validated?: boolean
        }
        Update: {
          action_type?: string
          actor?: string
          completed_at?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          started_at?: string
          status?: string
          system_failure_id?: string | null
          validated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "recovery_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_actions_system_failure_id_fkey"
            columns: ["system_failure_id"]
            isOneToOne: false
            referencedRelation: "system_failures"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_orchestration_runs: {
        Row: {
          completed_at: string | null
          confidence: number
          created_at: string
          id: string
          orchestration_key: string
          organization_id: string
          outcome: Json
          risk_level: Database["public"]["Enums"]["runtime_action_risk"]
          sequence: Json
          status: string
        }
        Insert: {
          completed_at?: string | null
          confidence?: number
          created_at?: string
          id?: string
          orchestration_key: string
          organization_id: string
          outcome?: Json
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          sequence?: Json
          status?: string
        }
        Update: {
          completed_at?: string | null
          confidence?: number
          created_at?: string
          id?: string
          orchestration_key?: string
          organization_id?: string
          outcome?: Json
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          sequence?: Json
          status?: string
        }
        Relationships: []
      }
      recovery_results: {
        Row: {
          completed_at: string
          id: string
          metadata: Json
          organization_id: string
          outcome: string
          recovery_action_id: string | null
          recovery_minutes: number
          verification_status: string
        }
        Insert: {
          completed_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          outcome: string
          recovery_action_id?: string | null
          recovery_minutes?: number
          verification_status?: string
        }
        Update: {
          completed_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          outcome?: string
          recovery_action_id?: string | null
          recovery_minutes?: number
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_results_recovery_action_id_fkey"
            columns: ["recovery_action_id"]
            isOneToOne: false
            referencedRelation: "recovery_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_timelines: {
        Row: {
          detail: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          recovery_action_id: string | null
          stage: string
          status: string
          trace_id: string | null
        }
        Insert: {
          detail?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          recovery_action_id?: string | null
          stage: string
          status?: string
          trace_id?: string | null
        }
        Update: {
          detail?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          recovery_action_id?: string | null
          stage?: string
          status?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_timelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_timelines_recovery_action_id_fkey"
            columns: ["recovery_action_id"]
            isOneToOne: false
            referencedRelation: "recovery_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_flywheel_events: {
        Row: {
          advocacy_stage: string
          client_name: string
          created_at: string
          id: string
          organization_id: string
          referral_source: string | null
          referral_target: string | null
          reward_status: string
        }
        Insert: {
          advocacy_stage?: string
          client_name: string
          created_at?: string
          id?: string
          organization_id: string
          referral_source?: string | null
          referral_target?: string | null
          reward_status?: string
        }
        Update: {
          advocacy_stage?: string
          client_name?: string
          created_at?: string
          id?: string
          organization_id?: string
          referral_source?: string | null
          referral_target?: string | null
          reward_status?: string
        }
        Relationships: []
      }
      referral_tracking: {
        Row: {
          campaign_id: string | null
          converted_at: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string
          referral_source: string | null
          referred_patient_external_id: string | null
          referring_patient_external_id: string
          revenue_attributed: number | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          referral_source?: string | null
          referred_patient_external_id?: string | null
          referring_patient_external_id: string
          revenue_attributed?: number | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          converted_at?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          referral_source?: string | null
          referred_patient_external_id?: string | null
          referring_patient_external_id?: string
          revenue_attributed?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          patient_id: string | null
          reason: string | null
          refunded_at: string | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          patient_id?: string | null
          reason?: string | null
          refunded_at?: string | null
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string | null
          reason?: string | null
          refunded_at?: string | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_scores: {
        Row: {
          id: string
          measured_at: string
          metadata: Json
          organization_id: string
          renewal_date: string | null
          renewal_score: number
        }
        Insert: {
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id: string
          renewal_date?: string | null
          renewal_score?: number
        }
        Update: {
          id?: string
          measured_at?: string
          metadata?: Json
          organization_id?: string
          renewal_date?: string | null
          renewal_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "renewal_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      renewals: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          renewal_date: string | null
          renewal_status: string
          renewal_value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          renewal_date?: string | null
          renewal_status?: string
          renewal_value?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          renewal_date?: string | null
          renewal_status?: string
          renewal_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "renewals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      replay_events: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          organization_id: string
          replay_payload: Json
          replay_reason: string
          replay_scope: string
          requested_by: string | null
          source_queue_event_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["replay_status"]
          target_pipeline: Database["public"]["Enums"]["pipeline_key"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          replay_payload?: Json
          replay_reason: string
          replay_scope: string
          requested_by?: string | null
          source_queue_event_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["replay_status"]
          target_pipeline: Database["public"]["Enums"]["pipeline_key"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          replay_payload?: Json
          replay_reason?: string
          replay_scope?: string
          requested_by?: string | null
          source_queue_event_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["replay_status"]
          target_pipeline?: Database["public"]["Enums"]["pipeline_key"]
        }
        Relationships: [
          {
            foreignKeyName: "replay_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replay_events_source_queue_event_id_fkey"
            columns: ["source_queue_event_id"]
            isOneToOne: false
            referencedRelation: "queue_events"
            referencedColumns: ["id"]
          },
        ]
      }
      report_generation_log: {
        Row: {
          downloaded_at: string | null
          generated_at: string
          generated_by: string
          id: string
          organization_id: string | null
          report_id: string
          source_records: Json
          trace_id: string | null
        }
        Insert: {
          downloaded_at?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          organization_id?: string | null
          report_id: string
          source_records?: Json
          trace_id?: string | null
        }
        Update: {
          downloaded_at?: string | null
          generated_at?: string
          generated_by?: string
          id?: string
          organization_id?: string | null
          report_id?: string
          source_records?: Json
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_generation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          generated_at: string
          id: string
          metrics: Json
          organization_id: string | null
          period: Database["public"]["Enums"]["report_period"]
          practice_id: string | null
          recommendations: Json
          report_url: string | null
          summary: string
          title: string
        }
        Insert: {
          generated_at?: string
          id?: string
          metrics?: Json
          organization_id?: string | null
          period: Database["public"]["Enums"]["report_period"]
          practice_id?: string | null
          recommendations?: Json
          report_url?: string | null
          summary: string
          title: string
        }
        Update: {
          generated_at?: string
          id?: string
          metrics?: Json
          organization_id?: string | null
          period?: Database["public"]["Enums"]["report_period"]
          practice_id?: string | null
          recommendations?: Json
          report_url?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          organization_id: string
          patient_external_id: string | null
          platform: string | null
          rating: number | null
          responded_at: string | null
          review_text: string | null
          sentiment: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          patient_external_id?: string | null
          platform?: string | null
          rating?: number | null
          responded_at?: string | null
          review_text?: string | null
          sentiment?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          patient_external_id?: string | null
          platform?: string | null
          rating?: number | null
          responded_at?: string | null
          review_text?: string | null
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resilience_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      revenue_attribution_records: {
        Row: {
          appointment_id: string | null
          attribution_confidence: number
          campaign_id: string | null
          created_at: string
          generated_amount: number
          id: string
          opportunity: string
          organization_id: string | null
          patient_id: string | null
          proof: Json
          protected_amount: number
          recovered_amount: number
          workflow_id: string
        }
        Insert: {
          appointment_id?: string | null
          attribution_confidence?: number
          campaign_id?: string | null
          created_at?: string
          generated_amount?: number
          id?: string
          opportunity?: string
          organization_id?: string | null
          patient_id?: string | null
          proof?: Json
          protected_amount?: number
          recovered_amount?: number
          workflow_id: string
        }
        Update: {
          appointment_id?: string | null
          attribution_confidence?: number
          campaign_id?: string | null
          created_at?: string
          generated_amount?: number
          id?: string
          opportunity?: string
          organization_id?: string | null
          patient_id?: string | null
          proof?: Json
          protected_amount?: number
          recovered_amount?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_attribution_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_attributions: {
        Row: {
          attribution_type: string
          evidence_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          revenue_influenced: number
          trace_id: string | null
          workflow_id: string | null
        }
        Insert: {
          attribution_type: string
          evidence_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          revenue_influenced?: number
          trace_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          attribution_type?: string
          evidence_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          revenue_influenced?: number
          trace_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          revenue_amount: number
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          revenue_amount?: number
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          revenue_amount?: number
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_forecasts: {
        Row: {
          accuracy_score: number | null
          actual_amount: number | null
          confidence_high: number | null
          confidence_low: number | null
          created_at: string | null
          forecast_date: string
          forecast_type: string | null
          forecasted_amount: number | null
          horizon_days: number
          id: string
          model_inputs: Json | null
          organization_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_amount?: number | null
          confidence_high?: number | null
          confidence_low?: number | null
          created_at?: string | null
          forecast_date?: string
          forecast_type?: string | null
          forecasted_amount?: number | null
          horizon_days: number
          id?: string
          model_inputs?: Json | null
          organization_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_amount?: number | null
          confidence_high?: number | null
          confidence_low?: number | null
          created_at?: string | null
          forecast_date?: string
          forecast_type?: string | null
          forecasted_amount?: number | null
          horizon_days?: number
          id?: string
          model_inputs?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_opportunities: {
        Row: {
          actioned_at: string | null
          created_at: string | null
          days_since_recommendation: number | null
          estimated_value: number | null
          id: string
          metadata: Json | null
          opportunity_score: number | null
          opportunity_type: string
          organization_id: string
          patient_external_id: string
          procedure_code: string | null
          procedure_description: string | null
          provider_external_id: string | null
          revenue_realized: number | null
          status: string | null
          won_at: string | null
          workflow_id: string | null
        }
        Insert: {
          actioned_at?: string | null
          created_at?: string | null
          days_since_recommendation?: number | null
          estimated_value?: number | null
          id?: string
          metadata?: Json | null
          opportunity_score?: number | null
          opportunity_type: string
          organization_id: string
          patient_external_id: string
          procedure_code?: string | null
          procedure_description?: string | null
          provider_external_id?: string | null
          revenue_realized?: number | null
          status?: string | null
          won_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          actioned_at?: string | null
          created_at?: string | null
          days_since_recommendation?: number | null
          estimated_value?: number | null
          id?: string
          metadata?: Json | null
          opportunity_score?: number | null
          opportunity_type?: string
          organization_id?: string
          patient_external_id?: string
          procedure_code?: string | null
          procedure_description?: string | null
          provider_external_id?: string | null
          revenue_realized?: number | null
          status?: string | null
          won_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_orchestration_runs: {
        Row: {
          bottlenecks: Json
          chair_utilization: number
          confidence: number
          hygiene_retention: number
          id: string
          leakage_detected: number
          organization_id: string
          recommendations: Json
          recovery_prioritized: number
          run_at: string
        }
        Insert: {
          bottlenecks?: Json
          chair_utilization?: number
          confidence?: number
          hygiene_retention?: number
          id?: string
          leakage_detected?: number
          organization_id: string
          recommendations?: Json
          recovery_prioritized?: number
          run_at?: string
        }
        Update: {
          bottlenecks?: Json
          chair_utilization?: number
          confidence?: number
          hygiene_retention?: number
          id?: string
          leakage_detected?: number
          organization_id?: string
          recommendations?: Json
          recovery_prioritized?: number
          run_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_orchestration_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_assessments: {
        Row: {
          alice_recommendation: string | null
          alice_report: Json
          average_production_per_visit: number
          chair_fill_opportunity: number
          contact_name: string
          created_at: string
          email: string
          id: string
          lead_id: string | null
          locations: number
          monthly_appointments: number
          no_show_rate: number
          phone: string | null
          pms_software: string | null
          practice_health_score: number
          practice_name: string
          providers: number
          recall_opportunity: number
          recall_rate: number | null
          referral_opportunity: number
          revenue_recovery_opportunity: number
          review_opportunity: number
          treatment_acceptance_rate: number | null
          treatment_opportunity: number
        }
        Insert: {
          alice_recommendation?: string | null
          alice_report?: Json
          average_production_per_visit: number
          chair_fill_opportunity: number
          contact_name: string
          created_at?: string
          email: string
          id?: string
          lead_id?: string | null
          locations?: number
          monthly_appointments: number
          no_show_rate: number
          phone?: string | null
          pms_software?: string | null
          practice_health_score: number
          practice_name: string
          providers?: number
          recall_opportunity: number
          recall_rate?: number | null
          referral_opportunity?: number
          revenue_recovery_opportunity: number
          review_opportunity?: number
          treatment_acceptance_rate?: number | null
          treatment_opportunity: number
        }
        Update: {
          alice_recommendation?: string | null
          alice_report?: Json
          average_production_per_visit?: number
          chair_fill_opportunity?: number
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          lead_id?: string | null
          locations?: number
          monthly_appointments?: number
          no_show_rate?: number
          phone?: string | null
          pms_software?: string | null
          practice_health_score?: number
          practice_name?: string
          providers?: number
          recall_opportunity?: number
          recall_rate?: number | null
          referral_opportunity?: number
          revenue_recovery_opportunity?: number
          review_opportunity?: number
          treatment_acceptance_rate?: number | null
          treatment_opportunity?: number
        }
        Relationships: [
          {
            foreignKeyName: "roi_assessments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_calculations: {
        Row: {
          admin_hours_per_day: number
          avg_appointment_value: number
          chair_fill_opportunity: number | null
          chairs: number
          created_at: string
          id: string
          lead_id: string
          monthly_appointments: number
          monthly_revenue_loss: number
          no_show_rate: number
          organization_id: string | null
          practice_health_score: number | null
          recall_opportunity: number | null
          recall_patients_lost: number
          recoverable_revenue: number
          revenue_recovery_opportunity: number | null
          treatment_opportunity: number | null
          yearly_revenue_loss: number
        }
        Insert: {
          admin_hours_per_day: number
          avg_appointment_value: number
          chair_fill_opportunity?: number | null
          chairs: number
          created_at?: string
          id?: string
          lead_id: string
          monthly_appointments: number
          monthly_revenue_loss: number
          no_show_rate: number
          organization_id?: string | null
          practice_health_score?: number | null
          recall_opportunity?: number | null
          recall_patients_lost: number
          recoverable_revenue: number
          revenue_recovery_opportunity?: number | null
          treatment_opportunity?: number | null
          yearly_revenue_loss: number
        }
        Update: {
          admin_hours_per_day?: number
          avg_appointment_value?: number
          chair_fill_opportunity?: number | null
          chairs?: number
          created_at?: string
          id?: string
          lead_id?: string
          monthly_appointments?: number
          monthly_revenue_loss?: number
          no_show_rate?: number
          organization_id?: string | null
          practice_health_score?: number | null
          recall_opportunity?: number | null
          recall_patients_lost?: number
          recoverable_revenue?: number
          revenue_recovery_opportunity?: number | null
          treatment_opportunity?: number | null
          yearly_revenue_loss?: number
        }
        Relationships: [
          {
            foreignKeyName: "roi_calculations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_calculations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_workspace_certifications: {
        Row: {
          actions: boolean
          certification_status: string
          dashboard: boolean
          evidence: Json
          id: string
          navigation: boolean
          organization_id: string | null
          permissions: boolean
          reports: boolean
          role_key: string
          updated_at: string
          workflows: boolean
        }
        Insert: {
          actions?: boolean
          certification_status?: string
          dashboard?: boolean
          evidence?: Json
          id?: string
          navigation?: boolean
          organization_id?: string | null
          permissions?: boolean
          reports?: boolean
          role_key: string
          updated_at?: string
          workflows?: boolean
        }
        Update: {
          actions?: boolean
          certification_status?: string
          dashboard?: boolean
          evidence?: Json
          id?: string
          navigation?: boolean
          organization_id?: string | null
          permissions?: boolean
          reports?: boolean
          role_key?: string
          updated_at?: string
          workflows?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "role_workspace_certifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      runtime_audit_timeline: {
        Row: {
          actor_type: string
          correlation_id: string | null
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string
          severity: Database["public"]["Enums"]["runtime_action_risk"]
          title: string
          trace_id: string | null
        }
        Insert: {
          actor_type?: string
          correlation_id?: string | null
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json
          organization_id: string
          severity?: Database["public"]["Enums"]["runtime_action_risk"]
          title: string
          trace_id?: string | null
        }
        Update: {
          actor_type?: string
          correlation_id?: string | null
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          severity?: Database["public"]["Enums"]["runtime_action_risk"]
          title?: string
          trace_id?: string | null
        }
        Relationships: []
      }
      runtime_event_fabric_events: {
        Row: {
          correlation_id: string | null
          delivered_at: string | null
          event_key: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          published_at: string
          source_system: string
          status: Database["public"]["Enums"]["runtime_fabric_event_status"]
          target_channel: string
        }
        Insert: {
          correlation_id?: string | null
          delivered_at?: string | null
          event_key: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          published_at?: string
          source_system: string
          status?: Database["public"]["Enums"]["runtime_fabric_event_status"]
          target_channel: string
        }
        Update: {
          correlation_id?: string | null
          delivered_at?: string | null
          event_key?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          published_at?: string
          source_system?: string
          status?: Database["public"]["Enums"]["runtime_fabric_event_status"]
          target_channel?: string
        }
        Relationships: []
      }
      runtime_governance_decisions: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          decision_payload: Json
          decision_type: string
          id: string
          organization_id: string
          policy_id: string | null
          requested_by: string | null
          risk_level: Database["public"]["Enums"]["runtime_action_risk"]
          status: Database["public"]["Enums"]["governance_decision_status"]
          trace_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_payload?: Json
          decision_type: string
          id?: string
          organization_id: string
          policy_id?: string | null
          requested_by?: string | null
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          status?: Database["public"]["Enums"]["governance_decision_status"]
          trace_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          decision_payload?: Json
          decision_type?: string
          id?: string
          organization_id?: string
          policy_id?: string | null
          requested_by?: string | null
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
          status?: Database["public"]["Enums"]["governance_decision_status"]
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "runtime_governance_decisions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "runtime_governance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      runtime_governance_policies: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          organization_id: string
          policy_key: string
          policy_name: string
          policy_type: string
          requires_approval: boolean
          risk_threshold: Database["public"]["Enums"]["runtime_action_risk"]
          rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id: string
          policy_key: string
          policy_name: string
          policy_type: string
          requires_approval?: boolean
          risk_threshold?: Database["public"]["Enums"]["runtime_action_risk"]
          rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          organization_id?: string
          policy_key?: string
          policy_name?: string
          policy_type?: string
          requires_approval?: boolean
          risk_threshold?: Database["public"]["Enums"]["runtime_action_risk"]
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      sales_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          created_at: string | null
          id: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          outcome: string | null
          performed_by: string | null
          pipeline_id: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          outcome?: string | null
          performed_by?: string | null
          pipeline_id?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          outcome?: string | null
          performed_by?: string | null
          pipeline_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_activities_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipeline: {
        Row: {
          actual_close_date: string | null
          assigned_to: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          estimated_arr: number | null
          estimated_mrr: number | null
          expected_close_date: string | null
          id: string
          implementation_fee: number | null
          last_activity_at: string | null
          lead_name: string
          lead_source: string | null
          lost_reason: string | null
          metadata: Json | null
          notes: string | null
          practice_name: string | null
          probability: number | null
          stage: string | null
          tier: string | null
        }
        Insert: {
          actual_close_date?: string | null
          assigned_to?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_arr?: number | null
          estimated_mrr?: number | null
          expected_close_date?: string | null
          id?: string
          implementation_fee?: number | null
          last_activity_at?: string | null
          lead_name: string
          lead_source?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          practice_name?: string | null
          probability?: number | null
          stage?: string | null
          tier?: string | null
        }
        Update: {
          actual_close_date?: string | null
          assigned_to?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_arr?: number | null
          estimated_mrr?: number | null
          expected_close_date?: string | null
          id?: string
          implementation_fee?: number | null
          last_activity_at?: string | null
          lead_name?: string
          lead_source?: string | null
          lost_reason?: string | null
          metadata?: Json | null
          notes?: string | null
          practice_name?: string | null
          probability?: number | null
          stage?: string | null
          tier?: string | null
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          deliverables: Json
          id: string
          implementation_price: number | null
          kpi_targets: Json
          monthly_price: number | null
          name: string
          package_key: string
          support_model: string
        }
        Insert: {
          created_at?: string
          deliverables?: Json
          id?: string
          implementation_price?: number | null
          kpi_targets?: Json
          monthly_price?: number | null
          name: string
          package_key: string
          support_model: string
        }
        Update: {
          created_at?: string
          deliverables?: Json
          id?: string
          implementation_price?: number | null
          kpi_targets?: Json
          monthly_price?: number | null
          name?: string
          package_key?: string
          support_model?: string
        }
        Relationships: []
      }
      simulation_accuracy_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      simulation_events: {
        Row: {
          confidence: number
          created_at: string
          event_payload: Json
          event_type: string
          id: string
          location_id: string | null
          organization_id: string
          severity: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary: string
          title: string
        }
        Update: {
          confidence?: number
          created_at?: string
          event_payload?: Json
          event_type?: string
          id?: string
          location_id?: string | null
          organization_id?: string
          severity?: Database["public"]["Enums"]["event_severity"]
          summary?: string
          title?: string
        }
        Relationships: []
      }
      sla_breaches: {
        Row: {
          breach_type: string
          client_sla_id: string | null
          error_budget_consumed: number
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          trace_id: string | null
        }
        Insert: {
          breach_type: string
          client_sla_id?: string | null
          error_budget_consumed?: number
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          trace_id?: string | null
        }
        Update: {
          breach_type?: string
          client_sla_id?: string | null
          error_budget_consumed?: number
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_breaches_client_sla_id_fkey"
            columns: ["client_sla_id"]
            isOneToOne: false
            referencedRelation: "client_slas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_breaches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_events: {
        Row: {
          client_sla_id: string | null
          event_type: string
          id: string
          measured_value: number | null
          metadata: Json
          occurred_at: string
          organization_id: string
          target_value: number | null
          trace_id: string | null
        }
        Insert: {
          client_sla_id?: string | null
          event_type: string
          id?: string
          measured_value?: number | null
          metadata?: Json
          occurred_at?: string
          organization_id: string
          target_value?: number | null
          trace_id?: string | null
        }
        Update: {
          client_sla_id?: string | null
          event_type?: string
          id?: string
          measured_value?: number | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          target_value?: number | null
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_events_client_sla_id_fkey"
            columns: ["client_sla_id"]
            isOneToOne: false
            referencedRelation: "client_slas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_forecasts: {
        Row: {
          forecast_at: string
          forecast_percent: number
          forecast_type: string
          id: string
          metadata: Json
          organization_id: string
          risk_level: string
        }
        Insert: {
          forecast_at?: string
          forecast_percent?: number
          forecast_type: string
          id?: string
          metadata?: Json
          organization_id: string
          risk_level?: string
        }
        Update: {
          forecast_at?: string
          forecast_percent?: number
          forecast_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          risk_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_scores: {
        Row: {
          availability_score: number
          compliance_percent: number
          id: string
          metadata: Json
          organization_id: string
          recovery_score: number
          resolution_score: number
          response_score: number
          score_date: string
        }
        Insert: {
          availability_score?: number
          compliance_percent?: number
          id?: string
          metadata?: Json
          organization_id: string
          recovery_score?: number
          resolution_score?: number
          response_score?: number
          score_date?: string
        }
        Update: {
          availability_score?: number
          compliance_percent?: number
          id?: string
          metadata?: Json
          organization_id?: string
          recovery_score?: number
          resolution_score?: number
          response_score?: number
          score_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_violations: {
        Row: {
          client_sla_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          resolved_at: string | null
          severity: string
          status: string
          violation_type: string
        }
        Insert: {
          client_sla_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          resolved_at?: string | null
          severity?: string
          status?: string
          violation_type: string
        }
        Update: {
          client_sla_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_violations_client_sla_id_fkey"
            columns: ["client_sla_id"]
            isOneToOne: false
            referencedRelation: "client_slas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_violations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_proof_metrics: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_published: boolean
          label: string
          sort_order: number
          sub_label: string | null
          value: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          label: string
          sort_order?: number
          sub_label?: string | null
          value: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          label?: string
          sort_order?: number
          sub_label?: string | null
          value?: string
        }
        Relationships: []
      }
      storefronts: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          settings: Json
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          settings?: Json
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          settings?: Json
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storefronts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_entitlements: {
        Row: {
          active: boolean
          created_at: string
          entitlement_key: string
          id: string
          metadata: Json
          organization_id: string | null
          source_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          entitlement_key: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          source_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          entitlement_key?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          source_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_entitlements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          included_locations: number
          included_usage: Json
          is_active: boolean
          name: string
          plan_key: Database["public"]["Enums"]["subscription_plan_key"]
          price_monthly: number
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          included_locations?: number
          included_usage?: Json
          is_active?: boolean
          name: string
          plan_key: Database["public"]["Enums"]["subscription_plan_key"]
          price_monthly?: number
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          included_locations?: number
          included_usage?: Json
          is_active?: boolean
          name?: string
          plan_key?: Database["public"]["Enums"]["subscription_plan_key"]
          price_monthly?: number
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      swarm_consensus_runs: {
        Row: {
          consensus_key: string
          consensus_score: number
          created_at: string
          evidence: Json
          id: string
          organization_id: string
          participating_agents: string[]
          recommended_action: string
          risk_level: Database["public"]["Enums"]["runtime_action_risk"]
        }
        Insert: {
          consensus_key: string
          consensus_score?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id: string
          participating_agents?: string[]
          recommended_action: string
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
        }
        Update: {
          consensus_key?: string
          consensus_score?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string
          participating_agents?: string[]
          recommended_action?: string
          risk_level?: Database["public"]["Enums"]["runtime_action_risk"]
        }
        Relationships: []
      }
      system_failures: {
        Row: {
          correlation_id: string | null
          detected_at: string
          failure_type: string
          id: string
          metadata: Json
          organization_id: string
          resolved_at: string | null
          severity: string
          source: string
          status: string
          trace_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          detected_at?: string
          failure_type: string
          id?: string
          metadata?: Json
          organization_id: string
          resolved_at?: string | null
          severity?: string
          source: string
          status?: string
          trace_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          detected_at?: string
          failure_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          trace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_failures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_onboarding_runs: {
        Row: {
          created_at: string
          current_step: string
          id: string
          onboarding_key: string
          organization_id: string
          progress: number
          setup_payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_step?: string
          id?: string
          onboarding_key: string
          organization_id: string
          progress?: number
          setup_payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_step?: string
          id?: string
          onboarding_key?: string
          organization_id?: string
          progress?: number
          setup_payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_onboarding_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author_name: string
          author_title: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          organization_id: string | null
          practice_location: string | null
          practice_name: string | null
          quote: string
          rating: number | null
          result_metric: string | null
          result_value: string | null
          short_quote: string | null
          sort_order: number
          source: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_title?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id?: string | null
          practice_location?: string | null
          practice_name?: string | null
          quote: string
          rating?: number | null
          result_metric?: string | null
          result_value?: string | null
          short_quote?: string | null
          sort_order?: number
          source?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_title?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          organization_id?: string | null
          practice_location?: string | null
          practice_name?: string | null
          quote?: string
          rating?: number | null
          result_metric?: string | null
          result_value?: string | null
          short_quote?: string | null
          sort_order?: number
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_assignments: {
        Row: {
          assigned_at: string
          certified_at: string | null
          completed_at: string | null
          id: string
          implementation_project_id: string | null
          metadata: Json
          organization_id: string
          participant_email: string | null
          participant_name: string
          status: string
          training_track_id: string | null
        }
        Insert: {
          assigned_at?: string
          certified_at?: string | null
          completed_at?: string | null
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          organization_id: string
          participant_email?: string | null
          participant_name: string
          status?: string
          training_track_id?: string | null
        }
        Update: {
          assigned_at?: string
          certified_at?: string | null
          completed_at?: string | null
          id?: string
          implementation_project_id?: string | null
          metadata?: Json
          organization_id?: string
          participant_email?: string | null
          participant_name?: string
          status?: string
          training_track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_implementation_project_id_fkey"
            columns: ["implementation_project_id"]
            isOneToOne: false
            referencedRelation: "implementation_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_training_track_id_fkey"
            columns: ["training_track_id"]
            isOneToOne: false
            referencedRelation: "training_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_tracks: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          organization_id: string
          persona: string
          required_modules: string[]
          track_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          persona: string
          required_modules?: string[]
          track_key: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          persona?: string
          required_modules?: string[]
          track_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_tracks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          metadata: Json
          organization_id: string
          patient_id: string | null
          payment_link_id: string | null
          processed_at: string | null
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          organization_id: string
          patient_id?: string | null
          payment_link_id?: string | null
          processed_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          organization_id?: string
          patient_id?: string | null
          payment_link_id?: string | null
          processed_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_acceptances: {
        Row: {
          accepted_amount: number
          accepted_at: string
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
          payment_link_id: string | null
          treatment_plan_id: string | null
        }
        Insert: {
          accepted_amount?: number
          accepted_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
          payment_link_id?: string | null
          treatment_plan_id?: string | null
        }
        Update: {
          accepted_amount?: number
          accepted_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
          payment_link_id?: string | null
          treatment_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_acceptances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_acceptances_payment_link_id_fkey"
            columns: ["payment_link_id"]
            isOneToOne: false
            referencedRelation: "payment_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_acceptances_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_attributions: {
        Row: {
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
          treatment_id: string
        }
        Insert: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          treatment_id: string
        }
        Update: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_declines: {
        Row: {
          declined_amount: number
          declined_at: string
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
          reason: string | null
          treatment_plan_id: string | null
        }
        Insert: {
          declined_amount?: number
          declined_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
          reason?: string | null
          treatment_plan_id?: string | null
        }
        Update: {
          declined_amount?: number
          declined_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
          reason?: string | null
          treatment_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_declines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_declines_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_estimates: {
        Row: {
          created_at: string
          estimate_amount: number
          id: string
          insurance_estimate: number
          metadata: Json
          organization_id: string
          patient_id: string
          patient_responsibility: number
          status: string
          treatment_plan_id: string | null
        }
        Insert: {
          created_at?: string
          estimate_amount?: number
          id?: string
          insurance_estimate?: number
          metadata?: Json
          organization_id: string
          patient_id: string
          patient_responsibility?: number
          status?: string
          treatment_plan_id?: string | null
        }
        Update: {
          created_at?: string
          estimate_amount?: number
          id?: string
          insurance_estimate?: number
          metadata?: Json
          organization_id?: string
          patient_id?: string
          patient_responsibility?: number
          status?: string
          treatment_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_estimates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_estimates_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          patient_id: string
          provider_name: string | null
          status: string
          treatment_cost: number
          treatment_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          patient_id: string
          provider_name?: string | null
          status?: string
          treatment_cost?: number
          treatment_name: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          patient_id?: string
          provider_name?: string | null
          status?: string
          treatment_cost?: number
          treatment_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          counter_key: string
          id: string
          metadata: Json
          organization_id: string | null
          period_end: string
          period_start: string
          quantity: number
          updated_at: string
        }
        Insert: {
          counter_key: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          period_end: string
          period_start: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          counter_key?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          period_end?: string
          period_start?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_metrics: {
        Row: {
          ai_insights_consumed: number
          created_at: string
          id: string
          location_id: string | null
          metric_month: string
          organization_id: string
          portal_users: number
          recalls_processed: number
          reminders_sent: number
          reports_generated: number
          reviews_generated: number
        }
        Insert: {
          ai_insights_consumed?: number
          created_at?: string
          id?: string
          location_id?: string | null
          metric_month: string
          organization_id: string
          portal_users?: number
          recalls_processed?: number
          reminders_sent?: number
          reports_generated?: number
          reviews_generated?: number
        }
        Update: {
          ai_insights_consumed?: number
          created_at?: string
          id?: string
          location_id?: string | null
          metric_month?: string
          organization_id?: string
          portal_users?: number
          recalls_processed?: number
          reminders_sent?: number
          reports_generated?: number
          reviews_generated?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          default_permissions: Json
          description: string
          id: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Insert: {
          created_at?: string
          default_permissions?: Json
          description: string
          id?: string
          role: Database["public"]["Enums"]["organization_role"]
        }
        Update: {
          created_at?: string
          default_permissions?: Json
          description?: string
          id?: string
          role?: Database["public"]["Enums"]["organization_role"]
        }
        Relationships: []
      }
      video_attribution_records: {
        Row: {
          attribution_model: string
          attribution_weight: number
          created_at: string
          evidence: Json
          id: string
          organization_id: string
          revenue_influenced: number
          revenue_protected: number
          revenue_recovered: number
          video_delivery_id: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          attribution_model?: string
          attribution_weight?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id: string
          revenue_influenced?: number
          revenue_protected?: number
          revenue_recovered?: number
          video_delivery_id?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          attribution_model?: string
          attribution_weight?: number
          created_at?: string
          evidence?: Json
          id?: string
          organization_id?: string
          revenue_influenced?: number
          revenue_protected?: number
          revenue_recovered?: number
          video_delivery_id?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_attribution_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_attribution_records_video_delivery_id_fkey"
            columns: ["video_delivery_id"]
            isOneToOne: false
            referencedRelation: "video_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      video_attributions: {
        Row: {
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
          video_id: string
        }
        Insert: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          video_id: string
        }
        Update: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_campaigns: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          journey_key: string
          kpis: Json
          name: string
          objective: string
          organization_id: string
          status: string
          target_rules: Json
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          journey_key: string
          kpis?: Json
          name: string
          objective: string
          organization_id: string
          status?: string
          target_rules?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          journey_key?: string
          kpis?: Json
          name?: string
          objective?: string
          organization_id?: string
          status?: string
          target_rules?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_campaigns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          journey_key: string
          name: string
          organization_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          journey_key: string
          name: string
          organization_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          journey_key?: string
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_deliveries: {
        Row: {
          channel: string
          created_at: string
          decision_journey_id: string | null
          delivered_at: string | null
          delivery_provider: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          journey_step_id: string | null
          metadata: Json
          opened_at: string | null
          organization_id: string
          patient_external_id: string | null
          provider_message_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
          video_campaign_id: string | null
          video_id: string | null
          viewed_at: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          decision_journey_id?: string | null
          delivered_at?: string | null
          delivery_provider?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_step_id?: string | null
          metadata?: Json
          opened_at?: string | null
          organization_id: string
          patient_external_id?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          video_campaign_id?: string | null
          video_id?: string | null
          viewed_at?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          decision_journey_id?: string | null
          delivered_at?: string | null
          delivery_provider?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_step_id?: string | null
          metadata?: Json
          opened_at?: string | null
          organization_id?: string
          patient_external_id?: string | null
          provider_message_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
          video_campaign_id?: string | null
          video_id?: string | null
          viewed_at?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_deliveries_decision_journey_id_fkey"
            columns: ["decision_journey_id"]
            isOneToOne: false
            referencedRelation: "decision_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_deliveries_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_deliveries_video_campaign_id_fkey"
            columns: ["video_campaign_id"]
            isOneToOne: false
            referencedRelation: "video_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_deliveries_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      video_engagement_events: {
        Row: {
          created_at: string
          event_type: string
          event_value: number | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_external_id: string | null
          video_delivery_id: string | null
          video_id: string | null
          watch_percentage: number | null
        }
        Insert: {
          created_at?: string
          event_type: string
          event_value?: number | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_external_id?: string | null
          video_delivery_id?: string | null
          video_id?: string | null
          watch_percentage?: number | null
        }
        Update: {
          created_at?: string
          event_type?: string
          event_value?: number | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_external_id?: string | null
          video_delivery_id?: string | null
          video_id?: string | null
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_engagement_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_engagement_events_video_delivery_id_fkey"
            columns: ["video_delivery_id"]
            isOneToOne: false
            referencedRelation: "video_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_engagement_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
      video_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      video_library: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          language: string
          metadata: Json
          organization_id: string
          provider_video_profile_id: string | null
          status: string
          tags: string[]
          thumbnail_url: string | null
          title: string
          transcript: string | null
          updated_at: string
          version: number
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          language?: string
          metadata?: Json
          organization_id: string
          provider_video_profile_id?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          version?: number
          video_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          language?: string
          metadata?: Json
          organization_id?: string
          provider_video_profile_id?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          version?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_library_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_library_provider_video_profile_id_fkey"
            columns: ["provider_video_profile_id"]
            isOneToOne: false
            referencedRelation: "provider_video_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_templates: {
        Row: {
          body: string
          category_id: string | null
          channel: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          category_id?: string | null
          channel: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          category_id?: string | null
          channel?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_approvals: {
        Row: {
          approved_by: string | null
          created_at: string
          decided_at: string | null
          id: string
          notes: string | null
          requested_by: string | null
          status: string
          workflow_version_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          status?: string
          workflow_version_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          requested_by?: string | null
          status?: string
          workflow_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_approvals_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_attributions: {
        Row: {
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          patient_id: string | null
          revenue_amount: number
          trace_id: string | null
          workflow_id: string
        }
        Insert: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          workflow_id: string
        }
        Update: {
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          patient_id?: string | null
          revenue_amount?: number
          trace_id?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_attributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          audit_metadata: Json
          created_at: string
          id: string
          workflow_definition_id: string | null
          workflow_version_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          audit_metadata?: Json
          created_at?: string
          id?: string
          workflow_definition_id?: string | null
          workflow_version_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          audit_metadata?: Json
          created_at?: string
          id?: string
          workflow_definition_id?: string | null
          workflow_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_audit_logs_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_audit_logs_workflow_version_id_fkey"
            columns: ["workflow_version_id"]
            isOneToOne: false
            referencedRelation: "workflow_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          ai_intervention_enabled: boolean
          created_at: string
          current_version: string
          domain: string
          id: string
          marketplace_category: string | null
          metadata: Json
          name: string
          replayable: boolean
          sla_minutes: number
          status: string
          updated_at: string
          workflow_key: string
        }
        Insert: {
          ai_intervention_enabled?: boolean
          created_at?: string
          current_version?: string
          domain: string
          id?: string
          marketplace_category?: string | null
          metadata?: Json
          name: string
          replayable?: boolean
          sla_minutes?: number
          status?: string
          updated_at?: string
          workflow_key: string
        }
        Update: {
          ai_intervention_enabled?: boolean
          created_at?: string
          current_version?: string
          domain?: string
          id?: string
          marketplace_category?: string | null
          metadata?: Json
          name?: string
          replayable?: boolean
          sla_minutes?: number
          status?: string
          updated_at?: string
          workflow_key?: string
        }
        Relationships: []
      }
      workflow_dependencies: {
        Row: {
          created_at: string
          criticality: string
          dependency_type: string
          depends_on_workflow_key: string
          id: string
          workflow_definition_id: string
        }
        Insert: {
          created_at?: string
          criticality?: string
          dependency_type?: string
          depends_on_workflow_key: string
          id?: string
          workflow_definition_id: string
        }
        Update: {
          created_at?: string
          criticality?: string
          dependency_type?: string
          depends_on_workflow_key?: string
          id?: string
          workflow_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_dependencies_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          status: string
          workflow_run_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          status?: string
          workflow_run_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          status?: string
          workflow_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_evidence: {
        Row: {
          action: string
          actor: string | null
          correlation_id: string | null
          id: string
          metadata: Json
          occurred_at: string
          organization_id: string
          outcome: string | null
          patient_id: string | null
          reason: string | null
          source: string
          trace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source: string
          trace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          correlation_id?: string | null
          id?: string
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          outcome?: string | null
          patient_id?: string | null
          reason?: string | null
          source?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_evidence: {
        Row: {
          affected_entities: Json
          completed_at: string | null
          duration_ms: number | null
          execution_id: string | null
          id: string
          organization_id: string | null
          outcome_summary: string
          revenue_impact: number
          started_at: string
          status: string
          trace_id: string | null
          trigger_source: string
          workflow_id: string
        }
        Insert: {
          affected_entities?: Json
          completed_at?: string | null
          duration_ms?: number | null
          execution_id?: string | null
          id?: string
          organization_id?: string | null
          outcome_summary?: string
          revenue_impact?: number
          started_at?: string
          status?: string
          trace_id?: string | null
          trigger_source: string
          workflow_id: string
        }
        Update: {
          affected_entities?: Json
          completed_at?: string | null
          duration_ms?: number | null
          execution_id?: string | null
          id?: string
          organization_id?: string | null
          outcome_summary?: string
          revenue_impact?: number
          started_at?: string
          status?: string
          trace_id?: string | null
          trigger_source?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_evidence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_recovery_actions: {
        Row: {
          action_type: string
          attempted_at: string
          duration_ms: number | null
          id: string
          recovery_event_id: string | null
          result_summary: string | null
          succeeded: boolean | null
        }
        Insert: {
          action_type: string
          attempted_at?: string
          duration_ms?: number | null
          id?: string
          recovery_event_id?: string | null
          result_summary?: string | null
          succeeded?: boolean | null
        }
        Update: {
          action_type?: string
          attempted_at?: string
          duration_ms?: number | null
          id?: string
          recovery_event_id?: string | null
          result_summary?: string | null
          succeeded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_recovery_actions_recovery_event_id_fkey"
            columns: ["recovery_event_id"]
            isOneToOne: false
            referencedRelation: "workflow_recovery_events"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_recovery_events: {
        Row: {
          detected_at: string
          diagnosis: string | null
          escalation_reason: string | null
          failure_type: string
          id: string
          metadata: Json | null
          organization_id: string | null
          recovery_action: string | null
          resolved_at: string | null
          severity: string
          status: string
          workflow_id: string
        }
        Insert: {
          detected_at?: string
          diagnosis?: string | null
          escalation_reason?: string | null
          failure_type: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          recovery_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          workflow_id: string
        }
        Update: {
          detected_at?: string
          diagnosis?: string | null
          escalation_reason?: string | null
          failure_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          recovery_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_recovery_metrics: {
        Row: {
          active_incidents: number
          automation_reliability_score: number
          created_at: string
          id: string
          mean_time_to_recovery_ms: number | null
          metric_date: string
          organization_id: string | null
          recovery_success_rate: number
          total_failures: number
          total_recoveries: number
          workflow_stability_score: number
        }
        Insert: {
          active_incidents?: number
          automation_reliability_score?: number
          created_at?: string
          id?: string
          mean_time_to_recovery_ms?: number | null
          metric_date?: string
          organization_id?: string | null
          recovery_success_rate?: number
          total_failures?: number
          total_recoveries?: number
          workflow_stability_score?: number
        }
        Update: {
          active_incidents?: number
          automation_reliability_score?: number
          created_at?: string
          id?: string
          mean_time_to_recovery_ms?: number | null
          metric_date?: string
          organization_id?: string | null
          recovery_success_rate?: number
          total_failures?: number
          total_recoveries?: number
          workflow_stability_score?: number
        }
        Relationships: []
      }
      workflow_roi_metrics: {
        Row: {
          attribution_id: string | null
          cost_saved: number
          id: string
          measured_at: string
          revenue_protected: number
          revenue_recovered: number
          roi_metadata: Json
          workflow_definition_id: string | null
        }
        Insert: {
          attribution_id?: string | null
          cost_saved?: number
          id?: string
          measured_at?: string
          revenue_protected?: number
          revenue_recovered?: number
          roi_metadata?: Json
          workflow_definition_id?: string | null
        }
        Update: {
          attribution_id?: string | null
          cost_saved?: number
          id?: string
          measured_at?: string
          revenue_protected?: number
          revenue_recovered?: number
          roi_metadata?: Json
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_roi_metrics_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          correlation_id: string
          id: string
          idempotency_key: string
          latency_ms: number | null
          metadata: Json
          organization_id: string | null
          started_at: string
          status: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          correlation_id: string
          id?: string
          idempotency_key: string
          latency_ms?: number | null
          metadata?: Json
          organization_id?: string | null
          started_at?: string
          status?: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          id?: string
          idempotency_key?: string
          latency_ms?: number | null
          metadata?: Json
          organization_id?: string | null
          started_at?: string
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_sla_events: {
        Row: {
          actual_minutes: number | null
          breached: boolean
          created_at: string
          event_metadata: Json
          event_type: string
          id: string
          runtime_trace_id: string | null
          target_minutes: number
          workflow_definition_id: string | null
        }
        Insert: {
          actual_minutes?: number | null
          breached?: boolean
          created_at?: string
          event_metadata?: Json
          event_type: string
          id?: string
          runtime_trace_id?: string | null
          target_minutes: number
          workflow_definition_id?: string | null
        }
        Update: {
          actual_minutes?: number | null
          breached?: boolean
          created_at?: string
          event_metadata?: Json
          event_type?: string
          id?: string
          runtime_trace_id?: string | null
          target_minutes?: number
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_sla_events_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_versions: {
        Row: {
          created_at: string
          created_by: string | null
          definition: Json
          id: string
          rollback_from_version: string | null
          status: string
          version: string
          workflow_definition_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          id?: string
          rollback_from_version?: string | null
          status?: string
          version: string
          workflow_definition_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          id?: string
          rollback_from_version?: string | null
          status?: string
          version?: string
          workflow_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_versions_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      workflow_executions: {
        Row: {
          completed_at: string | null
          correlation_id: string | null
          created_at: string | null
          failure_reason: string | null
          id: string | null
          idempotency_key: string | null
          latency_ms: number | null
          metadata: Json | null
          organization_id: string | null
          retry_count: number | null
          status: string | null
          workflow_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_message_priority: "low" | "moderate" | "high" | "critical"
      alice_message_role: "user" | "alice" | "system"
      alice_operational_mode:
        | "executive_intelligence"
        | "forecasting"
        | "benchmark_analysis"
        | "enterprise_coordination"
        | "autonomous_recommendation"
        | "operational_risk_analysis"
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "implemented"
        | "rolled_back"
      automation_coverage_status: "complete" | "partial" | "missing" | "risk"
      automation_domain_key:
        | "scheduling_intelligence"
        | "recall_recovery"
        | "review_acceleration"
        | "patient_retention"
        | "revenue_recovery"
        | "staffing_intelligence"
        | "executive_intelligence"
        | "ai_intelligence"
        | "benchmark_intelligence"
        | "enterprise_coordination"
      automation_event_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "skipped"
      automation_failure_category:
        | "infra"
        | "auth"
        | "provider"
        | "timeout"
        | "business_rule"
        | "validation"
        | "dependency"
        | "partial_success"
        | "retry_exhausted"
      automation_trace_stage_status:
        | "started"
        | "completed"
        | "failed"
        | "skipped"
      automation_trace_status: "running" | "completed" | "failed" | "replayed"
      booking_status: "clicked" | "scheduled" | "cancelled" | "completed"
      client_success_status: "healthy" | "watch" | "at_risk" | "expansion_ready"
      cloud_layer_key:
        | "operational_intelligence"
        | "revenue_orchestration"
        | "patient_engagement"
        | "benchmark_intelligence"
        | "autonomous_optimization"
        | "ai_recommendation"
        | "enterprise_governance"
        | "healthcare_api"
        | "operational_memory"
        | "simulation_intelligence"
      confidence_grade: "excellent" | "good" | "watch" | "poor"
      event_severity: "info" | "success" | "warning" | "critical"
      governance_decision_status:
        | "pending"
        | "approved"
        | "rejected"
        | "executed"
        | "rolled_back"
      governance_status:
        | "draft"
        | "review_required"
        | "approved"
        | "rejected"
        | "active"
        | "rolled_back"
      gtm_pipeline_stage:
        | "prospect_identified"
        | "outreach_sent"
        | "loom_audit_delivered"
        | "discovery_booked"
        | "proposal_sent"
        | "closed_won"
        | "onboarding"
        | "live_optimization"
        | "case_study_candidate"
        | "referral_opportunity"
      integration_status:
        | "configured"
        | "syncing"
        | "degraded"
        | "paused"
        | "failed"
      intelligence_run_status:
        | "queued"
        | "running"
        | "passed"
        | "warning"
        | "failed"
      lead_status:
        | "new"
        | "roi_completed"
        | "audit_requested"
        | "booked"
        | "qualified"
        | "won"
        | "lost"
      notification_severity: "info" | "success" | "warning" | "critical"
      onboarding_status:
        | "not_started"
        | "baseline"
        | "workflows"
        | "review"
        | "live"
      onboarding_step_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "blocked"
      operational_agent_status:
        | "active"
        | "watching"
        | "coordinating"
        | "escalating"
        | "degraded"
      operational_extension_status: "draft" | "active" | "paused" | "retired"
      operational_incident_severity: "low" | "moderate" | "high" | "critical"
      operational_incident_status:
        | "open"
        | "mitigating"
        | "resolved"
        | "postmortem"
      organization_role:
        | "owner"
        | "admin"
        | "practice_manager"
        | "front_desk"
        | "analyst"
        | "executive_readonly"
      organization_type:
        | "single_practice"
        | "multi_location"
        | "dso"
        | "enterprise"
      outreach_event_type:
        | "lead_created"
        | "roi_completed"
        | "audit_requested"
        | "booking_clicked"
        | "booking_confirmed"
        | "email_sent"
        | "cta_clicked"
        | "faq_interaction"
        | "funnel_abandoned"
      pipeline_key:
        | "ingestion"
        | "intelligence"
        | "recommendation"
        | "forecasting"
        | "orchestration"
        | "notification"
      playbook_status: "draft" | "active" | "paused" | "retired"
      pms_provider_key:
        | "dentrix"
        | "eaglesoft"
        | "open_dental"
        | "carestream"
        | "future_provider"
      profile_role: "practice_owner" | "staff" | "agency_admin" | "super_admin"
      queue_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "dead_letter"
        | "replayed"
      recommendation_priority: "low" | "medium" | "high" | "critical"
      replay_status:
        | "requested"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      report_period: "weekly" | "monthly"
      runtime_action_risk: "low" | "moderate" | "high" | "critical"
      runtime_fabric_event_status:
        | "published"
        | "delivered"
        | "replayed"
        | "failed"
      subscription_plan_key: "starter" | "growth" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_message_priority: ["low", "moderate", "high", "critical"],
      alice_message_role: ["user", "alice", "system"],
      alice_operational_mode: [
        "executive_intelligence",
        "forecasting",
        "benchmark_analysis",
        "enterprise_coordination",
        "autonomous_recommendation",
        "operational_risk_analysis",
      ],
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "implemented",
        "rolled_back",
      ],
      automation_coverage_status: ["complete", "partial", "missing", "risk"],
      automation_domain_key: [
        "scheduling_intelligence",
        "recall_recovery",
        "review_acceleration",
        "patient_retention",
        "revenue_recovery",
        "staffing_intelligence",
        "executive_intelligence",
        "ai_intelligence",
        "benchmark_intelligence",
        "enterprise_coordination",
      ],
      automation_event_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "skipped",
      ],
      automation_failure_category: [
        "infra",
        "auth",
        "provider",
        "timeout",
        "business_rule",
        "validation",
        "dependency",
        "partial_success",
        "retry_exhausted",
      ],
      automation_trace_stage_status: [
        "started",
        "completed",
        "failed",
        "skipped",
      ],
      automation_trace_status: ["running", "completed", "failed", "replayed"],
      booking_status: ["clicked", "scheduled", "cancelled", "completed"],
      client_success_status: ["healthy", "watch", "at_risk", "expansion_ready"],
      cloud_layer_key: [
        "operational_intelligence",
        "revenue_orchestration",
        "patient_engagement",
        "benchmark_intelligence",
        "autonomous_optimization",
        "ai_recommendation",
        "enterprise_governance",
        "healthcare_api",
        "operational_memory",
        "simulation_intelligence",
      ],
      confidence_grade: ["excellent", "good", "watch", "poor"],
      event_severity: ["info", "success", "warning", "critical"],
      governance_decision_status: [
        "pending",
        "approved",
        "rejected",
        "executed",
        "rolled_back",
      ],
      governance_status: [
        "draft",
        "review_required",
        "approved",
        "rejected",
        "active",
        "rolled_back",
      ],
      gtm_pipeline_stage: [
        "prospect_identified",
        "outreach_sent",
        "loom_audit_delivered",
        "discovery_booked",
        "proposal_sent",
        "closed_won",
        "onboarding",
        "live_optimization",
        "case_study_candidate",
        "referral_opportunity",
      ],
      integration_status: [
        "configured",
        "syncing",
        "degraded",
        "paused",
        "failed",
      ],
      intelligence_run_status: [
        "queued",
        "running",
        "passed",
        "warning",
        "failed",
      ],
      lead_status: [
        "new",
        "roi_completed",
        "audit_requested",
        "booked",
        "qualified",
        "won",
        "lost",
      ],
      notification_severity: ["info", "success", "warning", "critical"],
      onboarding_status: [
        "not_started",
        "baseline",
        "workflows",
        "review",
        "live",
      ],
      onboarding_step_status: [
        "not_started",
        "in_progress",
        "completed",
        "blocked",
      ],
      operational_agent_status: [
        "active",
        "watching",
        "coordinating",
        "escalating",
        "degraded",
      ],
      operational_extension_status: ["draft", "active", "paused", "retired"],
      operational_incident_severity: ["low", "moderate", "high", "critical"],
      operational_incident_status: [
        "open",
        "mitigating",
        "resolved",
        "postmortem",
      ],
      organization_role: [
        "owner",
        "admin",
        "practice_manager",
        "front_desk",
        "analyst",
        "executive_readonly",
      ],
      organization_type: [
        "single_practice",
        "multi_location",
        "dso",
        "enterprise",
      ],
      outreach_event_type: [
        "lead_created",
        "roi_completed",
        "audit_requested",
        "booking_clicked",
        "booking_confirmed",
        "email_sent",
        "cta_clicked",
        "faq_interaction",
        "funnel_abandoned",
      ],
      pipeline_key: [
        "ingestion",
        "intelligence",
        "recommendation",
        "forecasting",
        "orchestration",
        "notification",
      ],
      playbook_status: ["draft", "active", "paused", "retired"],
      pms_provider_key: [
        "dentrix",
        "eaglesoft",
        "open_dental",
        "carestream",
        "future_provider",
      ],
      profile_role: ["practice_owner", "staff", "agency_admin", "super_admin"],
      queue_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "dead_letter",
        "replayed",
      ],
      recommendation_priority: ["low", "medium", "high", "critical"],
      replay_status: [
        "requested",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      report_period: ["weekly", "monthly"],
      runtime_action_risk: ["low", "moderate", "high", "critical"],
      runtime_fabric_event_status: [
        "published",
        "delivered",
        "replayed",
        "failed",
      ],
      subscription_plan_key: ["starter", "growth", "enterprise"],
    },
  },
} as const
