import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { campus_id, full_name, phone, email, amount_committed } = body as {
      campus_id: string;
      full_name: string;
      phone: string;
      email?: string;
      amount_committed?: number;
    };

    if (!campus_id || !full_name || !phone) {
      return NextResponse.json(
        { error: 'campus_id, full_name, and phone are required' },
        { status: 400 }
      );
    }

    if (full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const phoneClean = phone.replace(/\D/g, '').replace(/^91/, '');
    if (phoneClean.length !== 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit phone number' },
        { status: 400 }
      );
    }

    const { data: campus, error: campusError } = await supabase
      .from('campuses')
      .select('id, name')
      .eq('id', campus_id)
      .eq('is_active', true)
      .single();

    if (campusError || !campus) {
      return NextResponse.json({ error: 'Campus not found or inactive' }, { status: 404 });
    }

    const { data: settings } = await supabase
      .from('campaign_settings')
      .select('one_verified_per_phone')
      .eq('id', 1)
      .single();

    if (settings?.one_verified_per_phone) {
      const { data: existing } = await supabase
        .from('commitments')
        .select('id, status')
        .eq('phone', phoneClean)
        .in('status', ['COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED']);

      if (existing && existing.length > 0) {
        const hasVerified = existing.some((c: { status: string }) => c.status === 'VERIFIED');
        if (hasVerified) {
          return NextResponse.json(
            { error: 'This phone number already has a verified commitment' },
            { status: 409 }
          );
        }
        const hasPending = existing.some(
          (c: { status: string }) =>
            c.status === 'COMMITTED' || c.status === 'PENDING_VERIFICATION'
        );
        if (hasPending) {
          return NextResponse.json(
            {
              error:
                'You already have a pending commitment. Track its status or wait for verification.',
              existing_id: existing[0].id,
            },
            { status: 409 }
          );
        }
      }
    }

    const { data: commitment, error: insertError } = await supabase
      .from('commitments')
      .insert({
        campus_id,
        full_name: full_name.trim(),
        phone: phoneClean,
        email: email?.trim() || null,
        amount_committed: amount_committed ?? 1,
        status: 'COMMITTED',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert commitment error:', insertError);
      return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 });
    }

    return NextResponse.json(
      {
        commitment_id: commitment.id,
        status: commitment.status,
        campus_name: campus.name,
        amount_committed: commitment.amount_committed,
        share_payload: {
          text: `I just committed ₹${commitment.amount_committed} for Syam Kumar to fly for India 🇮🇳 via ${campus.name}! Join the #LetHimFly campaign!`,
          url: '',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Commitments API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
