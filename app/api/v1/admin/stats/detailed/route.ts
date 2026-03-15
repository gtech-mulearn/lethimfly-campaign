import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { validateAdminKey } from '@/lib/auth/adminKey';

type CampusRel = { district: string; type: string } | null;
type CommitmentRow = {
  status: string;
  amount_committed: number;
  campus_id: string;
  campuses: CampusRel | CampusRel[]; // Supabase may return single object or array
};

/**
 * GET /api/v1/admin/stats/detailed
 * Admin-only. Returns aggregated stats: by district, by org type, by campus, by status.
 */
export async function GET(request: NextRequest) {
  try {
    const authError = await validateAdminKey(request);
    if (authError) return authError;

    const supabase = createAdminClient();

    const { data: commitments, error: commError } = await supabase
      .from('commitments')
      .select('status, amount_committed, campus_id, campuses(district, type)');

    if (commError) {
      console.error('Admin stats commitments error:', commError);
      return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
    }

    const rawRows = (commitments || []) as CommitmentRow[];
    const rows = rawRows.map((r) => ({
      ...r,
      campuses: Array.isArray(r.campuses) ? r.campuses[0] ?? null : r.campuses,
    })) as { status: string; amount_committed: number; campuses: CampusRel }[];

    const activeStatuses = ['COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED'];
    const byDistrict: Record<
      string,
      { total_commitments: number; total_amount: number; verified_count: number; verified_amount: number }
    > = {};
    const byType: Record<
      string,
      { total_commitments: number; total_amount: number; verified_count: number; verified_amount: number }
    > = {};
    const byStatus: Record<string, number> = {};

    for (const r of rows) {
      const district = r.campuses?.district ?? '(unknown)';
      const type = r.campuses?.type ?? 'other';
      const isActive = activeStatuses.includes(r.status);
      const isVerified = r.status === 'VERIFIED';

      if (!byDistrict[district]) {
        byDistrict[district] = { total_commitments: 0, total_amount: 0, verified_count: 0, verified_amount: 0 };
      }
      if (!byType[type]) {
        byType[type] = { total_commitments: 0, total_amount: 0, verified_count: 0, verified_amount: 0 };
      }
      if (!byStatus[r.status]) byStatus[r.status] = 0;

      if (isActive) {
        byDistrict[district].total_commitments += 1;
        byDistrict[district].total_amount += r.amount_committed;
        byType[type].total_commitments += 1;
        byType[type].total_amount += r.amount_committed;
      }
      if (isVerified) {
        byDistrict[district].verified_count += 1;
        byDistrict[district].verified_amount += r.amount_committed;
        byType[type].verified_count += 1;
        byType[type].verified_amount += r.amount_committed;
      }
      byStatus[r.status] += 1;
    }

    const { data: campusStats, error: campusError } = await supabase
      .from('campus_stats_view')
      .select('*')
      .order('total_commitments', { ascending: false });

    if (campusError) {
      console.error('Admin stats campus view error:', campusError);
    }

    const byDistrictList = Object.entries(byDistrict)
      .map(([district, v]) => ({ district, ...v }))
      .sort((a, b) => b.total_commitments - a.total_commitments);

    const byTypeList = Object.entries(byType)
      .map(([campus_type, v]) => ({ campus_type, ...v }))
      .sort((a, b) => b.total_commitments - a.total_commitments);

    const byStatusList = Object.entries(byStatus).map(([status, count]) => ({ status, count }));

    const summary = {
      total_commitments: rows.filter((r) => activeStatuses.includes(r.status)).length,
      total_amount_committed: rows
        .filter((r) => activeStatuses.includes(r.status))
        .reduce((s, r) => s + r.amount_committed, 0),
      verified_count: rows.filter((r) => r.status === 'VERIFIED').length,
      verified_amount: rows.filter((r) => r.status === 'VERIFIED').reduce((s, r) => s + r.amount_committed, 0),
      pending_count: rows.filter((r) => r.status === 'PENDING_VERIFICATION').length,
    };

    return NextResponse.json({
      summary,
      by_district: byDistrictList,
      by_type: byTypeList,
      by_campus: campusStats || [],
      by_status: byStatusList,
    });
  } catch (err) {
    console.error('Admin stats detailed API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
