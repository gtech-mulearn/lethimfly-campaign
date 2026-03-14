import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'headcount';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from('campus_stats_view').select('*');

    if (mode === 'participation') {
      query = query
        .not('participation_rate', 'is', null)
        .order('participation_rate', { ascending: false });
    } else {
      query = query.order('verified_contributors', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Leaderboard query error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    const ranked = (data || []).map((campus: Record<string, unknown>, index: number) => ({
      rank: index + 1,
      campus_id: campus.campus_id,
      campus_name: campus.campus_name,
      campus_type: campus.campus_type,
      district: campus.district,
      verified_contributors: campus.verified_contributors,
      verified_amount_total: campus.verified_amount_total,
      pending_verification: campus.pending_verification,
      participation_rate: campus.participation_rate,
      tier: campus.tier,
      campus_karma: campus.campus_karma,
    }));

    return NextResponse.json(ranked);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
