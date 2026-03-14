import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function GET(request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING_VERIFICATION';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const authError = validateAdminKey(request);
    if (authError) return authError;

    let query = supabase
      .from('commitments')
      .select(`
        id, full_name, phone, email, amount_committed, utr_number,
        screenshot_url, status, committed_at, utr_submitted_at,
        verified_at, rejection_reason, campus_id,
        campuses ( name, district )
      `, { count: 'exact' })
      .order('utr_submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Admin commitments error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Admin commitments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
