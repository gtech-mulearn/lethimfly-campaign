'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function TrackContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialId);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!query.trim()) {
      setError('Please enter a phone number or commitment ID');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/v1/commitments/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_or_commitment_id: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Not found');
        setLoading(false);
        return;
      }

      setResults(Array.isArray(data) ? data : [data]);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED'];

  const getStatusIndex = (status) => {
    if (status === 'VERIFIED') return 2;
    if (status === 'PENDING_VERIFICATION') return 1;
    return 0;
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '650px' }}>
      <h1 className="section-title">Track Your Status</h1>
      <p className="section-subtitle">
        Look up your commitment using your phone number or commitment ID
      </p>

      <form onSubmit={handleLookup} className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter phone number or commitment ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Searching...' : '🔍 Look Up'}
        </button>
      </form>

      {error && (
        <div className="card" style={{ borderColor: 'var(--accent-red)', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--accent-red)', fontSize: 'var(--text-sm)' }}>{error}</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="stagger">
          {results.map((r) => (
            <div key={r.commitment_id} className="card" style={{ marginBottom: 'var(--space-4)' }}>
              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
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

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Name</span><p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{r.full_name}</p></div>
                <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Amount</span><p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--accent-gold)' }}>₹{r.amount_committed}</p></div>
                <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Campus</span><p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{r.campus_name}</p></div>
                <div><span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Phone</span><p style={{ fontSize: 'var(--text-sm)' }}>{r.phone_masked}</p></div>
              </div>

              {/* Timeline */}
              <div className="status-timeline">
                {statusSteps.map((step, i) => {
                  const currentIdx = getStatusIndex(r.status);
                  const isCompleted = i < currentIdx || (i === currentIdx && r.status !== 'REJECTED');
                  const isError = r.status === 'REJECTED' && i === 1;
                  const label = step === 'COMMITTED' ? r.committed_at :
                                step === 'PENDING_VERIFICATION' ? r.utr_submitted_at :
                                r.verified_at;

                  return (
                    <div key={step} className="timeline-step">
                      <div className={`timeline-dot ${isError ? 'error' : isCompleted ? 'completed' : ''}`}>
                        {isCompleted && !isError && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
                        {isError && <span style={{ color: '#fff', fontSize: '10px' }}>✕</span>}
                      </div>
                      <div className="timeline-content">
                        <h4>{step.replace('_', ' ')}</h4>
                        {label && (
                          <p>{new Date(label).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rejection reason */}
              {r.status === 'REJECTED' && r.rejection_reason && (
                <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-3)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-red)' }}>
                    <strong>Rejection reason:</strong> {r.rejection_reason}
                  </p>
                </div>
              )}

              {/* Resubmit CTA */}
              {r.can_submit_utr && (
                <Link
                  href={`/pay?commitment=${r.commitment_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', marginTop: 'var(--space-4)' }}
                >
                  {r.status === 'REJECTED' ? '🔄 Resubmit UTR' : '📤 Submit UTR'}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {searched && !loading && !results && !error && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No results</h3>
          <p>No commitments found for this phone or ID.</p>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 'var(--space-8)', textAlign: 'center' }}>
        <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
