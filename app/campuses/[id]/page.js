import Link from 'next/link';
import ShareButton from '@/components/ShareButton';

async function getCampusData(id) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/campuses`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const campuses = await res.json();
    return (campuses || []).find((c) => c.campus_id === id) || null;
  } catch {
    return null;
  }
}

async function getCampusCommitments(id) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/campuses/${id}/commitments`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return await res.json() || [];
  } catch {
    return [];
  }
}

export default async function CampusDetailPage({ params }) {
  const { id } = await params;
  const campus = await getCampusData(id);
  const commitments = await getCampusCommitments(id);

  if (!campus) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div className="empty-state">
          <div className="icon">🏫</div>
          <h3>Campus Not Found</h3>
          <p>This campus doesn&apos;t exist or is no longer active.</p>
          <Link href="/campuses" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Browse Campuses
          </Link>
        </div>
      </div>
    );
  }

  // Calculate "to next tier"
  const tierThresholds = {
    E: { next: 'D', need: 50 },
    D: { next: 'C', need: 200 },
    C: { next: 'B', need: 500 },
    B: { next: 'A', need: 1000 },
    A: { next: 'S', need: 2000 },
    S: { next: null, need: null },
  };
  const tierInfo = tierThresholds[campus.tier] || {};
  const toNextTier = tierInfo.need ? tierInfo.need - campus.verified_contributors : null;

  // Compute top committers
  const sortedByAmount = [...commitments].sort((a,b) => b.amount_committed - a.amount_committed);
  const topCommitters = sortedByAmount.slice(0, 5);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '800px' }}>
      {/* Campus Hero */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-8)', background: 'var(--gradient-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, marginBottom: 'var(--space-2)' }}>
              {campus.campus_name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
              {campus.district} • {campus.campus_type}
            </p>
          </div>
          <span className={`tier-badge tier-${campus.tier}`} style={{ fontSize: 'var(--text-lg)', padding: 'var(--space-2) var(--space-5)' }}>
            Tier {campus.tier}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="metrics-strip" style={{ paddingTop: 'var(--space-6)', paddingBottom: 0 }}>
          <div className="metric-card">
            <div className="metric-value green">{campus.verified_contributors}</div>
            <div className="metric-label">Verified</div>
          </div>
          <div className="metric-card">
            <div className="metric-value pink">{campus.pending_verification}</div>
            <div className="metric-label">Pending</div>
          </div>
          <div className="metric-card">
            <div className="metric-value gold">₹{(campus.verified_amount_total || 0).toLocaleString('en-IN')}</div>
            <div className="metric-label">Total Raised</div>
          </div>
          <div className="metric-card">
            <div className="metric-value blue">{campus.campus_karma}</div>
            <div className="metric-label">Campus Karma</div>
          </div>
        </div>

        {/* To next tier */}
        {toNextTier !== null && toNextTier > 0 && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              🎯 <strong style={{ color: 'var(--accent-primary)' }}>{toNextTier}</strong> more verified contributors to reach{' '}
              <span className={`tier-badge tier-${tierInfo.next}`} style={{ verticalAlign: 'middle' }}>Tier {tierInfo.next}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <Link
          href={`?commit=true&campus=${id}`}
          scroll={false}
          className="btn btn-primary btn-lg"
          style={{ textAlign: 'center' }}
        >
          🪂 Commit to the cause
        </Link>
        <ShareButton
          title={`Commit to the cause — ${campus.campus_name} — #LetHimFly`}
          campusId={id}
        />
      </div>

      {/* Top Committers Section */}
      <div style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-8)' }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 'var(--space-6)', fontSize: 'var(--text-2xl)' }}>
          🏆 Top Committers
        </h2>
        {topCommitters.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            {topCommitters.map((c, i) => (
              <div key={c.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: i < 3 ? 'var(--accent-gold)' : 'var(--text-muted)', width: '28px', textAlign: 'center' }}>
                  #{i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-green)', fontWeight: 600 }}>₹{c.amount_committed.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No commitments yet. Be the first!</p>
        )}
      </div>

      {/* Recent Commitments Feed */}
      <div style={{ marginTop: 'var(--space-12)', marginBottom: 'var(--space-12)' }}>
        <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 'var(--space-6)', fontSize: 'var(--text-2xl)' }}>
          📜 Campus Feed
        </h2>
        {commitments.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {commitments.map((c, i) => (
              <div key={c.id} style={{ padding: 'var(--space-4)', borderBottom: i < commitments.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)' }}>
                    🪂
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{c.amount_committed.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No recent activity to show.</p>
        )}
      </div>

      {/* Back to campuses */}
      <div style={{ textAlign: 'center' }}>
        <Link href="/campuses" className="btn btn-secondary btn-sm">
          ← Back to Campuses
        </Link>
      </div>
    </div>
  );
}
