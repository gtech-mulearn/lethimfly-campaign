import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING_VERIFICATION';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const authError = await validateAdminKey(request);
    if (authError) return authError;

    let query: any = supabase
      .from('commitments')
      .select(
        `
        id, full_name, phone, email, amount_committed, utr_number,
        screenshot_url, status, committed_at, utr_submitted_at,
        verified_at, rejection_reason, campus_id,
        campuses ( name, district )
      `,
        { count: 'exact' }
      )
      .order('utr_submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
