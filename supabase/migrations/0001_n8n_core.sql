-- ============================================================================
-- n8n monitoring dashboard — core read-only sync tables (cached metrics +
-- execution history) + audit log.
--
-- IMPORTANT: the Supabase project is SHARED across several Maximo apps and
-- already contains unrelated tables named `n8n_workflows`, `workflows`,
-- `executions`, `n8n_sync_log`, etc. To avoid clobbering them, this dashboard
-- owns its data under the `n8nmon_` prefix exclusively.
--
-- RLS: authenticated users may READ; only the service role (bypasses RLS)
-- writes, via the sync job. No anon access.
-- ============================================================================

-- One row per connected n8n instance (also holds last-sync status).
CREATE TABLE IF NOT EXISTS n8nmon_instances (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  base_url      text NOT NULL UNIQUE,
  environment   text NOT NULL DEFAULT 'production',
  instance_type text NOT NULL DEFAULT 'n8n_cloud',
  api_status    text,
  read_only     boolean NOT NULL DEFAULT true,
  last_sync_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Normalized workflow metadata + cached health/risk metrics.
CREATE TABLE IF NOT EXISTS n8nmon_workflows (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id           uuid NOT NULL REFERENCES n8nmon_instances(id) ON DELETE CASCADE,
  n8n_workflow_id       text NOT NULL,
  name                  text NOT NULL,
  active                boolean,
  category              text,
  trigger_type          text,
  trigger_count         integer DEFAULT 0,
  tags                  jsonb DEFAULT '[]'::jsonb,
  total_executions      integer DEFAULT 0,
  success_rate_24h      numeric,
  success_rate_7d       numeric,
  avg_duration_ms       integer,
  p95_duration_ms       integer,
  last_execution_id     text,
  last_execution_status text,
  last_execution_at     timestamptz,
  health_score          numeric,
  risk_score            numeric,
  health_band           text,
  raw_metadata          jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, n8n_workflow_id)
);

-- Recent execution history (rolling window written by sync).
CREATE TABLE IF NOT EXISTS n8nmon_executions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id            uuid NOT NULL REFERENCES n8nmon_instances(id) ON DELETE CASCADE,
  workflow_uuid          uuid REFERENCES n8nmon_workflows(id) ON DELETE CASCADE,
  n8n_workflow_id        text NOT NULL,
  n8n_execution_id       text NOT NULL,
  status                 text NOT NULL,
  mode                   text,
  started_at             timestamptz,
  finished_at            timestamptz,
  duration_ms            integer,
  failed_node            text,
  error_type             text,
  error_message_redacted text,
  error_fingerprint      text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, n8n_execution_id)
);

CREATE INDEX IF NOT EXISTS idx_n8nmon_workflows_instance ON n8nmon_workflows(instance_id);
CREATE INDEX IF NOT EXISTS idx_n8nmon_workflows_risk ON n8nmon_workflows(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_n8nmon_executions_workflow ON n8nmon_executions(workflow_uuid);
CREATE INDEX IF NOT EXISTS idx_n8nmon_executions_status ON n8nmon_executions(status);
CREATE INDEX IF NOT EXISTS idx_n8nmon_executions_started ON n8nmon_executions(started_at DESC);

-- Append-only audit log for sensitive dashboard ops. Matches the repo's
-- database_schema.sql definition; created here because the shared project does
-- not have it yet. IF NOT EXISTS keeps it safe if it is added elsewhere later.
CREATE TABLE IF NOT EXISTS dashboard_audit_log (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       text,
  action        text NOT NULL,
  resource_type text,
  resource_id   text,
  details       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- updated_at touch trigger.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trg_n8nmon_instances_updated ON n8nmon_instances;
CREATE TRIGGER trg_n8nmon_instances_updated BEFORE UPDATE ON n8nmon_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_n8nmon_workflows_updated ON n8nmon_workflows;
CREATE TRIGGER trg_n8nmon_workflows_updated BEFORE UPDATE ON n8nmon_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Row-Level Security: authenticated read-only; service role writes (bypasses RLS).
-- ----------------------------------------------------------------------------
ALTER TABLE n8nmon_instances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8nmon_workflows    ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8nmon_executions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read n8nmon_instances" ON n8nmon_instances;
CREATE POLICY "auth read n8nmon_instances" ON n8nmon_instances
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read n8nmon_workflows" ON n8nmon_workflows;
CREATE POLICY "auth read n8nmon_workflows" ON n8nmon_workflows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read n8nmon_executions" ON n8nmon_executions;
CREATE POLICY "auth read n8nmon_executions" ON n8nmon_executions
  FOR SELECT TO authenticated USING (true);

-- Audit log: authenticated may read their own rows; inserts come from the
-- service role only (bypasses RLS) so no INSERT policy is granted to clients.
DROP POLICY IF EXISTS "auth read own audit" ON dashboard_audit_log;
CREATE POLICY "auth read own audit" ON dashboard_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

SELECT 'n8nmon core tables + audit log created' AS status;
