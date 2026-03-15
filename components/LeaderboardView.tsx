'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RankedCampus } from '@/types';

export default function LeaderboardView() {
  const [data, setData] = useState<RankedCampus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        const uniqueDistricts = [
          ...new Set((d || []).map((c: RankedCampus) => c.district).filter(Boolean)),
        ] as string[];
        setDistricts(uniqueDistricts.sort());
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((c) => {
    if (filterDistrict && c.district !== filterDistrict) return false;
    if (filterType && c.campus_type !== filterType) return false;
    if (filterTier && c.tier !== filterTier) return false;
    return true;
  });

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', minWidth: 0 }}>
      <h1 className="section-title">🏆 Campus Leaderboard</h1>
      <p className="section-subtitle">Rankings based on total commitments</p>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
          alignItems: 'center',
        }}
      >
        <select
          className="form-input"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
          style={{ flex: '0 1 180px', padding: 'var(--space-2) var(--space-3)' }}
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          className="form-input"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ flex: '0 1 160px', padding: 'var(--space-2) var(--space-3)' }}
        >
          <option value="">All Types</option>
          <option value="engineering">Engineering</option>
          <option value="nursing">Nursing</option>
          <option value="polytechnic">Polytechnic</option>
          <option value="arts_science">Arts & Science</option>
          <option value="other">Other</option>
        </select>

        <select
          className="form-input"
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          style={{ flex: '0 1 120px', padding: 'var(--space-2) var(--space-3)' }}
        >
          <option value="">All Tiers</option>
          {['S', 'A', 'B', 'C', 'D', 'E'].map((t) => (
            <option key={t} value={t}>
              Tier {t}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '60px' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏆</div>
          <h3>No campuses match your filters</h3>
          <p>Try adjusting the filters above</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Campus</th>
                <th>Commitments</th>
                <th>Amount committed (₹)</th>
                <th>Tier</th>
                <th>Karma</th>
              </tr>
            </thead>
            <tbody className="stagger">
              {filtered.map((campus) => (
                <tr key={campus.campus_id}>
                  <td>
                    <span className={`rank-number ${campus.rank <= 3 ? 'top-3' : ''}`}>
                      {campus.rank <= 3
                        ? ['🥇', '🥈', '🥉'][campus.rank - 1]
                        : `#${campus.rank}`}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/campuses/${campus.campus_id}`}
                      style={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {campus.campus_name}
                    </Link>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {campus.district} • {campus.campus_type}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {(campus.total_commitments ?? campus.verified_contributors ?? 0).toLocaleString()}
                  </td>
                  <td style={{ color: 'var(--accent-gold)' }}>
                    ₹{Number(campus.total_amount_committed ?? campus.verified_amount_total ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`tier-badge tier-${campus.tier}`}>{campus.tier}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {campus.campus_karma}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
