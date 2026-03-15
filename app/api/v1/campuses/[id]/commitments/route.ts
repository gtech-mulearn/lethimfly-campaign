import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    // Await params as required by Next.js 15+ dynamic route segment conventions
    const { id } = await params;

    const { data, error } = await supabase
      .from('commitments')
      .select('id, full_name, amount_committed, created_at, phone')
      .eq('campus_id', id)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Campus commitments query error:', error);
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
    }

    // Map over data to add user_hash and remove raw phone number
    const processedData = (data || []).map((c) => {
      const userHash = c.phone
        ? crypto.createHash('md5').update(c.phone).digest('hex')
        : c.id; // fallback to distinct id if no phone

      return {
        id: c.id,
        full_name: c.full_name,
        amount_committed: c.amount_committed,
        created_at: c.created_at,
        user_hash: userHash
      };
    });

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Campus commitments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
