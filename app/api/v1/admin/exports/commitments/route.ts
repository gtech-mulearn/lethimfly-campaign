import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

/**
 * GET /api/v1/admin/exports/commitments
 * Admin-only. Exports all commitments to CSV.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const supabase = createAdminClient();

    // Fetch all commitments with campus names
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select('*, campuses(campus_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Commitment export error:', error);
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
    }

    // Generate CSV
    const headers = [
      'Commitment ID',
      'Full Name',
      'Phone',
      'Amount',
      'Status',
      'Campus Name',
      'UTR',
      'Committed At',
      'UTR Submitted At',
      'Verified At',
      'Rejection Reason'
    ];
     
    const rows = (commitments || []).map((c: any) => [
      `"${c.id}"`,
      `"${c.full_name}"`,
      `"${c.phone}"`,
      c.amount_committed,
      c.status,
      `"${c.campuses?.campus_name || 'Individual'}"`,
      `"${c.utr || ''}"`,
      c.created_at,
      c.utr_submitted_at || '',
      c.verified_at || '',
      `"${c.rejection_reason || ''}"`
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="all-commitments-export-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
