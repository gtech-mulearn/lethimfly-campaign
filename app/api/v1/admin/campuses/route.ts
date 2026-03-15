import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { name, type, district } = body as { name: string; type: string; district: string };

    const authError = await validateAdminKey(request);
    if (authError) return authError;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Campus name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campuses')
      .insert({
        name: name.trim(),
        type: type || 'other',
        district: district || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Create campus error:', error);
      return NextResponse.json({ error: 'Failed to create campus' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Campuses API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
