'use client';

import { useState, useEffect } from 'react';

interface UserDonationStatsProps {
  show: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function UserDonationStats({ show, className, style }: UserDonationStatsProps) {
  const [stats, setStats] = useState<{ donation_count: number; total_amount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setStats(null);
      return;
    }
    setLoading(true);
    fetch('/api/v1/me/donation-stats', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.donation_count === 'number') {
          setStats({ donation_count: data.donation_count, total_amount: data.total_amount ?? 0 });
        } else {
          setStats(null);
        }
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [show]);

  if (!show || loading) return null;
  if (stats === null) return null;

  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-muted, #f3f4f6)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-4)',
        ...style,
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Your impact:
      </span>
      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        {stats.donation_count} verified donation{stats.donation_count !== 1 ? 's' : ''}
      </span>
      <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
        ₹{stats.total_amount.toLocaleString('en-IN')} total
      </span>
    </div>
  );
}
