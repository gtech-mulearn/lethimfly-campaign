import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const district = searchParams.get('district') || '';
    const type = searchParams.get('type') || '';

     
    let query: any = supabase
      .from('campus_stats_view')
      .select('*')
      .order('verified_contributors', { ascending: false });

    if (search) {
      query = query.ilike('campus_name', `%${search}%`);
    }
    if (district) {
      query = query.eq('district', district);
    }
    if (type) {
      query = query.eq('campus_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Campuses query error:', error);
      return NextResponse.json({ error: 'Failed to fetch campuses' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Campuses API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
