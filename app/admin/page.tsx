'use client';

import { useState, useEffect, useCallback, useRef, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';
import { CampusScore } from '@/types';

interface CommitmentAdminView {
  id: string;
  full_name: string;
  email?: string | null;
  phone: string;
  amount_committed: number;
  status: string;
  campus_id: string;
  campuses: { name: string; district?: string };
  utr_number?: string;
  screenshot_url?: string;
  committed_at: string;
  utr_submitted_at?: string;
  verified_at?: string;
  rejection_reason?: string;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ email: string } | null>(null);
  const [isAdminBySession, setIsAdminBySession] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('queue');

  const [commitments, setCommitments] = useState<CommitmentAdminView[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING_VERIFICATION');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [sessionExpired, setSessionExpired] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [screenshotModal, setScreenshotModal] = useState<string | null>(null);
  const [detailCommitment, setDetailCommitment] = useState<CommitmentAdminView | null>(null);
  const [adminUtr, setAdminUtr] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    total: 0,
    totalCommitted: 0,
    totalAmountCommitted: 0,
  });

  const [adminCampuses, setAdminCampuses] = useState<CampusScore[]>([]);
  const [campusLoading, setCampusLoading] = useState(false);
  const [newCampus, setNewCampus] = useState({ name: '', type: 'other', district: '' });
  const [creatingCampus, setCreatingCampus] = useState(false);
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentSettings, setPaymentSettings] = useState<{
    upi_id: string;
    qr_code_url: string;
    account_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    screenshot_mandatory: boolean;
    one_verified_per_phone: boolean;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [commitmentHistory, setCommitmentHistory] = useState<{
    id: string; action: string; before_json: Record<string, unknown> | null;
    after_json: Record<string, unknown> | null; reason: string | null; created_at: string;
  }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [detailedStats, setDetailedStats] = useState<{
    summary: { total_commitments: number; total_amount_committed: number; verified_count: number; verified_amount: number; pending_count: number };
    by_district: { district: string; total_commitments: number; total_amount: number; verified_count: number; verified_amount: number }[];
    by_type: { campus_type: string; total_commitments: number; total_amount: number; verified_count: number; verified_amount: number }[];
    by_campus: { campus_id: string; campus_name: string; district: string; campus_type: string; total_commitments: number; total_amount_committed: number; verified_contributors: number; verified_amount_total: number }[];
    by_status: { status: string; count: number }[];
  } | null>(null);
  const [detailedStatsLoading, setDetailedStatsLoading] = useState(false);

  const fetchCommitmentHistory = async (id: string) => {
    setHistoryLoading(true);
    setCommitmentHistory([]);
    try {
      const res = await fetch(`/api/v1/admin/commitments/${id}/history`, {
        headers: { Authorization: `Bearer ${getAuthKey()}` },
      });
      if (res.ok) setCommitmentHistory(await res.json());
    } catch { /* silent */ } finally {
      setHistoryLoading(false);
    }
  };

  const formatRupee = (n: number) =>
    `₹${Math.round(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 0, useGrouping: false })}`;

  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getAuthKey = (): string => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('admin_token') || '';
  };

  const handleGoogleLogin = () => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  };

  const clearAuthOn401 = useCallback((res: Response) => {
    if (res.status === 401) {
      sessionStorage.removeItem('admin_token');
      setAuthed(false);
      setSessionUser(null);
      setIsAdminBySession(null);
      // 401 from API means token became invalid (session expiry)
      setSessionExpired(true);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await fetch(
        `/api/v1/admin/commitments?status=${statusFilter}&page=${page}&limit=25`,
        { headers: { Authorization: `Bearer ${getAuthKey()}` } }
      );
      clearAuthOn401(res);
      const data = await res.json();
      setCommitments(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setQueueLoading(false);
    }
  }, [statusFilter, page, clearAuthOn401]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/campaign');
      const data = await res.json();
        setStats({
          pending: data.pending_verification_total || 0,
          verified: data.verified_contributors_total || 0,
          total: data.verified_amount_total || 0,
          totalCommitted: data.total_commitments_total || 0,
          totalAmountCommitted: data.total_amount_committed || 0,
        });
    } catch {}
  }, []);

  const fetchCampuses = useCallback(async () => {
    setCampusLoading(true);
    try {
      const res = await fetch('/api/v1/campuses?search=&limit=500');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdminCampuses(data);
      } else {
        setAdminCampuses([]);
      }
    } catch {
      setAdminCampuses([]);
    } finally {
      setCampusLoading(false);
    }
  }, []);

  const fetchPaymentSettings = useCallback(async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/v1/campaign');
      const data = await res.json();
      const ai = data.account_info || {};
      setPaymentSettings({
        upi_id: ai.upi_id ?? '',
        qr_code_url: ai.qr_code_url ?? '',
        account_name: ai.account_name ?? '',
        account_number: ai.account_number ?? '',
        ifsc_code: ai.ifsc_code ?? '',
        bank_name: ai.bank_name ?? '',
        screenshot_mandatory: data.screenshot_mandatory === true,
        one_verified_per_phone: data.one_verified_per_phone === true,
      });
    } catch {
      setPaymentSettings(null);
    } finally {
      setPaymentLoading(false);
    }
  }, []);

  const fetchDetailedStats = useCallback(async () => {
    setDetailedStatsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/stats/detailed', {
        headers: { Authorization: `Bearer ${getAuthKey()}` },
      });
      clearAuthOn401(res);
      if (res.ok) {
        const data = await res.json();
        setDetailedStats(data);
      } else {
        setDetailedStats(null);
      }
    } catch {
      setDetailedStats(null);
    } finally {
      setDetailedStatsLoading(false);
    }
  }, [clearAuthOn401]);

  useEffect(() => {
    if (authed) {
      if (activeTab === 'queue' || activeTab === 'all') fetchQueue();
      if (activeTab === 'campuses') fetchCampuses();
      if (activeTab === 'payment') fetchPaymentSettings();
      if (activeTab === 'stats') fetchDetailedStats();
      fetchStats();
    }
  }, [authed, fetchQueue, fetchStats, activeTab, fetchCampuses, fetchPaymentSettings, fetchDetailedStats]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    // Initial session check
    (async () => {
      if (typeof window !== 'undefined') localStorage.removeItem('admin_key');
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user?.email) {
        setSessionUser({ email: session.user.email });
        const res = await fetch('/api/v1/admin/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        const data = await res.json();
        if (data.isAdmin) {
          if (typeof window !== 'undefined') sessionStorage.setItem('admin_token', session.access_token);
          setAuthed(true);
          setIsAdminBySession(true);
          setSessionExpired(false);
        } else {
          setIsAdminBySession(false);
        }
      } else {
        setSessionUser(null);
        setIsAdminBySession(null);
      }
      setAuthCheckDone(true);
    })();

    // Listen for ongoing auth state changes while admin is active
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        // Silently update the stored token so API calls keep working
        if (typeof window !== 'undefined') sessionStorage.setItem('admin_token', session.access_token);
        return;
      }

      if (event === 'SIGNED_OUT') {
        const isManual = typeof window !== 'undefined' && sessionStorage.getItem('manual_signout') === '1';
        if (typeof window !== 'undefined') sessionStorage.removeItem('manual_signout');
        sessionStorage.removeItem('admin_token');
        setAuthed(false);
        setSessionUser(null);
        setIsAdminBySession(null);
        if (!isManual) {
          // Session expired without user action — show re-login prompt
          setSessionExpired(true);
          setAuthCheckDone(true);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleVerify = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/v1/admin/commitments/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
        body: JSON.stringify({ note: 'Verified via admin dashboard' }),
      });
      clearAuthOn401(res);
      if (res.ok) {
        showToast('Commitment verified! ✅');
        if (detailCommitment?.id === id) setDetailCommitment(null);
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
    if (!rejectReason.trim() || !rejectId) return;
    setActionLoading(rejectId);
    try {
      const res = await fetch(`/api/v1/admin/commitments/${rejectId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthKey()}` },
        body: JSON.stringify({ reason: rejectReason }),
      });
      clearAuthOn401(res);
      if (res.ok) {
        showToast('Commitment rejected');
        setRejectId(null);
        setRejectReason('');
        if (detailCommitment?.id === rejectId) setDetailCommitment(null);
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

  const handleAdminSubmitUtr = async () => {
    if (!detailCommitment || !adminUtr.trim() || adminUtr.trim().length < 6) {
      showToast('Enter a valid UTR (min 6 characters)', 'error');
      return;
    }
    setSubmittingUtr(true);
    try {
      const formData = new FormData();
      formData.append('utr_number', adminUtr.trim());
      const res = await fetch(`/api/v1/commitments/${detailCommitment.id}/submit-utr`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        showToast('UTR submitted; status set to Pending verification');
        setAdminUtr('');
        setDetailCommitment({ ...detailCommitment, utr_number: adminUtr.trim(), status: 'PENDING_VERIFICATION' });
        fetchQueue();
        fetchStats();
      } else {
        showToast(data.error || 'Failed to submit UTR', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handleQrUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !paymentSettings) return;
    setQrUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/v1/admin/upload-qr', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthKey()}` },
        body: fd,
      });
      clearAuthOn401(res);
      const data = await res.json();
      if (res.ok && data.url) {
        setPaymentSettings({ ...paymentSettings, qr_code_url: data.url });
        showToast('QR image uploaded');
      } else {
        showToast(data.error || 'Upload failed', 'error');
      }
    } catch {
      showToast('Network error during upload', 'error');
    } finally {
      setQrUploading(false);
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const handleAddCampus = async (e: FormEvent) => {
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

  const handleBulkUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCsv(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
       
      complete: async (results: any) => {
        try {
          const validTypes = ['engineering', 'nursing', 'polytechnic', 'arts_science', 'other'];

           
          const rows = results.data
             
            .filter((row: any) => row.name || row.campus_name)
             
            .map((row: any) => {
              const name = (row.name || row.campus_name || '').trim();
              const district = (row.district || '').trim();
              let type = (row.type || 'other').trim().toLowerCase();

              if (!validTypes.includes(type)) {
                type = 'other'; // fallback to generic 'other' if invalid or header row
              }

              return { name, district, type };
            })
            .filter((row: any) => row.name && row.name.toLowerCase() !== 'name');

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
        } catch (err: unknown) {
          showToast(err instanceof Error ? err.message : 'Error processing CSV', 'error');
        } finally {
          setUploadingCsv(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: () => {
        showToast('Error parsing CSV', 'error');
        setUploadingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  const handleSavePaymentSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentSettings) return;
    setPaymentSaving(true);
    try {
      const res = await fetch('/api/v1/admin/campaign-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthKey()}`,
        },
        body: JSON.stringify({
          account_info: {
            upi_id: paymentSettings.upi_id,
            qr_code_url: paymentSettings.qr_code_url,
            account_name: paymentSettings.account_name,
            account_number: paymentSettings.account_number,
            ifsc_code: paymentSettings.ifsc_code,
            bank_name: paymentSettings.bank_name,
          },
          screenshot_mandatory: paymentSettings.screenshot_mandatory,
          one_verified_per_phone: paymentSettings.one_verified_per_phone,
        }),
      });
      clearAuthOn401(res);
      if (res.ok) {
        showToast('Payment settings saved. They will appear on the site.');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleExport = async () => {
    const token = getAuthKey();
    if (!token) return;
    try {
      const res = await fetch('/api/v1/admin/exports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem('admin_token');
          setAuthed(false);
        }
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campus-karma-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    }
  };

  if (!authed) {
    if (!authCheckDone) {
      return (
        <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        </div>
      );
    }
    return (
      <div
        className="container"
        style={{ paddingTop: 'var(--space-16)', maxWidth: '440px', textAlign: 'center' }}
      >
        {sessionExpired ? (
          <div className="admin-session-expired-notice">
            <div className="admin-session-expired-icon">🔒</div>
            <h1 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>Session expired</h1>
            <p className="section-subtitle">
              Your session has timed out. Please sign in again to continue.
            </p>
          </div>
        ) : (
          <>
            <h1 className="section-title">Admin Login</h1>
            <p className="section-subtitle">
              Sign in with Google to access the admin dashboard
            </p>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
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
            Sign in with Google
          </button>

          {sessionUser && isAdminBySession === false && (
            <div className="card" style={{ textAlign: 'left', padding: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Signed in as <strong>{sessionUser.email}</strong>. This account is not an admin. Contact an existing admin to be added to the admin list.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'queue', label: 'Queue', icon: '📋' },
    { key: 'all', label: 'All', icon: '📊' },
    { key: 'stats', label: 'Stats', icon: '📈' },
    { key: 'campuses', label: 'Campuses', icon: '🏫' },
    { key: 'payment', label: 'Payment', icon: '💳' },
  ];

  const setTab = (key: string) => {
    setActiveTab(key);
    setStatusFilter(key === 'queue' ? 'PENDING_VERIFICATION' : 'all');
    setPage(1);
  };

  return (
    <div className="admin-dashboard admin-layout" style={{ minHeight: '100vh', overflowX: 'hidden', background: 'var(--bg-primary)' }}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link href="/" className="admin-sidebar-home-link">
            <span className="admin-sidebar-brand">#LetHimFly</span>
          </Link>
          <span className="admin-sidebar-title">Admin</span>
        </div>
        <nav className="admin-sidebar-nav">
          {navItems.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setTab(tab.key)}
            >
              <span className="admin-nav-icon" aria-hidden>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link href="/" className="admin-nav-item admin-nav-action">
            <span className="admin-nav-icon" aria-hidden>🏠</span>
            Go to homepage
          </Link>
          <button type="button" className="admin-nav-item admin-nav-action" onClick={handleExport}>
            <span className="admin-nav-icon" aria-hidden>📥</span>
            Export CSV
          </button>
          <button
            type="button"
            className="admin-nav-item admin-nav-action"
            onClick={() => {
              sessionStorage.setItem('manual_signout', '1');
              sessionStorage.removeItem('admin_token');
              setAuthed(false);
              setSessionUser(null);
              setIsAdminBySession(null);
              setSessionExpired(false);
              const supabase = createClient();
              supabase.auth.signOut();
            }}
          >
            <span className="admin-nav-icon" aria-hidden>↪</span>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-main-inner">
          <header className="admin-header">
            <h1 className="admin-header-title">Admin Dashboard</h1>
            <div className="admin-header-actions admin-header-actions-mobile">
              <Link href="/" className="btn btn-secondary btn-sm">
                🏠 Home
              </Link>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport}>
                📥 Export
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  sessionStorage.setItem('manual_signout', '1');
                  sessionStorage.removeItem('admin_token');
                  setAuthed(false);
                  setSessionUser(null);
                  setIsAdminBySession(null);
                  setSessionExpired(false);
                  const supabase = createClient();
                  supabase.auth.signOut();
                }}
              >
                Log out
              </button>
            </div>
          </header>

          {/* Mobile tabs (hidden when sidebar is visible) */}
          <div className="admin-tabs-mobile tabs-scroll">
            <div className="tabs-scroll-inner">
              {navItems.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`btn btn-sm ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ border: 'none', flexShrink: 0 }}
                  onClick={() => setTab(tab.key)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overview metrics - single consolidated row */}
          <section className="admin-section admin-stats" aria-label="Overview">
            <div className="admin-overview-grid">
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(37,99,235,0.1)' }}>👥</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: '#2563eb' }}>{stats.totalCommitted}</div>
                  <div className="admin-metric-lbl">Committed</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(180,83,9,0.1)' }}>💰</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: '#b45309' }}>{formatRupee(stats.totalAmountCommitted)}</div>
                  <div className="admin-metric-lbl">Total pledged</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(5,150,105,0.1)' }}>✅</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: '#059669' }}>{stats.verified}</div>
                  <div className="admin-metric-lbl">Verified</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(5,150,105,0.1)' }}>💵</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: '#059669' }}>{formatRupee(stats.total)}</div>
                  <div className="admin-metric-lbl">Total raised</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(219,39,119,0.1)' }}>⏳</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: '#db2777' }}>{stats.pending}</div>
                  <div className="admin-metric-lbl">Pending</div>
                </div>
              </div>
              <div className="admin-metric-card">
                <div className="admin-metric-icon" style={{ background: 'rgba(0,0,0,0.05)' }}>📋</div>
                <div className="admin-metric-body">
                  <div className="admin-metric-num" style={{ color: 'var(--text-primary)' }}>{total}</div>
                  <div className="admin-metric-lbl">In queue</div>
                </div>
              </div>
            </div>
          </section>

        {/* Tab content area */}
        <div className="admin-content">
        {/* Status filter: show for Queue (single status) and All Commitments (full filter) */}
        {(activeTab === 'queue' || activeTab === 'all') && (
          <div className="admin-block">
            <h3 className="admin-block-title">
              {activeTab === 'queue' ? 'Verification Queue' : 'All Commitments'}
            </h3>
            <span className="admin-block-hint">Status:</span>
            <div style={{ display: 'inline-flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
              {activeTab === 'queue' ? (
                <button className="btn btn-sm btn-primary" style={{ cursor: 'default' }}>
                  Pending verification
                </button>
              ) : (
                [
                  { value: 'all', label: 'All statuses' },
                  { value: 'COMMITTED', label: 'Committed' },
                  { value: 'PENDING_VERIFICATION', label: 'Pending verification' },
                  { value: 'VERIFIED', label: 'Verified' },
                  { value: 'REJECTED', label: 'Rejected' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    className={`btn btn-sm ${statusFilter === value ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      setStatusFilter(value);
                      setPage(1);
                    }}
                  >
                    {label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Queue Table - only visible on Queue and All tabs */}
        {(activeTab === 'queue' || activeTab === 'all') && (queueLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: '80px' }} />
            ))}
          </div>
        ) : commitments.length === 0 ? (
          <div className="empty-state">
            <div className="icon" aria-hidden>📋</div>
            <h3>Queue is empty</h3>
            <p>No commitments match the current filter. Switch to another tab or try a different status.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {commitments.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{ padding: 'var(--space-4)', cursor: 'pointer' }}
                  onClick={() => { setDetailCommitment(c); fetchCommitmentHistory(c.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setDetailCommitment(c); fetchCommitmentHistory(c.id); } }}
                  aria-label={`View details for ${c.full_name}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-2)',
                          marginBottom: 'var(--space-2)',
                        }}
                      >
                        <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>{c.full_name}</h4>
                        <span className={`status-badge status-${c.status}`}>{c.status.replace('_', ' ')}</span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                          gap: 'var(--space-2)',
                          fontSize: 'var(--text-sm)',
                        }}
                      >
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Phone:</span> ****
                          {c.phone?.slice(-4)}
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Amount:</span>{' '}
                          <strong style={{ color: 'var(--accent-gold)' }}>₹{c.amount_committed}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Campus:</span> {c.campuses?.name}
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>UTR:</span>{' '}
                          <code
                            style={{
                              fontSize: 'var(--text-xs)',
                              background: 'var(--bg-glass)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {c.utr_number || '-'}
                          </code>
                        </div>
                        {c.utr_submitted_at && (
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>{' '}
                            {new Date(c.utr_submitted_at).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </div>
                      {c.rejection_reason && (
                        <p
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--accent-red)',
                            marginTop: 'var(--space-2)',
                          }}
                        >
                          Reason: {c.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Actions - stop propagation so clicking doesn't open detail modal */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      {c.screenshot_url && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setScreenshotModal(c.screenshot_url!)}
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-6)',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 var(--space-3)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                  }}
                >
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
        ))}

        {/* Detailed Stats Tab */}
        {activeTab === 'stats' && (
          <div className="admin-block admin-block-stats">
            {detailedStatsLoading ? (
              <div className="admin-stats-grid">
                <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '300px', borderRadius: '12px', gridColumn: '1/-1' }} />
              </div>
            ) : detailedStats ? (
              <div className="admin-stats-grid">

                {/* Bar chart: By district */}
                <div className="card admin-chart-card">
                  <h4 className="admin-chart-title">Commitments by district</h4>
                  {(() => {
                    const maxVal = Math.max(...detailedStats.by_district.map(r => r.total_commitments), 1);
                    return (
                      <div className="admin-bar-chart">
                        {detailedStats.by_district.slice(0, 12).map((row, i) => (
                          <div key={row.district || i} className="admin-bar-row">
                            <div className="admin-bar-label">{row.district || '(unknown)'}</div>
                            <div className="admin-bar-track">
                              <div className="admin-bar-fill admin-bar-fill-blue"
                                style={{ width: `${(row.total_commitments / maxVal) * 100}%` }} />
                              <div className="admin-bar-fill admin-bar-fill-green"
                                style={{ width: `${(row.verified_count / maxVal) * 100}%`, marginTop: '3px' }} />
                            </div>
                            <div className="admin-bar-count">{row.total_commitments}</div>
                          </div>
                        ))}
                        <div className="admin-bar-legend">
                          <span className="admin-legend-dot" style={{ background: '#2563eb' }} />Committed
                          <span className="admin-legend-dot" style={{ background: '#059669', marginLeft: '12px' }} />Verified
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Donut chart: By organisation type */}
                <div className="card admin-chart-card">
                  <h4 className="admin-chart-title">Commitments by type</h4>
                  {(() => {
                    const palette = ['#2563eb','#059669','#db2777','#b45309','#7c3aed'];
                    const total = detailedStats.by_type.reduce((s, r) => s + r.total_commitments, 0) || 1;
                    const cx = 90, cy = 90, r = 68, inner = 42;
                    let angle = -Math.PI / 2;
                    const slices = detailedStats.by_type.map((row, i) => {
                      const frac = row.total_commitments / total;
                      const sweep = frac * 2 * Math.PI;
                      const x1 = cx + r * Math.cos(angle);
                      const y1 = cy + r * Math.sin(angle);
                      angle += sweep;
                      const x2 = cx + r * Math.cos(angle);
                      const y2 = cy + r * Math.sin(angle);
                      const ix1 = cx + inner * Math.cos(angle - sweep);
                      const iy1 = cy + inner * Math.sin(angle - sweep);
                      const ix2 = cx + inner * Math.cos(angle);
                      const iy2 = cy + inner * Math.sin(angle);
                      const large = sweep > Math.PI ? 1 : 0;
                      return { row, frac, color: palette[i % palette.length], path:
                        `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z` };
                    });
                    return (
                      <div className="admin-donut-wrap">
                        <svg viewBox="0 0 180 180" className="admin-donut-svg">
                          {slices.map((s, i) => (
                            <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2">
                              <title>{s.row.campus_type}: {s.row.total_commitments}</title>
                            </path>
                          ))}
                          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#111">{total}</text>
                          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#888">total</text>
                        </svg>
                        <div className="admin-donut-legend">
                          {slices.map((s, i) => (
                            <div key={i} className="admin-donut-row">
                              <span className="admin-legend-dot" style={{ background: s.color }} />
                              <span style={{ textTransform: 'capitalize', flex: 1 }}>{s.row.campus_type}</span>
                              <span style={{ fontWeight: 600 }}>{s.row.total_commitments}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
                                ({Math.round(s.frac * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Full-width: By campus table */}
                <div className="card admin-chart-card admin-chart-full">
                  <h4 className="admin-chart-title">By campus</h4>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Campus</th>
                          <th>District</th>
                          <th>Type</th>
                          <th style={{ textAlign: 'right' }}>Committed</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th style={{ textAlign: 'right' }}>Verified</th>
                          <th style={{ textAlign: 'right' }}>Raised</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedStats.by_campus.map((row, i) => (
                          <tr key={row.campus_id} className={i % 2 === 1 ? 'admin-table-alt' : ''}>
                            <td style={{ fontWeight: 500 }}>{row.campus_name}</td>
                            <td>{row.district}</td>
                            <td style={{ textTransform: 'capitalize' }}>{row.campus_type}</td>
                            <td style={{ textAlign: 'right' }}>{row.total_commitments}</td>
                            <td style={{ textAlign: 'right' }}>{formatRupee(row.total_amount_committed || 0)}</td>
                            <td style={{ textAlign: 'right', color: '#059669', fontWeight: 600 }}>{row.verified_contributors ?? 0}</td>
                            <td style={{ textAlign: 'right', color: '#b45309', fontWeight: 600 }}>{formatRupee(row.verified_amount_total || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="empty-state">
                <div className="icon">📈</div>
                <h3>No stats available</h3>
                <p>Stats will appear once commitments are recorded.</p>
              </div>
            )}
          </div>
        )}

        {/* Campuses Tab */}
        {activeTab === 'campuses' && (
          <div className="admin-campuses-grid">
            {/* Add Campus Form */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                ➕ Add New Campus
              </h3>
              <form
                onSubmit={handleAddCampus}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--space-4)',
                  alignItems: 'end',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Campus Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCampus.name}
                    onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">District</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newCampus.district}
                    onChange={(e) => setNewCampus({ ...newCampus, district: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Type</label>
                  <select
                    className="form-input"
                    value={newCampus.type}
                    onChange={(e) => setNewCampus({ ...newCampus, type: e.target.value })}
                  >
                    <option value="engineering">Engineering</option>
                    <option value="nursing">Nursing</option>
                    <option value="polytechnic">Polytechnic</option>
                    <option value="arts_science">Arts & Science</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={creatingCampus || !newCampus.name}>
                  {creatingCampus ? 'Adding...' : 'Add Campus'}
                </button>
              </form>
            </div>

            {/* List Active Campuses */}
            <div className="card admin-campuses-table-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0 }}>
                  Active Campuses <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({adminCampuses.length})</span>
                </h3>
              </div>
              {campusLoading ? (
                <div className="skeleton" style={{ height: '200px' }} />
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Campus name</th>
                        <th>District</th>
                        <th>Type</th>
                        <th>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminCampuses.map((c, i) => (
                        <tr key={c.campus_id} className={i % 2 === 1 ? 'admin-table-alt' : ''}>
                          <td style={{ fontWeight: 500 }}>{c.campus_name}</td>
                          <td>{c.district}</td>
                          <td style={{ textTransform: 'capitalize' }}>{c.campus_type}</td>
                          <td>
                            <span className={`tier-badge tier-${c.tier}`} style={{ fontSize: 'var(--text-xs)' }}>
                              {c.tier}
                            </span>
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                }}
              >
                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Bulk Import CSV</h4>
                <a href="/csv-template.csv" download className="btn btn-secondary btn-sm">
                  📥 Download CSV Template
                </a>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
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
                {uploadingCsv && (
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)' }}>Uploading...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment / Bank Details tab */}
        {activeTab === 'payment' && (
          <div className="admin-payment-grid">
            {/* Edit form */}
            <div className="card admin-form-card">
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                💳 Bank &amp; Payment details
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                These details are shown on the homepage and Pay page. Save to update them instantly across the site.
              </p>
              {paymentLoading ? (
                <div className="skeleton" style={{ height: '420px' }} />
              ) : paymentSettings ? (
                <form onSubmit={handleSavePaymentSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Account name (beneficiary)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Syam Kumar"
                        value={paymentSettings.account_name}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, account_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bank name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. State Bank of India"
                        value={paymentSettings.bank_name}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Account number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 1234567890123"
                        value={paymentSettings.account_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, account_number: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">IFSC code</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. SBIN0001234"
                        value={paymentSettings.ifsc_code}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, ifsc_code: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">UPI ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. name@upi"
                        value={paymentSettings.upi_id}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, upi_id: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* QR code upload */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">UPI QR code image</label>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                      {paymentSettings.qr_code_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={paymentSettings.qr_code_url}
                          alt="QR preview"
                          style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#fff' }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <input
                          ref={qrInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={handleQrUpload}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => qrInputRef.current?.click()}
                          disabled={qrUploading}
                        >
                          {qrUploading ? 'Uploading...' : paymentSettings.qr_code_url ? '🔄 Replace QR image' : '📤 Upload QR image'}
                        </button>
                        {paymentSettings.qr_code_url && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ marginLeft: 'var(--space-2)', color: 'var(--accent-red)' }}
                            onClick={() => setPaymentSettings({ ...paymentSettings, qr_code_url: '' })}
                          >
                            Remove
                          </button>
                        )}
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                          JPG, PNG or WebP, max 2 MB. Shown on Pay page.
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                    <input
                      type="checkbox"
                      checked={paymentSettings.screenshot_mandatory}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, screenshot_mandatory: e.target.checked })}
                    />
                    Require payment screenshot when submitting UTR
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                    <input
                      type="checkbox"
                      checked={paymentSettings.one_verified_per_phone}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, one_verified_per_phone: e.target.checked })}
                    />
                    Limit to one commitment per phone number (uncheck to allow multiple commitments &amp; payments)
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={paymentSaving} style={{ alignSelf: 'flex-start' }}>
                    {paymentSaving ? 'Saving...' : '💾 Save payment settings'}
                  </button>
                </form>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load settings.</p>
              )}
            </div>

            {/* Live preview - mirrors the trust-block dark card users see on Pay page */}
            {paymentSettings && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  Live preview — as shown to users
                </div>
                <div className="trust-block" style={{ textAlign: 'left', padding: 'var(--space-6)', borderRadius: '16px', maxWidth: '340px' }}>
                  <h4 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-1)', color: '#fff' }}>💳 Campaign Account</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.55)', marginBottom: 'var(--space-3)' }}>
                    Pay directly via UPI or Bank Transfer
                  </p>
                  <div className="account-details" style={{ maxWidth: '100%' }}>
                    {paymentSettings.upi_id && (
                      <div className="account-row">
                        <span className="account-row-label">UPI ID</span>
                        <span className="account-row-value">{paymentSettings.upi_id}</span>
                      </div>
                    )}
                    {paymentSettings.account_name && (
                      <div className="account-row">
                        <span className="account-row-label">Name</span>
                        <span className="account-row-value">{paymentSettings.account_name}</span>
                      </div>
                    )}
                    {paymentSettings.account_number && (
                      <div className="account-row">
                        <span className="account-row-label">A/C Number</span>
                        <span className="account-row-value">{paymentSettings.account_number}</span>
                      </div>
                    )}
                    {paymentSettings.ifsc_code && (
                      <div className="account-row">
                        <span className="account-row-label">IFSC</span>
                        <span className="account-row-value">{paymentSettings.ifsc_code}</span>
                      </div>
                    )}
                    {paymentSettings.bank_name && (
                      <div className="account-row">
                        <span className="account-row-label">Bank</span>
                        <span className="account-row-value">{paymentSettings.bank_name}</span>
                      </div>
                    )}
                    {paymentSettings.qr_code_url && (
                      <div className="account-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span className="account-row-label">UPI QR</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paymentSettings.qr_code_url}
                          alt="UPI QR Code"
                          style={{ maxWidth: 160, height: 'auto', borderRadius: 'var(--radius-sm)', marginTop: 'var(--space-2)', background: '#fff', padding: '4px' }}
                        />
                      </div>
                    )}
                    {!paymentSettings.upi_id && !paymentSettings.account_number && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                        No details set yet. Fill in the form and save.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
        </div>
      </main>

      {/* Commitment Detail Modal */}
      {detailCommitment && (
        <div className="modal-overlay" onClick={() => { setDetailCommitment(null); setAdminUtr(''); setCommitmentHistory([]); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Commitment details</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setDetailCommitment(null); setAdminUtr(''); setCommitmentHistory([]); }} aria-label="Close">✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>ID</span><br /><code style={{ fontSize: 'var(--text-xs)' }}>{detailCommitment.id}</code></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Name</span><br /><strong>{detailCommitment.full_name}</strong></div>
              {detailCommitment.email != null && detailCommitment.email !== '' && (
                <div><span style={{ color: 'var(--text-muted)' }}>Email</span><br />{detailCommitment.email}</div>
              )}
              <div><span style={{ color: 'var(--text-muted)' }}>Phone</span><br />****{detailCommitment.phone?.slice(-4)}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Amount</span><br /><strong style={{ color: 'var(--accent-gold)' }}>₹{detailCommitment.amount_committed}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Campus</span><br />{detailCommitment.campuses?.name}{detailCommitment.campuses?.district ? `, ${detailCommitment.campuses.district}` : ''}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Status</span><br /><span className={`status-badge status-${detailCommitment.status}`}>{detailCommitment.status.replace(/_/g, ' ')}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Committed at</span><br />{new Date(detailCommitment.committed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>UTR</span><br />{detailCommitment.utr_number ? <code>{detailCommitment.utr_number}</code> : '-'}</div>
              {detailCommitment.utr_submitted_at && <div><span style={{ color: 'var(--text-muted)' }}>UTR submitted at</span><br />{new Date(detailCommitment.utr_submitted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
              {detailCommitment.verified_at && <div><span style={{ color: 'var(--text-muted)' }}>Verified at</span><br />{new Date(detailCommitment.verified_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
              {detailCommitment.rejection_reason && <div><span style={{ color: 'var(--text-muted)' }}>Rejection reason</span><br /><span style={{ color: 'var(--accent-red)' }}>{detailCommitment.rejection_reason}</span></div>}
              {detailCommitment.screenshot_url && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Screenshot</span><br />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setScreenshotModal(detailCommitment.screenshot_url!); setDetailCommitment(null); }}>🖼️ View file</button>
                </div>
              )}
            </div>
            {/* Activity timeline */}
            <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                Activity log
              </div>
              {historyLoading ? (
                <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />
              ) : commitmentHistory.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No activity recorded yet.</p>
              ) : (
                <div className="commitment-timeline">
                  {commitmentHistory.map((entry, i) => {
                    const isReject = entry.action === 'REJECT_COMMITMENT';
                    const isVerify = entry.action === 'VERIFY_COMMITMENT';
                    const isResubmit = entry.action === 'RESUBMIT_UTR';
                    const isSubmit = entry.action === 'SUBMIT_UTR';
                    const icon = isVerify ? '✅' : isReject ? '❌' : isResubmit ? '🔄' : isSubmit ? '📤' : '📝';
                    const color = isVerify ? '#059669' : isReject ? '#dc2626' : isResubmit ? '#2563eb' : '#6b7280';
                    const label = isVerify ? 'Verified' : isReject ? 'Rejected' : isResubmit ? 'UTR resubmitted' : isSubmit ? 'UTR submitted' : entry.action.replace(/_/g, ' ');
                    return (
                      <div key={entry.id ?? i} className="commitment-timeline-item">
                        <div className="commitment-timeline-dot" style={{ background: color }}>
                          <span style={{ fontSize: '10px' }}>{icon}</span>
                        </div>
                        <div className="commitment-timeline-body">
                          <div style={{ fontWeight: 600, fontSize: '13px', color }}>
                            {label}
                          </div>
                          {entry.reason && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
                              Reason: {entry.reason}
                            </div>
                          )}
                          {isResubmit && entry.after_json?.utr_number && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              New UTR: <code style={{ fontSize: '11px' }}>{String(entry.after_json.utr_number)}</code>
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {new Date(entry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin set UTR when no UTR and status allows resubmit */}
            {(detailCommitment.status === 'COMMITTED' || detailCommitment.status === 'REJECTED') && !detailCommitment.utr_number && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                <label className="form-label">Add UTR (on behalf of user)</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="UTR / transaction reference (min 6 chars)"
                    value={adminUtr}
                    onChange={(e) => setAdminUtr(e.target.value)}
                    minLength={6}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleAdminSubmitUtr} disabled={submittingUtr || adminUtr.trim().length < 6}>
                    {submittingUtr ? '...' : 'Submit UTR'}
                  </button>
                </div>
              </div>
            )}
            {/* Verify / Reject */}
            {(detailCommitment.status === 'PENDING_VERIFICATION' || detailCommitment.status === 'FLAGGED') && (
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => { setRejectId(detailCommitment.id); setDetailCommitment(null); }}
                  disabled={actionLoading === detailCommitment.id}
                >
                  ✕ Reject
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleVerify(detailCommitment.id)}
                  disabled={actionLoading === detailCommitment.id}
                >
                  {actionLoading === detailCommitment.id ? '...' : '✓ Verify'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setRejectId(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
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
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-3)',
                wordBreak: 'break-all',
              }}
            >
              File: {screenshotModal}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Preview uses Supabase Storage bucket &quot;screenshots&quot;
            </p>
            <button
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => setScreenshotModal(null)}
            >
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
