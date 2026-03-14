import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    // Parse multipart form data
    const formData = await request.formData();
    const utr_number = formData.get('utr_number') as string | null;
    const screenshot_file = formData.get('screenshot_file') as File | null;

    // Validations
    if (!utr_number || utr_number.trim().length < 6) {
      return NextResponse.json(
        { error: 'Valid UTR/Transaction reference is required (min 6 characters)' },
        { status: 400 }
      );
    }

    // Get campaign settings to check if screenshot is mandatory
    const { data: settings } = await supabase
      .from('campaign_settings')
      .select('screenshot_mandatory')
      .eq('id', 1)
      .single();

    if (settings?.screenshot_mandatory && !screenshot_file) {
      return NextResponse.json(
        { error: 'Screenshot upload is required' },
        { status: 400 }
      );
    }

    // Check commitment exists and is in correct state
    const { data: commitment, error: fetchError } = await supabase
      .from('commitments')
      .select('id, status, phone')
      .eq('id', id)
      .single();

    if (fetchError || !commitment) {
      return NextResponse.json(
        { error: 'Commitment not found' },
        { status: 404 }
      );
    }

    if (commitment.status !== 'COMMITTED' && commitment.status !== 'REJECTED') {
      return NextResponse.json(
        { error: `Cannot submit UTR for a commitment with status: ${commitment.status}` },
        { status: 400 }
      );
    }

    // Check UTR uniqueness
    const { data: existingUTR } = await supabase
      .from('commitments')
      .select('id')
      .eq('utr_number', utr_number.trim())
      .neq('id', id);

    if (existingUTR && existingUTR.length > 0) {
      return NextResponse.json(
        { error: 'This UTR/Transaction reference has already been used' },
        { status: 409 }
      );
    }

    // Upload screenshot if provided
    let screenshot_url: string | null = null;
    if (screenshot_file && screenshot_file.size > 0) {
      // Validate file size (5MB max)
      if (screenshot_file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Screenshot file must be less than 5MB' },
          { status: 400 }
        );
      }

      // Validate MIME type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(screenshot_file.type)) {
        return NextResponse.json(
          { error: 'Screenshot must be a JPG, PNG, or PDF file' },
          { status: 400 }
        );
      }

      const ext =
        screenshot_file.type === 'application/pdf'
          ? 'pdf'
          : screenshot_file.type === 'image/png'
          ? 'png'
          : 'jpg';
      const fileName = `${id}_${Date.now()}.${ext}`;

      const buffer = Buffer.from(await screenshot_file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(fileName, buffer, {
          contentType: screenshot_file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload screenshot' },
          { status: 500 }
        );
      }

      screenshot_url = fileName;
    }

    // Update commitment
    const updateData: Record<string, string | null> = {
      utr_number: utr_number.trim(),
      status: 'PENDING_VERIFICATION',
      utr_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (screenshot_url) {
      updateData.screenshot_url = screenshot_url;
    }

    // Clear rejection reason on resubmit
    if (commitment.status === 'REJECTED') {
      updateData.rejection_reason = null;
    }

    const { error: updateError } = await supabase
      .from('commitments')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update commitment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'PENDING_VERIFICATION',
      message: 'UTR submitted successfully. Your payment will be verified shortly.',
    });
  } catch (error) {
    console.error('Submit UTR API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
