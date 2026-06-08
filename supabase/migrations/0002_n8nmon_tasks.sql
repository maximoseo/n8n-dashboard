-- ============================================================================
-- Dashboard-generated tasks (from workflow failures / operator actions).
-- Namespaced n8nmon_ to stay isolated from other apps' tables in the shared
-- Supabase project. RLS: authenticated users manage their tasks.
-- ============================================================================
CREATE TABLE IF NOT EXISTS n8nmon_tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  source          text NOT NULL DEFAULT 'manual', -- manual | workflow_failure | audit
  workflow_n8n_id text,
  severity        text DEFAULT 'medium',
  status          text NOT NULL DEFAULT 'open',    -- open | in_progress | done
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8nmon_tasks_status ON n8nmon_tasks(status);
CREATE INDEX IF NOT EXISTS idx_n8nmon_tasks_created ON n8nmon_tasks(created_at DESC);

DROP TRIGGER IF EXISTS trg_n8nmon_tasks_updated ON n8nmon_tasks;
CREATE TRIGGER trg_n8nmon_tasks_updated BEFORE UPDATE ON n8nmon_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE n8nmon_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read tasks" ON n8nmon_tasks;
CREATE POLICY "auth read tasks" ON n8nmon_tasks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth insert tasks" ON n8nmon_tasks;
CREATE POLICY "auth insert tasks" ON n8nmon_tasks
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth update tasks" ON n8nmon_tasks;
CREATE POLICY "auth update tasks" ON n8nmon_tasks
  FOR UPDATE TO authenticated USING (true);
