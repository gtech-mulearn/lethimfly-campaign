'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import UserDonationStats from '@/components/UserDonationStats';

interface CampusOption {
  campus_id: string;
  campus_name: string;
  district?: string;
}

export default function CommitModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOpen = searchParams.get('commit') === 'true';
  const preselectedCampusId = searchParams.get('campus');

  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  const [userSession, setUserSession] = useState<{ name: string; email: string } | null>(null);

  const [form, setForm] = useState({
    campus_id: '',
    full_name: '',
    phone: '',
    email: '',
    amount_committed: 1,
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const closeModal = () => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('commit');
    params.delete('campus');
    const newUrl = pathname + (params.toString() ? '?' + params.toString() : '');
    router.replace(newUrl, { scroll: false });
  };

  useEffect(() => {
    if (isOpen && campuses.length === 0) {
      setLoadingCampuses(true);
      fetch('/api/v1/campuses?search=&limit=500')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const sortedData = [...data].sort((a, b) =>
              a.campus_name.localeCompare(b.campus_name)
            );
            setCampuses(sortedData);
          } else {
            setCampuses([]);
          }
          if (preselectedCampusId) {
            setForm((f) => ({ ...f, campus_id: preselectedCampusId }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCampuses(false));
    }
    if (isOpen) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const name = session.user.user_metadata?.full_name || '';
          const email = session.user.email || '';
          setUserSession({ name, email });
          setForm((f) => ({ ...f, full_name: f.full_name || name, email: f.email || email }));
        }
      });
    }
  }, [isOpen, preselectedCampusId]);

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href, // Stay on the same query parsed page
      },
    });
  };

  useEffect(() => {
    if (preselectedCampusId) {
      setForm((f) => ({ ...f, campus_id: preselectedCampusId }));
    }
  }, [preselectedCampusId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.campus_id) {
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
          ...form,
          email: form.email || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Close modal and redirect to success
      closeModal();
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

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="commit-modal-title"
      style={{ zIndex: 1000, display: 'flex', alignItems: 'flex-start', paddingTop: '5vh' }}
    >
      <div
        className="modal-content card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(600px, calc(100vw - 2 * var(--space-4)))',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          onClick={closeModal}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          &times;
        </button>

        <h2 id="commit-modal-title" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>
          Make Your Commitment
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
          Join the #LetHimFly campaign and help Syam reach the sky.
        </p>

        {!userSession ? (
          <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
              Sign in with Google to make your commitment. Your email will be used to identify you.
            </p>
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google to continue
            </button>
          </div>
        ) : (
        <>
          <UserDonationStats show={!!userSession} style={{ marginBottom: 'var(--space-4)' }} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Your Campus *</label>
            {loadingCampuses ? (
              <div className="form-input" style={{ background: '#f3f4f6', color: '#9ca3af' }}>
                Loading campuses...
              </div>
            ) : (
              <select
                className="form-input"
                value={form.campus_id}
                onChange={(e) => setForm({ ...form, campus_id: e.target.value })}
                required
              >
                <option value="" disabled>
                  -- Select a Campus --
                </option>
                {campuses.map((c) => (
                  <option key={c.campus_id} value={c.campus_id}>
                    {c.campus_name} {c.district ? `(${c.district})` : ''}
                  </option>
                ))}
              </select>
            )}
            <span className="form-hint" style={{ display: 'block', marginTop: '4px' }}>
              Can&apos;t find your campus?{' '}
              <Link href="/campuses" onClick={closeModal} style={{ textDecoration: 'underline' }}>
                View all campuses
              </Link>
              .
            </span>
          </div>

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
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={form.email}
              readOnly
              style={{ backgroundColor: 'var(--bg-muted, #f3f4f6)', cursor: 'default' }}
              aria-readonly="true"
            />
            <span className="form-hint">From your Google account</span>
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
              {[1, 50, 100, 500, 1000].map((amt) => (
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
                setForm({ ...form, amount_committed: parseInt(e.target.value) || 1 })
              }
              min={1}
            />
            <span className="form-hint">₹1 challenge - any amount counts.</span>
          </div>

          <div className="form-group">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span className="checkbox-label">
                I agree to the campaign terms. I understand this platform records my commitment.
                Actual payment is made directly to the campaign account.
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
            style={{ width: '100%', borderRadius: '9999px' }}
            disabled={loading || !form.campus_id}
          >
            {loading ? 'Submitting...' : '🪂 I Commit to #LetHimFly'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
