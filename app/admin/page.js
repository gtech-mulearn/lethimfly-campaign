'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Papa from 'papaparse';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  // Queue state
  const [commitments, setCommitments] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING_VERIFICATION');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [toast, setToast] = useState(null);

  // Stats
  const [stats, setStats] = useState({ pending: 0, verified: 0, total: 0 });

  // Campuses state
  const [adminCampuses, setAdminCampuses] = useState([]);
  const [campusLoading, setCampusLoading] = useState(false);
  const [newCampus, setNewCampus] = useState({ name: '', type: 'other', district: '' });
  const [creatingCampus, setCreatingCampus] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const key = adminKey.trim();
    if (!key) return;

    try {
      // Verify the key against the server before granting access
      const res = await fetch('/api/v1/admin/commitments?status=PENDING_VERIFICATION&page=1&limit=1', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.status === 401) {
        alert('Invalid admin key. Please try again.');
        return;
      }
      // Key is valid
      localStorage.setItem('admin_key', key);
      setAuthed(true);
    } catch {
      alert('Network error. Please check your connection and try again.');
    }
  };

  const getAuthKey = () => localStorage.getItem('admin_key') || '';

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/commitments?status=${statusFilter}&page=${page}&limit=25`,
        { headers: { Authorization: `Bearer ${getAuthKey()}` } }
      );
      const data = await res.json();
      setCommitments(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Fetch queue error:', err);
    } finally {
      setQueueLoading(false);
    }
  }, [statusFilter, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/campaign');
      const data = await res.json();
      setStats({
        pending: data.pending_verification_total || 0,
        verified: data.verified_contributors_total || 0,
        total: data.verified_amount_total || 0,
      });
    } catch {}
  }, []);

  const fetchCampuses = useCallback(async () => {
    setCampusLoading(true);
    try {
      const res = await fetch('/api/v1/campuses?search=&limit=500'); // Assuming this lists active campuses
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdminCampuses(data);
      } else {
        console.error('Expected array of campuses, got:', data);
        setAdminCampuses([]);
      }
    } catch (err) {
      console.error('Failed to fetch campuses:', err);
      setAdminCampuses([]);
    } finally {
      setCampusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      if (activeTab === 'queue' || activeTab === 'all') fetchQueue();
      if (activeTab === 'campuses') fetchCampuses();
      fetchStats();
    }
  }, [authed, fetchQueue, fetchStats, activeTab, fetchCampuses]);

  useEffect(() => {
    const saved = localStorage.getItem('admin_key');
    if (saved) setAuthed(true);
  }, []);

  const handleVerify = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/admin/commitments/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
        body: JSON.stringify({ note: 'Verified via admin dashboard' }),
      });
      if (res.ok) {
        showToast('Commitment verified! ✅');
        fetchQueue();
        fetchStats();
      } else {
        const data = await res.json();
        showToast(data.error || 'Verification failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectId);
    try {
      const res = await fetch(`/api/v1/admin/commitments/${rejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        showToast('Commitment rejected');
        setRejectId(null);
        setRejectReason('');
        fetchQueue();
        fetchStats();
      } else {
        const data = await res.json();
        showToast(data.error || 'Rejection failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCampus = async (e) => {
    e.preventDefault();
    if (!newCampus.name.trim()) return;
    setCreatingCampus(true);
    try {
      const res = await fetch('/api/v1/admin/campuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
        body: JSON.stringify(newCampus),
      });
      if (res.ok) {
        showToast('Campus added successfully ✅');
        setNewCampus({ name: '', type: 'other', district: '' });
        fetchCampuses();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add campus', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setCreatingCampus(false);
    }
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingCsv(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const validTypes = ['engineering', 'nursing', 'poly', 'arts', 'other'];

          const rows = results.data
            .filter(row => row.name || row.campus_name)
            .map(row => {
              const name = (row.name || row.campus_name || '').trim();
              const district = (row.district || '').trim();
              let type = (row.type || 'other').trim().toLowerCase();
              
              if (!validTypes.includes(type)) {
                type = 'other'; // fallback to generic 'other' if invalid or header row
              }

              return { name, district, type };
            })
            // Extra safety to avoid sending empty rows or headers if name matches 'name'
            .filter(row => row.name && row.name.toLowerCase() !== 'name');

          if (rows.length === 0) throw new Error('No valid rows found in CSV');

          const res = await fetch('/api/v1/admin/campuses/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
            body: JSON.stringify({ rows }),
          });
          
          if (res.ok) {
            const data = await res.json();
            showToast(`${data.count} Campuses bulk imported! ✅`);
            fetchCampuses();
          } else {
            const data = await res.json();
            showToast(data.error || 'Failed to bulk import', 'error');
          }
        } catch (err) {
          showToast(err.message || 'Error processing CSV', 'error');
        } finally {
          setUploadingCsv(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: () => {
        showToast('Error parsing CSV', 'error');
        setUploadingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };

  const handleExport = () => {
    window.open('/api/v1/admin/exports', '_blank');
  };

  // Login Screen
  if (!authed) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-16)', maxWidth: '400px', textAlign: 'center' }}>
        <h1 className="section-title">Admin Login</h1>
        <p className="section-subtitle">Enter admin key to continue</p>
        <form onSubmit={handleLogin} className="card">
          <div className="form-group">
            <input
              type="password"
              className="form-input"
              placeholder="Enter admin key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Admin Header */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: 'var(--space-4) 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
            <span style={{ background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Dashboard
            </span>
          </h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Export CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { localStorage.removeItem('admin_key'); setAuthed(false); }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-16)' }}>
        {/* Stats Cards */}
        <div className="metrics-strip" style={{ paddingTop: 0, paddingBottom: 'var(--space-6)' }}>
          <div className="metric-card">
            <div className="metric-value pink">{stats.pending}</div>
            <div className="metric-label">Pending</div>
          </div>
          <div className="metric-card">
            <div className="metric-value green">{stats.verified}</div>
            <div className="metric-label">Verified</div>
          </div>
          <div className="metric-card">
            <div className="metric-value gold">₹{stats.total.toLocaleString()}</div>
            <div className="metric-label">Total Raised</div>
          </div>
          <div className="metric-card">
            <div className="metric-value blue">{total}</div>
            <div className="metric-label">In Queue</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-1)', marginBottom: 'var(--space-4)', width: 'fit-content' }}>
          {[
            { key: 'queue', label: '📋 Verification Queue' },
            { key: 'all', label: '📊 All Commitments' },
            { key: 'campuses', label: '🏫 Campuses' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none' }}
              onClick={() => {
                setActiveTab(tab.key);
                setStatusFilter(tab.key === 'queue' ? 'PENDING_VERIFICATION' : 'all');
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter for All tab */}
        {activeTab === 'all' && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            {['all', 'COMMITTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Queue Table */}
        {queueLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : commitments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">✅</div>
            <h3>Queue is empty</h3>
            <p>No commitments match the current filter</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {commitments.map((c) => (
                <div key={c.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{c.full_name}</h4>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> ****{c.phone?.slice(-4)}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Amount:</span> <strong style={{ color: 'var(--accent-gold)' }}>₹{c.amount_committed}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Campus:</span> {c.campuses?.name}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>UTR:</span> <code style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px' }}>{c.utr_number || '—'}</code></div>
                        {c.utr_submitted_at && (
                          <div><span style={{ color: 'var(--text-muted)' }}>Submitted:</span> {new Date(c.utr_submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                        )}
                      </div>
                      {c.rejection_reason && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-red)', marginTop: 'var(--space-2)' }}>
                          Reason: {c.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }}>
                      {c.screenshot_url && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setScreenshotModal(c.screenshot_url)}
                        >
                          🖼️
                        </button>
                      )}
                      {(c.status === 'PENDING_VERIFICATION' || c.status === 'FLAGGED') && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerify(c.id)}
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? '...' : '✓ Verify'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setRejectId(c.id)}
                            disabled={actionLoading === c.id}
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Campuses Tab */}
        {activeTab === 'campuses' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-8)' }}>
            
            {/* Add Campus Form */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>➕ Add New Campus</h3>
              <form onSubmit={handleAddCampus} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Campus Name *</label>
                  <input type="text" className="form-input" value={newCampus.name} onChange={(e) => setNewCampus({...newCampus, name: e.target.value})} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">District</label>
                  <input type="text" className="form-input" value={newCampus.district} onChange={(e) => setNewCampus({...newCampus, district: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={newCampus.type} onChange={(e) => setNewCampus({...newCampus, type: e.target.value})}>
                    <option value="engineering">Engineering</option>
                    <option value="nursing">Nursing</option>
                    <option value="poly">Poly</option>
                    <option value="arts">Arts</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={creatingCampus || !newCampus.name}>
                  {creatingCampus ? 'Adding...' : 'Add Campus'}
                </button>
              </form>
            </div>

            {/* List Active Campuses */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏫 Active Campuses ({adminCampuses.length})</h3>
              {campusLoading ? (
                <div className="skeleton" style={{ height: '200px' }} />
              ) : (
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: 'var(--space-2)' }}>Name</th>
                        <th style={{ padding: 'var(--space-2)' }}>District</th>
                        <th style={{ padding: 'var(--space-2)' }}>Type</th>
                        <th style={{ padding: 'var(--space-2)' }}>Tier</th>
                        <th style={{ padding: 'var(--space-2)', textAlign: 'right' }}>Verified / Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCampuses.map((c) => (
                        <tr key={c.campus_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: 'var(--space-2)' }}>{c.campus_name}</td>
                          <td style={{ padding: 'var(--space-2)' }}>{c.district}</td>
                          <td style={{ padding: 'var(--space-2)', textTransform: 'capitalize' }}>{c.campus_type}</td>
                          <td style={{ padding: 'var(--space-2)' }}><span className={`tier-badge tier-${c.tier}`} style={{ padding: '2px 6px', fontSize: 'var(--text-xs)' }}>{c.tier}</span></td>
                          <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{c.verified_contributors}</span> / <span style={{ color: 'var(--accent-secondary)' }}>{c.pending_verification}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CSV Upload Section */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Bulk Import CSV</h4>
                <a href="/csv-template.csv" download className="btn btn-secondary btn-sm">
                  📥 Download CSV Template
                </a>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                Upload a CSV file containing your campus list.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef}
                  onChange={handleBulkUpload}
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}
                />
                {uploadingCsv && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)' }}>Uploading...</span>}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="modal-overlay" onClick={() => setRejectId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
              Reject Commitment
            </h3>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="e.g. Invalid UTR, amount mismatch, unclear screenshot..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={!rejectReason.trim()}>
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="modal-overlay" onClick={() => setScreenshotModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Payment Screenshot</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              File: {screenshotModal}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              View the file in your Supabase Storage bucket &quot;screenshots&quot;
            </p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-4)' }} onClick={() => setScreenshotModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
