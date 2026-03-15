import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('campus_stats_view')
      .select('*')
      .order('verified_contributors', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
    }

    // Generate CSV
    const headers = [
      'Campus Name',
      'District',
      'Type',
      'Verified Contributors',
      'Verified Amount',
      'Tier',
      'Campus Karma',
      'Participation Rate',
    ];
     
    const rows = (data || []).map((c: any) => [
      `"${c.campus_name}"`,
      `"${c.district}"`,
      c.campus_type,
      c.verified_contributors,
      c.verified_amount_total,
      c.tier,
      c.campus_karma,
      c.participation_rate || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="campus-karma-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
