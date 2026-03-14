import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/me
 * Call with Authorization: Bearer <supabase_access_token>.
 * Returns { isAdmin, email? } so the frontend knows auth state.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabase = createAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user?.email) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const email = user.email.toLowerCase().trim();
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (adminRow) {
      return NextResponse.json({ isAdmin: true, email });
    }

    return NextResponse.json({ isAdmin: false, email });
  } catch (err) {
    console.error('Admin me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
