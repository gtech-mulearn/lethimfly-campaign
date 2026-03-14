import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch the 50 most recent verified commitments across all campuses
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select(`
        id, 
        full_name, 
        amount_committed, 
        created_at,
        campuses (name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Public global commitments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch global commitments' }, { status: 500 });
    }

    // Format the response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedData = commitments.map((c: any) => ({
      id: c.id,
      full_name: c.full_name,
      amount_committed: c.amount_committed,
      created_at: c.created_at,
      campus_name: c.campuses?.name || 'Unknown Campus',
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Public global commitments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
