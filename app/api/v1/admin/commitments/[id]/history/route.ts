import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const supabase = createAdminClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, action, before_json, after_json, reason, created_at')
      .eq('entity_type', 'commitment')
      .eq('entity_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
