import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * PATCH /api/v1/admin/campaign-settings
 * Admin-only. Updates campaign_settings (id=1): account_info and/or screenshot_mandatory.
 * Body: { account_info?: {...}, screenshot_mandatory?: boolean, one_verified_per_phone?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const body = await request.json().catch(() => ({}));
    const supabase = createAdminClient();

    const { data: current } = await supabase
      .from('campaign_settings')
      .select('account_info, screenshot_mandatory, one_verified_per_phone')
      .eq('id', 1)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Campaign settings not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.screenshot_mandatory === 'boolean') {
      updates.screenshot_mandatory = body.screenshot_mandatory;
    }

    if (typeof body.one_verified_per_phone === 'boolean') {
      updates.one_verified_per_phone = body.one_verified_per_phone;
    }

    if (body.account_info && typeof body.account_info === 'object') {
      const prev = (current.account_info as Record<string, string>) || {};
      updates.account_info = {
        upi_id: body.account_info.upi_id !== undefined ? String(body.account_info.upi_id) : prev.upi_id ?? '',
        qr_code_url: body.account_info.qr_code_url !== undefined ? String(body.account_info.qr_code_url) : prev.qr_code_url ?? '',
        account_name: body.account_info.account_name !== undefined ? String(body.account_info.account_name) : prev.account_name ?? '',
        account_number: body.account_info.account_number !== undefined ? String(body.account_info.account_number) : prev.account_number ?? '',
        ifsc_code: body.account_info.ifsc_code !== undefined ? String(body.account_info.ifsc_code) : prev.ifsc_code ?? '',
        bank_name: body.account_info.bank_name !== undefined ? String(body.account_info.bank_name) : prev.bank_name ?? '',
      };
    }

    const { error } = await supabase
      .from('campaign_settings')
      .update(updates)
      .eq('id', 1);

    if (error) {
      console.error('Admin campaign-settings update error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // Immediately bust the Next.js cache for public pages that render bank/campaign details
    revalidateTag('campaign-settings', 'default');
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin campaign-settings API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
