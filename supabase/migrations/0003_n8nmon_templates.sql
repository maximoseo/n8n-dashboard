-- ============================================================================
-- Automation template library + AI-builder drafts (namespaced n8nmon_).
-- workflow_json holds an exported/draft n8n workflow. install_mode controls how
-- it is delivered (export JSON / draft via API / guide-only). RLS: authenticated CRUD.
-- ============================================================================
CREATE TABLE IF NOT EXISTS n8nmon_templates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  category             text NOT NULL DEFAULT 'general',
  description          text,
  required_credentials jsonb DEFAULT '[]'::jsonb,
  required_inputs      jsonb DEFAULT '[]'::jsonb,
  workflow_json        jsonb,
  install_mode         text NOT NULL DEFAULT 'export_json', -- export_json | draft_via_api | guide_only
  source_workflow_id   text,
  origin               text NOT NULL DEFAULT 'import',       -- import | ai_builder
  status               text NOT NULL DEFAULT 'draft',        -- draft | published | archived
  created_by           text,
  last_tested_at       timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_n8nmon_templates_category ON n8nmon_templates(category);
CREATE INDEX IF NOT EXISTS idx_n8nmon_templates_status ON n8nmon_templates(status);

DROP TRIGGER IF EXISTS trg_n8nmon_templates_updated ON n8nmon_templates;
CREATE TRIGGER trg_n8nmon_templates_updated BEFORE UPDATE ON n8nmon_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE n8nmon_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read templates" ON n8nmon_templates;
CREATE POLICY "auth read templates" ON n8nmon_templates
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth insert templates" ON n8nmon_templates;
CREATE POLICY "auth insert templates" ON n8nmon_templates
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth update templates" ON n8nmon_templates;
CREATE POLICY "auth update templates" ON n8nmon_templates
  FOR UPDATE TO authenticated USING (true);
