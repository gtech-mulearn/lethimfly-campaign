-- #LetHimFly Campaign Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE campus_type AS ENUM ('engineering', 'nursing', 'poly', 'arts', 'other');
CREATE TYPE commitment_status AS ENUM ('COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'EXPIRED', 'FLAGGED');
CREATE TYPE admin_role AS ENUM ('admin', 'finance_reviewer');

-- ============================================
-- CAMPUSES
-- ============================================
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type campus_type NOT NULL DEFAULT 'other',
  district TEXT NOT NULL DEFAULT '',
  campus_strength INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campuses_district ON campuses(district);
CREATE INDEX idx_campuses_type ON campuses(type);
CREATE INDEX idx_campuses_active ON campuses(is_active);

-- ============================================
-- CAMPAIGN SETTINGS (Singleton)
-- ============================================
CREATE TABLE campaign_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  target_amount BIGINT NOT NULL DEFAULT 5000000,
  k_per_verified_contributor INT NOT NULL DEFAULT 10,
  leaderboard_mode TEXT NOT NULL DEFAULT 'headcount' CHECK (leaderboard_mode IN ('headcount', 'participation')),
  expiry_hours INT NOT NULL DEFAULT 72,
  account_info JSONB NOT NULL DEFAULT '{
    "upi_id": "",
    "account_name": "",
    "account_number": "",
    "ifsc_code": "",
    "bank_name": "",
    "qr_code_url": ""
  }'::jsonb,
  tier_config JSONB NOT NULL DEFAULT '{
    "S": {"min": 2000, "bonus": 500},
    "A": {"min": 1000, "bonus": 300},
    "B": {"min": 500, "bonus": 150},
    "C": {"min": 200, "bonus": 75},
    "D": {"min": 50, "bonus": 25},
    "E": {"min": 0, "bonus": 0}
  }'::jsonb,
  one_verified_per_phone BOOLEAN NOT NULL DEFAULT true,
  screenshot_mandatory BOOLEAN NOT NULL DEFAULT true,
  show_pending_publicly BOOLEAN NOT NULL DEFAULT true,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings row
INSERT INTO campaign_settings (id) VALUES (1);

-- ============================================
-- COMMITMENTS
-- ============================================
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campus_id UUID NOT NULL REFERENCES campuses(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  amount_committed INT NOT NULL DEFAULT 100,
  utr_number TEXT UNIQUE,
  screenshot_url TEXT,
  status commitment_status NOT NULL DEFAULT 'COMMITTED',
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  utr_submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commitments_campus ON commitments(campus_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitments_phone ON commitments(phone);
CREATE INDEX idx_commitments_utr ON commitments(utr_number);
CREATE INDEX idx_commitments_committed_at ON commitments(committed_at);

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_json JSONB,
  after_json JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- CAMPUS STATS VIEW
-- ============================================
CREATE OR REPLACE VIEW campus_stats_view AS
SELECT
  c.id AS campus_id,
  c.name AS campus_name,
  c.type AS campus_type,
  c.district,
  c.campus_strength,
  COALESCE(stats.verified_contributors, 0) AS verified_contributors,
  COALESCE(stats.pending_verification, 0) AS pending_verification,
  COALESCE(stats.verified_amount_total, 0) AS verified_amount_total,
  CASE
    WHEN c.campus_strength IS NOT NULL AND c.campus_strength > 0
    THEN ROUND((COALESCE(stats.verified_contributors, 0)::NUMERIC / c.campus_strength) * 100, 2)
    ELSE NULL
  END AS participation_rate,
  CASE
    WHEN COALESCE(stats.verified_contributors, 0) >= 2000 THEN 'S'
    WHEN COALESCE(stats.verified_contributors, 0) >= 1000 THEN 'A'
    WHEN COALESCE(stats.verified_contributors, 0) >= 500 THEN 'B'
    WHEN COALESCE(stats.verified_contributors, 0) >= 200 THEN 'C'
    WHEN COALESCE(stats.verified_contributors, 0) >= 50 THEN 'D'
    ELSE 'E'
  END AS tier,
  COALESCE(stats.verified_contributors, 0) * (SELECT k_per_verified_contributor FROM campaign_settings WHERE id = 1)
  + CASE
      WHEN COALESCE(stats.verified_contributors, 0) >= 2000 THEN (SELECT (tier_config->'S'->>'bonus')::INT FROM campaign_settings WHERE id = 1)
      WHEN COALESCE(stats.verified_contributors, 0) >= 1000 THEN (SELECT (tier_config->'A'->>'bonus')::INT FROM campaign_settings WHERE id = 1)
      WHEN COALESCE(stats.verified_contributors, 0) >= 500 THEN (SELECT (tier_config->'B'->>'bonus')::INT FROM campaign_settings WHERE id = 1)
      WHEN COALESCE(stats.verified_contributors, 0) >= 200 THEN (SELECT (tier_config->'C'->>'bonus')::INT FROM campaign_settings WHERE id = 1)
      WHEN COALESCE(stats.verified_contributors, 0) >= 50 THEN (SELECT (tier_config->'D'->>'bonus')::INT FROM campaign_settings WHERE id = 1)
      ELSE 0
    END AS campus_karma
FROM campuses c
LEFT JOIN (
  SELECT
    campus_id,
    COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_contributors,
    COUNT(*) FILTER (WHERE status = 'PENDING_VERIFICATION') AS pending_verification,
    COALESCE(SUM(amount_committed) FILTER (WHERE status = 'VERIFIED'), 0) AS verified_amount_total
  FROM commitments
  GROUP BY campus_id
) stats ON c.id = stats.campus_id
WHERE c.is_active = true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read on campuses
CREATE POLICY "Public can read active campuses" ON campuses
  FOR SELECT USING (is_active = true);

-- Public read on campaign settings
CREATE POLICY "Public can read campaign settings" ON campaign_settings
  FOR SELECT USING (true);

-- Public can insert commitments
CREATE POLICY "Public can create commitments" ON commitments
  FOR INSERT WITH CHECK (true);

-- Public can read own commitments (by phone or id)
CREATE POLICY "Public can read commitments" ON commitments
  FOR SELECT USING (true);

-- Service role can do everything (bypasses RLS anyway)
-- These policies are for the anon key usage

-- ============================================
-- STORAGE BUCKET (run separately in Supabase dashboard)
-- ============================================
-- Create a storage bucket called 'screenshots' with:
--   - Public access: OFF
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, application/pdf
