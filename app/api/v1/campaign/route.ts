import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data: settings, error: settingsError } = await supabase
      .from('campaign_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      return NextResponse.json({ error: 'Failed to fetch campaign settings' }, { status: 500 });
    }

    const [metricsResult, campusesResult] = await Promise.all([
      supabase.from('commitments').select('status, amount_committed, campus_id'),
      supabase.from('campuses').select('campus_id', { count: 'exact', head: true }).eq('active', true),
    ]);

    let verified_amount_total = 0;
    let verified_contributors_total = 0;
    let pending_verification_total = 0;
    let total_commitments_total = 0;
    let total_amount_committed = 0;
    const campusesWithCommitments = new Set<string>();

    if (!metricsResult.error && metricsResult.data) {
      metricsResult.data.forEach((c: { status: string; amount_committed: number; campus_id: string }) => {
        if (c.status === 'VERIFIED') {
          verified_amount_total += c.amount_committed;
          verified_contributors_total++;
        } else if (c.status === 'PENDING_VERIFICATION') {
          pending_verification_total++;
        }
        if (['COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED'].includes(c.status)) {
          total_commitments_total++;
          total_amount_committed += c.amount_committed;
          if (c.campus_id) campusesWithCommitments.add(c.campus_id);
        }
      });
    }

    return NextResponse.json({
      target_amount: settings.target_amount,
      verified_amount_total,
      verified_contributors_total,
      pending_verification_total,
      total_commitments_total,
      total_amount_committed,
      total_active_campuses: campusesWithCommitments.size,
      end_at: settings.end_at,
      leaderboard_mode: settings.leaderboard_mode,
      account_info: settings.account_info,
      show_pending_publicly: settings.show_pending_publicly,
      screenshot_mandatory: settings.screenshot_mandatory ?? false,
      one_verified_per_phone: settings.one_verified_per_phone ?? false,
      leaderboard_visible: settings.leaderboard_visible !== false,
    });
  } catch (error) {
    console.error('Campaign API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
