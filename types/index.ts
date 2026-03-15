// Campus and related types
export type CampusType = 'engineering' | 'nursing' | 'polytechnic' | 'arts_science' | 'other';
export type CommitmentStatus =
  | 'COMMITTED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FLAGGED';

export interface Campus {
  id: string;
  name: string;
  type: CampusType;
  district: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampusStats {
  campus_id: string;
  campus_name: string;
  campus_type: CampusType;
  district: string;
  campus_strength: number | null;
  total_commitments?: number;
  total_amount_committed?: number;
  verified_contributors: number;
  pending_verification: number;
  verified_amount_total: number;
  participation_rate: number | null;
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E';
  campus_karma: number;
}

export interface Commitment {
  id: string;
  campus_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  amount_committed: number;
  utr_number: string | null;
  screenshot_url: string | null;
  status: CommitmentStatus;
  committed_at: string;
  utr_submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  campuses?: { name: string; district?: string } | null;
}

export interface AccountInfo {
  upi_id: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  qr_code_url: string;
}

export interface TierConfig {
  min: number;
  bonus: number;
}

export interface CampaignSettings {
  id: number;
  target_amount: number;
  k_per_verified_contributor: number;
  leaderboard_mode: 'headcount' | 'participation';
  expiry_hours: number;
  account_info: AccountInfo;
  tier_config: Record<string, TierConfig>;
  one_verified_per_phone: boolean;
  screenshot_mandatory: boolean;
  show_pending_publicly: boolean;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignInfo extends CampaignSettings {
  verified_contributors_total: number;
  pending_verification_total: number;
  verified_amount_total: number;
  total_commitments_total: number;
  total_amount_committed: number;
  total_active_campuses: number;
  days_left: number | null;
  leaderboard_visible: boolean;
}

export interface PublicCommitment {
  id: string;
  full_name: string;
  amount_committed: number;
  created_at: string;
  campus_name: string;
}

export interface RankedCampus extends CampusStats {
  rank: number;
}

export type CampusScore = CampusStats;
