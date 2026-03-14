'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CampusScore } from '@/types';

function CommitFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campusId = searchParams?.get('campus') || null;

  const [campusName, setCampusName] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    amount_committed: 100,
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campusId) {
      fetch(`/api/v1/campuses?search=`)
        .then((r) => r.json())
        .then((data: CampusScore[]) => {
          const campus = (data || []).find((c) => c.campus_id === campusId);
          if (campus) setCampusName(campus.campus_name);
        })
        .catch(() => {});
    }
  }, [campusId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!campusId) {
      setError('Please select a campus first');
      return;
    }
    if (!consent) {
      setError('Please agree to the terms to continue');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campus_id: campusId,
          full_name: form.full_name,
          phone: form.phone,
          email: form.email || undefined,
          amount_committed: form.amount_committed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Redirect to success page
      router.push(
        `/commit/success?id=${data.commitment_id}&campus=${encodeURIComponent(
          data.campus_name
        )}&amount=${data.amount_committed}`
      );
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '600px' }}
    >
      <h1 className="section-title">Make Your Commitment</h1>
      <p className="section-subtitle">
        {campusName ? `Committing for ${campusName}` : 'Join the #LetHimFly campaign'}
      </p>

      {!campusId && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-4)',
            borderColor: 'var(--accent-gold)',
          }}
        >
          <p style={{ color: 'var(--accent-gold)', fontSize: 'var(--text-sm)' }}>
            ⚠️ No campus selected.{' '}
            <a href="/campuses" style={{ textDecoration: 'underline' }}>
              Choose your campus first
            </a>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Enter your full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            minLength={2}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            className="form-input"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            pattern="[0-9]{10}"
            maxLength={10}
          />
          <span className="form-hint">Used for tracking your commitment status</span>
        </div>

        <div className="form-group">
          <label className="form-label">Email (optional)</label>
          <input
            type="email"
            className="form-input"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Commitment Amount (₹)</label>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              flexWrap: 'wrap',
              marginBottom: 'var(--space-2)',
            }}
          >
            {[100, 200, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`btn btn-sm ${
                  form.amount_committed === amt ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setForm({ ...form, amount_committed: amt })}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            className="form-input"
            placeholder="Custom amount"
            value={form.amount_committed}
            onChange={(e) =>
              setForm({ ...form, amount_committed: parseInt(e.target.value) || 100 })
            }
            min={1}
          />
          <span className="form-hint">
            ₹100 is recommended. Campus Karma is based on headcount, not amount.
          </span>
        </div>

        <div className="form-group">
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span className="checkbox-label">
              I agree to the campaign terms and verification policy. I understand this platform
              records my commitment — actual payment is made directly to the campaign account.
            </span>
          </label>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-3)',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <p style={{ color: 'var(--accent-red)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading || !campusId}
        >
          {loading ? 'Submitting...' : '🪂 I Commit to #LetHimFly'}
        </button>
      </form>
    </div>
  );
}

export default function CommitPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: 'var(--space-8)', textAlign: 'center' }}>
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        </div>
      }
    >
      <CommitFormInner />
    </Suspense>
  );
}
