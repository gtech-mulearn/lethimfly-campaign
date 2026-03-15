import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Campus ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('campus_stats_view')
      .select('*')
      .eq('campus_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Campus by ID API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
