-- ============================================================================
-- SEO automation pack runs (parent/child orchestration tracking).
-- One row per "Run Full Site Analysis" with a shared correlation_id. Child
-- results land in area_scores/findings as they complete (partial-failure safe).
-- ============================================================================
CREATE TABLE IF NOT EXISTS n8nmon_pack_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id         text NOT NULL,
  domain          text NOT NULL,
  correlation_id  uuid NOT NULL DEFAULT gen_random_uuid(),
  status          text NOT NULL DEFAULT 'queued', -- queued | running | completed | partial | failed
  overall_score   numeric,
  area_scores     jsonb DEFAULT '{}'::jsonb,
  findings        jsonb DEFAULT '[]'::jsonb,
  report_url      text,
  triggered_via   text NOT NULL DEFAULT 'recorded', -- webhook | recorded
  cost_estimate   numeric,
  created_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_n8nmon_pack_runs_created ON n8nmon_pack_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_n8nmon_pack_runs_domain ON n8nmon_pack_runs(domain);

DROP TRIGGER IF EXISTS trg_n8nmon_pack_runs_updated ON n8nmon_pack_runs;
CREATE TRIGGER trg_n8nmon_pack_runs_updated BEFORE UPDATE ON n8nmon_pack_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE n8nmon_pack_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read pack_runs" ON n8nmon_pack_runs;
CREATE POLICY "auth read pack_runs" ON n8nmon_pack_runs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth insert pack_runs" ON n8nmon_pack_runs;
CREATE POLICY "auth insert pack_runs" ON n8nmon_pack_runs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth update pack_runs" ON n8nmon_pack_runs;
CREATE POLICY "auth update pack_runs" ON n8nmon_pack_runs
  FOR UPDATE TO authenticated USING (true);
