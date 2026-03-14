import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/me/commitments
 * Returns all commitments for the signed-in user (by email).
 * Same shape as lookup API for use on the track page.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('commitments')
      .select(`
        id, full_name, phone, amount_committed, utr_number,
        status, committed_at, utr_submitted_at, verified_at,
        rejection_reason, campus_id,
        campuses ( name, district )
      `)
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Me commitments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
    }

    const list = (data || []).map((c: Record<string, unknown> & { campuses?: { name?: string } | null; phone?: string; status?: string }) => ({
      commitment_id: c.id,
      full_name: c.full_name,
      phone_masked: c.phone ? `****${(c.phone as string).slice(-4)}` : null,
      amount_committed: c.amount_committed,
      status: c.status,
      campus_name: (c.campuses as { name?: string } | null)?.name,
      committed_at: c.committed_at,
      utr_submitted_at: c.utr_submitted_at,
      verified_at: c.verified_at,
      rejection_reason: c.rejection_reason,
      can_submit_utr: c.status === 'COMMITTED' || c.status === 'REJECTED',
    }));

    return NextResponse.json(list);
  } catch (err) {
    console.error('Me commitments API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
