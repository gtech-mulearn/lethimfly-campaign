import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function POST(request) {
  try {
    const supabase = createAdminClient();
    
    const authError = validateAdminKey(request);
    if (authError) return authError;

    const body = await request.json();
    const rows = body.rows; // Expected array of { name, district, type }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid data format or empty list' }, { status: 400 });
    }

    // Insert all rows
    const { data, error } = await supabase
      .from('campuses')
      .insert(rows.map(row => ({
        name: row.name.trim(),
        district: row.district || '',
        type: row.type || 'other',
      })))
      .select();

    if (error) {
      console.error('Bulk insert error:', error);
      return NextResponse.json({ error: error.message || 'Failed to bulk insert campuses', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length }, { status: 201 });
  } catch (err) {
    console.error('Bulk campuses import API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
