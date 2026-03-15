import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const query = supabase
      .from('campus_stats_view')
      .select(
        'campus_id, campus_name, campus_type, district, total_commitments, total_amount_committed, verified_contributors, verified_amount_total, pending_verification, participation_rate, tier, campus_karma'
      )
      .order('total_commitments', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const ranked = (data || []).map((campus: Record<string, unknown>, index: number) => {
      const totalAmountCommitted = Number(campus.total_amount_committed) || 0;
      return {
        rank: index + 1,
        campus_id: campus.campus_id,
        campus_name: campus.campus_name,
        campus_type: campus.campus_type,
        district: campus.district,
        total_commitments: Number(campus.total_commitments) || 0,
        total_amount_committed: totalAmountCommitted,
        verified_contributors: campus.verified_contributors,
        verified_amount_total: campus.verified_amount_total,
        pending_verification: campus.pending_verification,
        participation_rate: campus.participation_rate,
        tier: campus.tier,
        campus_karma: campus.campus_karma,
      };
    });

    return NextResponse.json(ranked);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
