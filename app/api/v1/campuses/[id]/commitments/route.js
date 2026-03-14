import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(request, { params }) {
  try {
    const supabase = createAdminClient();
    // Await params as required by Next.js 15+ dynamic route segment conventions
    const { id } = await params;

    const { data, error } = await supabase
      .from('commitments')
      .select('id, full_name, amount_committed, created_at')
      .eq('campus_id', id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Campus commitments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Campus commitments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
