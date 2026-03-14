'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CampusesContent() {
  const searchParams = useSearchParams();
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [districts, setDistricts] = useState([]);

  const fetchCampuses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (district) params.set('district', district);
      if (type) params.set('type', type);

      const res = await fetch(`/api/v1/campuses?${params}`);
      const data = await res.json();
      setCampuses(Array.isArray(data) ? data : []);

      // Extract unique districts
      if (Array.isArray(data)) {
        const uniqueDistricts = [...new Set(data.map((c) => c.district).filter(Boolean))];
        setDistricts((prev) => {
          const merged = [...new Set([...prev, ...uniqueDistricts])];
          return merged.sort();
        });
      }
    } catch (err) {
      console.error('Failed to fetch campuses:', err);
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  }, [search, district, type]);

  useEffect(() => {
    const debounce = setTimeout(fetchCampuses, 300);
    return () => clearTimeout(debounce);
  }, [fetchCampuses]);

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'nursing', label: 'Nursing' },
    { value: 'poly', label: 'Polytechnic' },
    { value: 'arts', label: 'Arts & Science' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <h1 className="section-title">Find Your Campus</h1>
      <p className="section-subtitle">
        Search for your college and commit to #LetHimFly
      </p>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search campus name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 300px' }}
        />
        <select
          className="form-input"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{ flex: '0 1 200px' }}
        >
          <option value="">All Districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="form-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ flex: '0 1 180px' }}
        >
          {typeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Campus Grid */}
      {loading ? (
        <div className="campus-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : campuses.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏫</div>
          <h3>No campuses found</h3>
          <p>Try adjusting your search or filters. If your campus isn&apos;t listed, contact the campaign organizers.</p>
        </div>
      ) : (
        <div className="campus-grid stagger">
          {campuses.map((campus) => (
            <Link 
              key={campus.campus_id} 
              href={`/campuses/${campus.campus_id}`}
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s, box-shadow 0.2s' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                    {campus.campus_name}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                    {campus.district} • {campus.campus_type}
                  </p>
                </div>
                <span className={`tier-badge tier-${campus.tier}`}>{campus.tier}</span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', marginTop: 'auto' }}>
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {campus.verified_contributors}
                  </span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>Commitments</span>
                </div>
                <div>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    ₹{campus.verified_amount_total?.toLocaleString('en-IN') || 0}
                  </span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>Raised</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampusesPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
        <div className="campus-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    }>
      <CampusesContent />
    </Suspense>
  );
}
