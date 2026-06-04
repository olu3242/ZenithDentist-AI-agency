BEGIN;

-- ============================================================
-- AI AGENT OS TABLES
-- ============================================================

-- 1. agent_registry (global registry — no organization_id)
CREATE TABLE IF NOT EXISTS agent_registry (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key      text        UNIQUE NOT NULL,
  agent_name     text        NOT NULL,
  domain         text        NOT NULL,
  status         text        DEFAULT 'active',
  description    text,
  capabilities   jsonb       DEFAULT '[]',
  version        text        DEFAULT '1.0.0',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_registry USING (auth.role() = 'service_role');

-- 2. agent_tasks
CREATE TABLE IF NOT EXISTS agent_tasks (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES organizations(id),
  agent_key            text        NOT NULL REFERENCES agent_registry(agent_key),
  task_type            text        NOT NULL,
  priority             text        DEFAULT 'normal',
  status               text        DEFAULT 'pending',
  patient_external_id  text,
  input_context        jsonb       DEFAULT '{}',
  started_at           timestamptz,
  completed_at         timestamptz,
  error_message        text,
  retry_count          int         DEFAULT 0,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_tasks USING (auth.role() = 'service_role');

-- 3. agent_executions
CREATE TABLE IF NOT EXISTS agent_executions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        NOT NULL REFERENCES organizations(id),
  agent_key         text        NOT NULL,
  task_id           uuid        REFERENCES agent_tasks(id),
  execution_status  text        NOT NULL DEFAULT 'running',
  started_at        timestamptz DEFAULT now(),
  completed_at      timestamptz,
  duration_ms       int,
  result_summary    text,
  result_data       jsonb       DEFAULT '{}',
  confidence_score  numeric(4,3),
  tokens_used       int         DEFAULT 0,
  model_used        text,
  fallback_used     boolean     DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_executions USING (auth.role() = 'service_role');

-- 4. agent_recommendations
CREATE TABLE IF NOT EXISTS agent_recommendations (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid        NOT NULL REFERENCES organizations(id),
  agent_key                 text        NOT NULL,
  patient_external_id       text,
  recommendation_type       text        NOT NULL,
  priority                  text        DEFAULT 'normal',
  recommended_action        text        NOT NULL,
  recommended_channel       text,
  recommended_script_theme  text,
  confidence_score          numeric(4,3) DEFAULT 0.750,
  reasoning                 text,
  status                    text        DEFAULT 'pending',
  actioned_at               timestamptz,
  actioned_by               text,
  expires_at                timestamptz,
  workflow_execution_id     text,
  revenue_potential         numeric(12,2) DEFAULT 0,
  created_at                timestamptz DEFAULT now()
);

ALTER TABLE agent_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_recommendations USING (auth.role() = 'service_role');

-- 5. agent_metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
  id                        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           uuid    NOT NULL REFERENCES organizations(id),
  agent_key                 text    NOT NULL,
  metric_date               date    NOT NULL DEFAULT CURRENT_DATE,
  tasks_executed            int     DEFAULT 0,
  tasks_succeeded           int     DEFAULT 0,
  tasks_failed              int     DEFAULT 0,
  avg_confidence            numeric(4,3) DEFAULT 0,
  recommendations_generated int     DEFAULT 0,
  recommendations_actioned  int     DEFAULT 0,
  revenue_influenced        numeric(12,2) DEFAULT 0,
  patients_influenced       int     DEFAULT 0,
  created_at                timestamptz DEFAULT now(),
  UNIQUE(organization_id, agent_key, metric_date)
);

ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_metrics USING (auth.role() = 'service_role');

-- 6. agent_events
CREATE TABLE IF NOT EXISTS agent_events (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES organizations(id),
  agent_key            text        NOT NULL,
  event_type           text        NOT NULL,
  patient_external_id  text,
  task_id              uuid,
  payload              jsonb       DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_events USING (auth.role() = 'service_role');

-- ============================================================
-- INTEGRATION OS TABLES
-- ============================================================

-- 7. integration_registry (global registry — no organization_id)
CREATE TABLE IF NOT EXISTS integration_registry (
  id                   uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key      text  UNIQUE NOT NULL,
  integration_name     text  NOT NULL,
  category             text  NOT NULL,
  description          text,
  version              text  DEFAULT '1.0.0',
  status               text  DEFAULT 'available',
  adapter_class        text,
  required_config_keys jsonb DEFAULT '[]',
  capabilities         jsonb DEFAULT '[]',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE integration_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON integration_registry USING (auth.role() = 'service_role');

-- 8. integration_installations
CREATE TABLE IF NOT EXISTS integration_installations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id),
  integration_key  text        NOT NULL REFERENCES integration_registry(integration_key),
  status           text        DEFAULT 'active',
  config_encrypted jsonb       DEFAULT '{}',
  installed_at     timestamptz DEFAULT now(),
  last_synced_at   timestamptz,
  sync_count       int         DEFAULT 0,
  error_count      int         DEFAULT 0,
  last_error       text,
  metadata         jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  UNIQUE(organization_id, integration_key)
);

ALTER TABLE integration_installations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON integration_installations USING (auth.role() = 'service_role');

-- 9. integration_health
CREATE TABLE IF NOT EXISTS integration_health (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        NOT NULL REFERENCES organizations(id),
  integration_key      text        NOT NULL,
  check_time           timestamptz DEFAULT now(),
  status               text        NOT NULL,
  latency_ms           int,
  error_rate           numeric(5,2) DEFAULT 0,
  last_success_at      timestamptz,
  last_error_at        timestamptz,
  consecutive_failures int         DEFAULT 0,
  details              jsonb       DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON integration_health USING (auth.role() = 'service_role');

-- 10. integration_events
CREATE TABLE IF NOT EXISTS integration_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        NOT NULL REFERENCES organizations(id),
  integration_key  text        NOT NULL,
  event_type       text        NOT NULL,
  status           text,
  records_synced   int         DEFAULT 0,
  duration_ms      int,
  error_message    text,
  payload          jsonb       DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON integration_events USING (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_agent_tasks_org_status          ON agent_tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_org_agent_key       ON agent_tasks(organization_id, agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_org_patient         ON agent_tasks(organization_id, patient_external_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_org_key_start  ON agent_executions(organization_id, agent_key, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_task_id        ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_org_status ON agent_recommendations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_org_patient ON agent_recommendations(organization_id, patient_external_id);
CREATE INDEX IF NOT EXISTS idx_agent_recommendations_org_key   ON agent_recommendations(organization_id, agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_org_key_date      ON agent_metrics(organization_id, agent_key, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_events_org_key_created    ON agent_events(organization_id, agent_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_installations_org   ON integration_installations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_health_org_key_time ON integration_health(organization_id, integration_key, check_time DESC);
CREATE INDEX IF NOT EXISTS idx_integration_events_org_key_time ON integration_events(organization_id, integration_key, created_at DESC);

-- ============================================================
-- SEED: agent_registry
-- ============================================================

INSERT INTO agent_registry (agent_key, agent_name, domain, status, description, capabilities)
VALUES
  ('treatment_coordinator', 'Treatment Coordinator Agent', 'treatment',  'active', 'Monitors treatment plans, predicts acceptance, recommends follow-ups',           '["analyze_treatment","predict_acceptance","recommend_financing","escalate_opportunity"]'),
  ('recall_coordinator',    'Recall Coordinator Agent',    'recall',     'active', 'Identifies overdue patients and launches recall journeys',                        '["identify_overdue","launch_recall","predict_recovery","escalate_high_value"]'),
  ('membership',            'Membership Agent',            'membership', 'active', 'Identifies enrollment opportunities and predicts churn',                          '["identify_enrollment","predict_churn","launch_campaign","track_renewal"]'),
  ('review',                'Review Agent',                'reputation', 'active', 'Identifies satisfied patients and launches review campaigns',                     '["identify_satisfied","launch_review_campaign","track_generation"]'),
  ('referral',              'Referral Agent',              'referral',   'active', 'Identifies promoters and launches referral campaigns',                            '["identify_promoters","launch_campaign","track_conversion","track_revenue"]'),
  ('growth',                'Growth Agent',                'growth',     'active', 'Monitors acquisition, conversions, and recommends growth opportunities',          '["monitor_acquisition","analyze_campaigns","recommend_growth","track_kpis"]'),
  ('compliance',            'Compliance Agent',            'compliance', 'active', 'Monitors HIPAA compliance, consent, and audit readiness',                        '["monitor_hipaa","check_consent","monitor_workflows","audit_readiness"]')
ON CONFLICT (agent_key) DO NOTHING;

-- ============================================================
-- SEED: integration_registry
-- ============================================================

INSERT INTO integration_registry (integration_key, integration_name, category, version, status, capabilities)
VALUES
  ('opendental',     'Open Dental',      'pms',           '2.4.0', 'available', '["get_patients","get_appointments","get_treatments","get_invoices","sync_patient"]'),
  ('dentrix',        'Dentrix',          'pms',           '1.0.0', 'available', '["get_patients","get_appointments","get_treatments"]'),
  ('eaglesoft',      'Eaglesoft',        'pms',           '1.0.0', 'beta',      '["get_patients","get_appointments"]'),
  ('stripe',         'Stripe Payments',  'payment',       '1.0.0', 'available', '["create_payment","create_subscription","sync_payment"]'),
  ('heygen',         'HeyGen',           'video',         '1.0.0', 'available', '["generate_avatar","generate_video","check_status"]'),
  ('elevenlabs',     'ElevenLabs',       'voice',         '1.0.0', 'available', '["create_voice","synthesize_speech","check_status"]'),
  ('twilio',         'Twilio',           'communication', '1.0.0', 'available', '["send_sms","make_call"]'),
  ('resend',         'Resend',           'communication', '1.0.0', 'available', '["send_email"]'),
  ('google_calendar','Google Calendar',  'calendar',      '1.0.0', 'available', '["create_appointment","check_availability","sync_calendar"]')
ON CONFLICT (integration_key) DO NOTHING;

COMMIT;
