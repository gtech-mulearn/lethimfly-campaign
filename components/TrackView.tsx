'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface TrackResult {
  commitment_id: string;
  full_name: string;
  amount_committed: number;
  campus_name: string;
  phone_masked: string | null;
  status: 'COMMITTED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  committed_at: string;
  utr_submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
  can_submit_utr: boolean;
}

export default function TrackView() {
  const [userSession, setUserSession] = useState<{ email: string } | null>(null);
  const [commitments, setCommitments] = useState<TrackResult[]>([]);
  const [stats, setStats] = useState<{ donation_count: number; total_amount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserSession({ email: session.user.email });
      } else {
        setUserSession(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!userSession) return;

    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch('/api/v1/me/commitments', { credentials: 'include' }),
      fetch('/api/v1/me/donation-stats', { credentials: 'include' }),
    ])
      .then(async ([commitmentsRes, statsRes]) => {
        if (cancelled) return;
        const commitmentsData = commitmentsRes.ok ? await commitmentsRes.json() : [];
        const statsData = statsRes.ok ? await statsRes.json() : null;
        setCommitments(Array.isArray(commitmentsData) ? commitmentsData : []);
        setStats(statsData && typeof statsData.donation_count === 'number' ? statsData : null);
      })
      .catch(() => {
        if (!cancelled) setCommitments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userSession]);

  const statusSteps = ['COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED'];
  const getStatusIndex = (status: TrackResult['status']) => {
    if (status === 'VERIFIED') return 2;
    if (status === 'PENDING_VERIFICATION') return 1;
    return 0;
  };

  const renderCommitmentCard = (r: TrackResult) => (
    <div key={r.commitment_id} className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Commitment
          </span>
          <p style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
            {r.commitment_id}
          </p>
        </div>
        <span className={`status-badge status-${r.status}`}>{r.status.replace('_', ' ')}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Amount</span>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-gold)' }}>₹{r.amount_committed}</p>
        </div>
        <div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Campus</span>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{r.campus_name || '-'}</p>
        </div>
      </div>

      <div className="status-timeline">
        {statusSteps.map((step, i) => {
          const currentIdx = getStatusIndex(r.status);
          const isCompleted = i < currentIdx || (i === currentIdx && r.status !== 'REJECTED');
          const isError = r.status === 'REJECTED' && i === 1;
          const label =
            step === 'COMMITTED' ? r.committed_at : step === 'PENDING_VERIFICATION' ? r.utr_submitted_at : r.verified_at;
          return (
            <div key={step} className="timeline-step">
              <div className={`timeline-dot ${isError ? 'error' : isCompleted ? 'completed' : ''}`}>
                {isCompleted && !isError && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
                {isError && <span style={{ color: '#fff', fontSize: '10px' }}>✕</span>}
              </div>
              <div className="timeline-content">
                <h4>{step.replace('_', ' ')}</h4>
                {label && (
                  <p>
                    {new Date(label).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {r.status === 'REJECTED' && r.rejection_reason && (
        <div
          style={{
            padding: 'var(--space-3)',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-3)',
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-red)' }}>
            <strong>Rejection reason:</strong> {r.rejection_reason}
          </p>
        </div>
      )}

      {r.can_submit_utr && (
        <Link
          href={`/pay?commitment=${r.commitment_id}`}
          className="btn btn-primary btn-sm"
          style={{ width: '100%', marginTop: 'var(--space-4)' }}
        >
          {r.status === 'REJECTED' ? 'Resubmit UTR' : 'Submit UTR'}
        </Link>
      )}
    </div>
  );

  if (!userSession && !loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '500px', textAlign: 'center' }}>
        <h1 className="section-title">My Commitments</h1>
        <p className="section-subtitle">Sign in with Google to view your commitments and track their status.</p>
        <button
          type="button"
          onClick={() => {
            const supabase = createClient();
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/track` },
            });
          }}
          className="btn btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'var(--space-4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '650px' }}>
        <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-4)' }} />
        <div className="skeleton" style={{ height: '120px', marginBottom: 'var(--space-4)' }} />
        <div className="skeleton" style={{ height: '200px' }} />
      </div>
    );
  }

  const totalAmount = commitments.reduce((sum, c) => sum + (c.amount_committed || 0), 0);
  const verifiedCount = stats?.donation_count ?? commitments.filter((c) => c.status === 'VERIFIED').length;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '650px', minWidth: 0 }}>
      <h1 className="section-title">My Commitments</h1>
      <p className="section-subtitle">View and track the status of all your commitments.</p>

      {/* Summary */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>{commitments.length}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Total commitments</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-green)' }}>{verifiedCount}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Verified</div>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--accent-gold)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Total committed</div>
        </div>
      </div>

      {commitments.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🪂</div>
          <h3>No commitments yet</h3>
          <p>When you make a commitment, it will appear here so you can track its status.</p>
          <Link href="/campuses" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Find your campus and commit
          </Link>
        </div>
      ) : (
        <div className="stagger">
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>All commitments</h2>
          {commitments.map(renderCommitmentCard)}
        </div>
      )}
    </div>
  );
}
