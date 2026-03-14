import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    const body = await request.json();
    const { note } = body;

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
        { error: `Cannot verify a commitment with status: ${commitment.status}` },
        { status: 400 }
      );
    }

    // Update status
    const { error: updateError } = await supabase
      .from('commitments')
      .update({
        status: 'VERIFIED',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to verify' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action: 'VERIFY_COMMITMENT',
      entity_type: 'commitment',
      entity_id: id,
      before_json: { status: commitment.status },
      after_json: { status: 'VERIFIED' },
      reason: note || null,
    });

    return NextResponse.json({ status: 'VERIFIED', message: 'Commitment verified' });
  } catch (error) {
    console.error('Verify API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
