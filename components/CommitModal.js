'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function CommitModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOpen = searchParams.get('commit') === 'true';
  const preselectedCampusId = searchParams.get('campus');

  const [campuses, setCampuses] = useState([]);
  const [loadingCampuses, setLoadingCampuses] = useState(false);
  
  const [form, setForm] = useState({
    campus_id: '',
    full_name: '',
    phone: '',
    email: '',
    amount_committed: 100,
  });
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Close modal by removing query params
  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
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
            setCampuses(data);
          } else {
            console.error('Expected array of campuses, got:', data);
            setCampuses([]);
          }
          if (preselectedCampusId) {
            setForm(f => ({ ...f, campus_id: preselectedCampusId }));
          }
        })
        .catch(() => {})
        .finally(() => setLoadingCampuses(false));
    }
  }, [isOpen, preselectedCampusId]);

  useEffect(() => {
    if (preselectedCampusId) {
      setForm(f => ({ ...f, campus_id: preselectedCampusId }));
    }
  }, [preselectedCampusId]);

  const handleSubmit = async (e) => {
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
        `/commit/success?id=${data.commitment_id}&campus=${encodeURIComponent(data.campus_name)}&amount=${data.amount_committed}`
      );
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000, display: 'flex', alignItems: 'flex-start', paddingTop: '5vh' }}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button 
          onClick={closeModal}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
        >
          &times;
        </button>
        
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Make Your Commitment</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Join the #LetHimFly campaign and help Syam reach the sky.</p>

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label className="form-label">Select Your Campus *</label>
            {loadingCampuses ? (
              <div className="form-input" style={{ background: '#f3f4f6', color: '#9ca3af' }}>Loading campuses...</div>
            ) : (
              <select 
                className="form-input" 
                value={form.campus_id} 
                onChange={e => setForm({...form, campus_id: e.target.value})}
                required
              >
                <option value="" disabled>-- Select a Campus --</option>
                {campuses.map(c => (
                  <option key={c.campus_id} value={c.campus_id}>
                    {c.campus_name} {c.district ? `(${c.district})` : ''}
                  </option>
                ))}
              </select>
            )}
            <span className="form-hint" style={{ display: 'block', marginTop: '4px' }}>
              Can&apos;t find your campus? <Link href="/campuses" onClick={closeModal} style={{ textDecoration: 'underline' }}>View all campuses</Link>.
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
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`btn btn-sm ${form.amount_committed === amt ? 'btn-primary' : 'btn-secondary'}`}
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
              ₹100 is recommended.
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
                I agree to the campaign terms. I understand
                this platform records my commitment. Actual payment is made
                directly to the campaign account.
              </span>
            </label>
          </div>

          {error && (
            <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
              <p style={{ color: 'var(--accent-red)', fontSize: 'var(--text-sm)' }}>
                {error}
              </p>
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
      </div>
    </div>
  );
}
