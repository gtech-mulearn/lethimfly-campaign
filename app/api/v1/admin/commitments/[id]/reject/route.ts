import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();
    const { reason } = body as { reason: string };

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'Rejection reason is required (min 3 characters)' },
        { status: 400 }
      );
    }

    // Fetch current commitment
    const { data: commitment, error: fetchError } = await supabase
      .from('commitments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    if (commitment.status !== 'PENDING_VERIFICATION' && commitment.status !== 'FLAGGED') {
      return NextResponse.json(
        { error: `Cannot reject a commitment with status: ${commitment.status}` },
        { status: 400 }
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from('commitments')
      .update({
        status: 'REJECTED',
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'REJECT_COMMITMENT',
      entity_type: 'commitment',
      entity_id: id,
      before_json: { status: commitment.status },
      after_json: { status: 'REJECTED', rejection_reason: reason.trim() },
      reason: reason.trim(),
    });

    return NextResponse.json({ status: 'REJECTED', message: 'Commitment rejected' });
  } catch (error) {
    console.error('Reject API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
