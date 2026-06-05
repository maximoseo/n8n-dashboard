-- ============================================
-- N8N Dashboard Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Workflow Sheet Mappings Table
-- Links workflows to their associated Google Sheets
CREATE TABLE IF NOT EXISTS workflow_sheet_mappings (
  workflow_id TEXT PRIMARY KEY,
  sheet_url TEXT,
  sheet_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for security
ALTER TABLE workflow_sheet_mappings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access" ON workflow_sheet_mappings
  FOR SELECT TO authenticated USING (true);

-- Allow insert/update for authenticated users
CREATE POLICY "Allow insert access" ON workflow_sheet_mappings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access" ON workflow_sheet_mappings
  FOR UPDATE TO authenticated USING (true);

-- 2. Monitoring Config Table
-- Stores daily monitoring settings for workflows
CREATE TABLE IF NOT EXISTS monitoring_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  expected_schedule TEXT, -- cron expression
  alert_email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access" ON monitoring_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert access" ON monitoring_config
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update access" ON monitoring_config
  FOR UPDATE TO authenticated USING (true);

-- 3. Audit Log Table (if not exists)
-- Tracks user actions for compliance
CREATE TABLE IF NOT EXISTS dashboard_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE dashboard_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own logs" ON dashboard_audit_log
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Allow insert logs" ON dashboard_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. API Keys Storage (encrypted)
-- Stores user API keys securely
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read own keys" ON user_api_keys
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

CREATE POLICY "Allow insert own keys" ON user_api_keys
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Allow update own keys" ON user_api_keys
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);

-- Create function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_workflow_sheet_mappings_updated_at
  BEFORE UPDATE ON workflow_sheet_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_config_updated_at
  BEFORE UPDATE ON monitoring_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional)
-- ============================================

-- Insert sample sheet mappings
INSERT INTO workflow_sheet_mappings (workflow_id, sheet_url, sheet_name) VALUES
  ('1', 'https://docs.google.com/spreadsheets/d/example1', 'URL Screenshots Log'),
  ('2', 'https://docs.google.com/spreadsheets/d/example2', 'WordPress Sites Database'),
  ('3', 'https://docs.google.com/spreadsheets/d/example3', 'Keyword Research Q3')
ON CONFLICT (workflow_id) DO NOTHING;

-- ============================================
-- Verify tables created
-- ============================================
SELECT 'Tables created successfully' as status;
