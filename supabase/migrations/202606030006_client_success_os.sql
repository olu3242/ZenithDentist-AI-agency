BEGIN;

-- =============================================================================
-- Client Success OS + Pilot Operations
-- Tables: implementation_projects, implementation_tasks, implementation_milestones,
--         client_health_scores, pilot_health_events, alice_outcome_records,
--         journey_scheduled_steps
-- Note: client_accounts already exists (migration 20260625000000)
-- =============================================================================

-- 1. implementation_projects
CREATE TABLE IF NOT EXISTS implementation_projects (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_account_id    uuid,
    project_name         text NOT NULL,
    phase                text NOT NULL DEFAULT 'signed',
                         -- 'signed','discovery','configuration','integration','testing','training','go_live','optimization','completed'
    health_status        text NOT NULL DEFAULT 'on_track',
                         -- 'on_track','at_risk','blocked','completed'
    start_date           date,
    target_go_live_date  date,
    actual_go_live_date  date,
    assigned_csm         text,
    notes                text,
    metadata             jsonb NOT NULL DEFAULT '{}',
    created_at           timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id)
);

ALTER TABLE implementation_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'implementation_projects' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON implementation_projects
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 2. implementation_tasks
CREATE TABLE IF NOT EXISTS implementation_tasks (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id       uuid REFERENCES implementation_projects(id) ON DELETE CASCADE,
    task_key         text NOT NULL,
                     -- 'pms_connected','comms_connected','avatar_ready','voice_ready',
                     -- 'journeys_deployed','alice_active','revenue_tracking_active'
    task_name        text NOT NULL,
    category         text,
                     -- 'technical','training','content','integration'
    status           text NOT NULL DEFAULT 'pending',
                     -- 'pending','in_progress','completed','blocked','skipped'
    due_offset_days  int NOT NULL DEFAULT 0,
    completed_at     timestamptz,
    completed_by     text,
    evidence         text,
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE implementation_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'implementation_tasks' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON implementation_tasks
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 3. implementation_milestones
CREATE TABLE IF NOT EXISTS implementation_milestones (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id       uuid REFERENCES implementation_projects(id) ON DELETE CASCADE,
    milestone_name   text NOT NULL,
    target_day       int NOT NULL,  -- day number (3, 7, 14, 21, 30)
    status           text NOT NULL DEFAULT 'pending',
                     -- 'pending','achieved','missed','at_risk'
    achieved_at      timestamptz,
    kpis             jsonb NOT NULL DEFAULT '{}',
    notes            text,
    created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE implementation_milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'implementation_milestones' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON implementation_milestones
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 4. client_health_scores
CREATE TABLE IF NOT EXISTS client_health_scores (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id             uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    score_date                  date NOT NULL DEFAULT CURRENT_DATE,
    overall_score               numeric(5,2) NOT NULL DEFAULT 0,
    usage_score                 numeric(5,2) NOT NULL DEFAULT 0,
    journey_completion_score    numeric(5,2) NOT NULL DEFAULT 0,
    patient_engagement_score    numeric(5,2) NOT NULL DEFAULT 0,
    revenue_attribution_score   numeric(5,2) NOT NULL DEFAULT 0,
    communication_health_score  numeric(5,2) NOT NULL DEFAULT 0,
    provider_adoption_score     numeric(5,2) NOT NULL DEFAULT 0,
    health_tier                 text NOT NULL DEFAULT 'yellow',
                                -- 'green' (>=80), 'yellow' (60-79), 'red' (<60)
    top_risk                    text,
    top_opportunity             text,
    created_at                  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, score_date)
);

ALTER TABLE client_health_scores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_health_scores' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON client_health_scores
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 5. pilot_health_events
CREATE TABLE IF NOT EXISTS pilot_health_events (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type           text NOT NULL,
                         -- 'journey_delivered','patient_engaged','alice_recommendation',
                         -- 'revenue_attributed','avatar_activated','voice_activated','pms_connected'
    event_detail         jsonb NOT NULL DEFAULT '{}',
    patient_external_id  text,
    milestone_day        int,  -- which day of pilot (1-30)
    created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pilot_health_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pilot_health_events' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON pilot_health_events
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 6. alice_outcome_records
CREATE TABLE IF NOT EXISTS alice_outcome_records (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alice_decision_id       uuid,  -- references alice_patient_decisions, no FK constraint
    patient_external_id     text NOT NULL,
    decision_type           text NOT NULL,
    recommended_action      text,
    outcome_type            text,
                            -- 'appointment_booked','treatment_accepted','review_submitted',
                            -- 'membership_enrolled','referral_converted','recall_recovered','no_outcome'
    outcome_recorded_at     timestamptz,
    days_to_outcome         int,
    revenue_attributed      numeric(12,2) NOT NULL DEFAULT 0,
    attribution_confidence  numeric(4,3) NOT NULL DEFAULT 0.500,
    feedback_signal         text,  -- 'positive','negative','neutral'
    workflow_execution_id   text,
    created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE alice_outcome_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alice_outcome_records' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON alice_outcome_records
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 7. journey_scheduled_steps
CREATE TABLE IF NOT EXISTS journey_scheduled_steps (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    journey_assignment_id uuid NOT NULL,  -- references journey_assignments
    step_order            int NOT NULL,
    channel               text NOT NULL,
    script_template_id    uuid,
    scheduled_for         timestamptz NOT NULL,
    status                text NOT NULL DEFAULT 'scheduled',
                          -- 'scheduled','executing','delivered','failed','skipped'
    executed_at           timestamptz,
    delivered_at          timestamptz,
    error_message         text,
    metadata              jsonb NOT NULL DEFAULT '{}',
    created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journey_scheduled_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'journey_scheduled_steps' AND policyname = 'service_role_all'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_all ON journey_scheduled_steps
      FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_implementation_projects_org
    ON implementation_projects(organization_id);

CREATE INDEX IF NOT EXISTS idx_implementation_tasks_project_status
    ON implementation_tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_implementation_tasks_org_task_key
    ON implementation_tasks(organization_id, task_key);

CREATE INDEX IF NOT EXISTS idx_implementation_milestones_project
    ON implementation_milestones(project_id);

CREATE INDEX IF NOT EXISTS idx_client_health_scores_org_date
    ON client_health_scores(organization_id, score_date DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_health_events_org_type_created
    ON pilot_health_events(organization_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alice_outcome_records_org_outcome
    ON alice_outcome_records(organization_id, outcome_type);

CREATE INDEX IF NOT EXISTS idx_alice_outcome_records_org_patient
    ON alice_outcome_records(organization_id, patient_external_id);

CREATE INDEX IF NOT EXISTS idx_journey_scheduled_steps_org_status_scheduled
    ON journey_scheduled_steps(organization_id, status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_journey_scheduled_steps_assignment
    ON journey_scheduled_steps(journey_assignment_id);

-- =============================================================================
-- SEED: Standard implementation task template keys (reference comment)
-- task_keys: pms_connected, communication_setup, avatar_training, voice_training,
--            welcome_journey_deployed, recall_journey_deployed, review_journey_deployed,
--            alice_active, revenue_tracking_active, mission_control_active
-- These are inserted per-project at project creation time by the application layer.
-- =============================================================================

COMMIT;
