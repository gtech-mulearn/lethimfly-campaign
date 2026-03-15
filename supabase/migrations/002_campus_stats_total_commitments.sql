-- Add total_commitments to campus_stats_view (counts COMMITTED + PENDING_VERIFICATION + VERIFIED)
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
    END AS campus_karma,
  COALESCE(stats.total_commitments, 0) AS total_commitments,
  COALESCE(stats.total_amount_committed, 0) AS total_amount_committed
FROM campuses c
LEFT JOIN (
  SELECT
    campus_id,
    COUNT(*) FILTER (WHERE status IN ('COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED')) AS total_commitments,
    COALESCE(SUM(amount_committed) FILTER (WHERE status IN ('COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED')), 0) AS total_amount_committed,
    COUNT(*) FILTER (WHERE status = 'VERIFIED') AS verified_contributors,
    COUNT(*) FILTER (WHERE status = 'PENDING_VERIFICATION') AS pending_verification,
    COALESCE(SUM(amount_committed) FILTER (WHERE status = 'VERIFIED'), 0) AS verified_amount_total
  FROM commitments
  GROUP BY campus_id
) stats ON c.id = stats.campus_id
WHERE c.is_active = true;
