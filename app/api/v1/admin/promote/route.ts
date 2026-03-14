import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/admin/promote
 * Body: { admin_key: string }
 * Requires: user must be signed in (Supabase session in cookies).
 * If admin_key matches ADMIN_SECRET_KEY, adds the signed-in user's email to admin_users.
 */
export async function POST(request: NextRequest) {
  try {
    const serverKey = process.env.ADMIN_SECRET_KEY;
    if (!serverKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const { admin_key } = body as { admin_key?: string };
    if (!admin_key || admin_key.trim() !== serverKey) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Sign in with Google first, then use the admin key to promote yourself.' },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase().trim();
    const admin = createAdminClient();
    const { error: insertError } = await admin.from('admin_users').upsert(
      { email, role: 'admin', is_active: true },
      { onConflict: 'email', ignoreDuplicates: false }
    );

    if (insertError) {
      console.error('Promote admin insert error:', insertError);
      return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'You are now an admin. You can sign in with Google to access the dashboard.' });
  } catch (err) {
    console.error('Admin promote error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
