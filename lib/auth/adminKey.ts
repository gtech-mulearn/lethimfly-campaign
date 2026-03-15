import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Validates the admin Authorization header: Bearer must be a Supabase JWT for a user
 * whose email is in admin_users (is_active). Returns 401 if invalid, or null if valid.
 */
export async function validateAdminKey(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  return validateAdminSession(request, token);
}

/**
 * Validates that the Bearer token is a Supabase JWT and the user's email is in admin_users.
 * Uses token from argument (e.g. from Authorization header).
 */
async function validateAdminSession(_request: NextRequest, token: string): Promise<NextResponse | null> {
  try {
    const supabase = createAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user?.email) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', user.email.toLowerCase().trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!adminRow) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 401 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
