import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const { data: commitments, error } = await supabase
      .from('commitments')
      .select('id, amount_committed')
      .eq('email', user.email)
      .eq('status', 'VERIFIED');

    if (error) {
      console.error('Donation stats query error:', error);
      return NextResponse.json({ error: 'Failed to fetch donation stats' }, { status: 500 });
    }

    const list = commitments || [];
    const donation_count = list.length;
    const total_amount = list.reduce((sum, c) => sum + (c.amount_committed || 0), 0);

    return NextResponse.json({ donation_count, total_amount });
  } catch (err) {
    console.error('Donation stats API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
