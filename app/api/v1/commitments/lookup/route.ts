import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { phone_or_commitment_id } = body as { phone_or_commitment_id: string };

    if (!phone_or_commitment_id || phone_or_commitment_id.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number or commitment ID' },
        { status: 400 }
      );
    }

    const value = phone_or_commitment_id.trim();
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

     
    let query: any;
    if (isUUID) {
      query = supabase
        .from('commitments')
        .select(`
          id, full_name, phone, amount_committed, utr_number,
          status, committed_at, utr_submitted_at, verified_at,
          rejection_reason, campus_id,
          campuses ( name, district )
        `)
        .eq('id', value);
    } else {
      const phoneClean = value.replace(/\D/g, '').replace(/^91/, '');
      query = supabase
        .from('commitments')
        .select(`
          id, full_name, phone, amount_committed, utr_number,
          status, committed_at, utr_submitted_at, verified_at,
          rejection_reason, campus_id,
          campuses ( name, district )
        `)
        .eq('phone', phoneClean)
        .order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: 'No commitments found. Please check your phone number or commitment ID.' },
        { status: 404 }
      );
    }

    const results = data.map((c: Record<string, unknown> & { campuses?: { name?: string; district?: string } | null; phone?: string; status?: string }) => ({
      commitment_id: c.id,
      full_name: c.full_name,
      phone_masked: c.phone ? `****${(c.phone as string).slice(-4)}` : null,
      amount_committed: c.amount_committed,
      status: c.status,
      campus_name: c.campuses?.name,
      campus_district: c.campuses?.district,
      committed_at: c.committed_at,
      utr_submitted_at: c.utr_submitted_at,
      verified_at: c.verified_at,
      rejection_reason: c.rejection_reason,
      can_submit_utr: c.status === 'COMMITTED' || c.status === 'REJECTED',
    }));

    return NextResponse.json(isUUID ? results[0] : results);
  } catch (error) {
    console.error('Lookup API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
