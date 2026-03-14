'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PayContent() {
  const searchParams = useSearchParams();
  const commitmentId = searchParams.get('commitment');

  const [campaignInfo, setCampaignInfo] = useState(null);
  const [utr, setUtr] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch('/api/v1/campaign')
      .then((r) => r.json())
      .then(setCampaignInfo)
      .catch(() => {});
  }, []);

  const handleFileChange = (file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }
    setScreenshot(file);
    setError('');
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setScreenshotPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setScreenshotPreview('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!commitmentId) {
      setError('Missing commitment ID. Please go back and commit first.');
      return;
    }
    if (!utr || utr.trim().length < 6) {
      setError('Please enter a valid UTR/Transaction reference (min 6 characters)');
      return;
    }
    if (!screenshot) {
      setError('Please upload a screenshot of your payment');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('utr_number', utr.trim());
      formData.append('screenshot_file', screenshot);

      const res = await fetch(`/api/v1/commitments/${commitmentId}/submit-utr`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Submission failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (success) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✅</div>
        <h1 className="section-title">UTR Submitted!</h1>
        <p className="section-subtitle">
          Your payment proof has been submitted for verification. We&apos;ll
          verify it against the campaign account statement.
        </p>
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="status-badge status-PENDING_VERIFICATION" style={{ marginBottom: 'var(--space-3)' }}>
            ⏳ PENDING VERIFICATION
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            You&apos;ll be able to check your verification status anytime using
            your commitment ID or phone number.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={`/track?id=${commitmentId}`} className="btn btn-primary">
            Track My Status
          </a>
          <a href="/leaderboard" className="btn btn-secondary">
            View Leaderboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)', maxWidth: '650px' }}>
      <h1 className="section-title">Pay & Submit Proof</h1>
      <p className="section-subtitle">
        Transfer to the campaign account, then submit your transaction reference
      </p>

      {!commitmentId && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', borderColor: 'var(--accent-red)' }}>
          <p style={{ color: 'var(--accent-red)', fontSize: 'var(--text-sm)' }}>
            ⚠️ No commitment ID found.{' '}
            <a href="/campuses" style={{ textDecoration: 'underline' }}>
              Please commit first
            </a>
          </p>
        </div>
      )}

      {/* Payment Details */}
      <div className="trust-block" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-xl)' }}>💳 Campaign Account</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Pay directly via UPI or Bank Transfer
        </p>
        <div className="account-details">
          {campaignInfo?.account_info?.upi_id && (
            <div className="account-row">
              <span className="account-row-label">UPI ID</span>
              <span className="account-row-value">
                {campaignInfo.account_info.upi_id}
                <button className="copy-btn" onClick={() => copyToClipboard(campaignInfo.account_info.upi_id)}>📋</button>
              </span>
            </div>
          )}
          {campaignInfo?.account_info?.account_name && (
            <div className="account-row">
              <span className="account-row-label">Name</span>
              <span className="account-row-value">{campaignInfo.account_info.account_name}</span>
            </div>
          )}
          {campaignInfo?.account_info?.account_number && (
            <div className="account-row">
              <span className="account-row-label">A/C Number</span>
              <span className="account-row-value">
                {campaignInfo.account_info.account_number}
                <button className="copy-btn" onClick={() => copyToClipboard(campaignInfo.account_info.account_number)}>📋</button>
              </span>
            </div>
          )}
          {campaignInfo?.account_info?.ifsc_code && (
            <div className="account-row">
              <span className="account-row-label">IFSC</span>
              <span className="account-row-value">{campaignInfo.account_info.ifsc_code}</span>
            </div>
          )}
          {campaignInfo?.account_info?.bank_name && (
            <div className="account-row">
              <span className="account-row-label">Bank</span>
              <span className="account-row-value">{campaignInfo.account_info.bank_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* UTR Submission Form */}
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>
          Submit Payment Proof
        </h3>

        <div className="form-group">
          <label className="form-label">UTR / Transaction Reference *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 423198765432 or UPI ref number"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            required
            minLength={6}
          />
          <span className="form-hint">
            Find this in your UPI app under transaction details or your bank SMS
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Payment Screenshot *</label>
          <div
            className={`upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('screenshot-input').click()}
          >
            <div className="upload-icon">📤</div>
            <p className="upload-text">
              <strong>Click to upload</strong> or drag & drop
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              JPG, PNG, or PDF • Max 5MB
            </p>
          </div>
          <input
            id="screenshot-input"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />
          {screenshot && (
            <div className="upload-preview">
              {screenshotPreview ? (
                <img src={screenshotPreview} alt="Preview" />
              ) : (
                <span style={{ fontSize: '1.5rem' }}>📄</span>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{screenshot.name}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {(screenshot.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                className="copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setScreenshot(null);
                  setScreenshotPreview('');
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <p style={{ color: 'var(--accent-red)', fontSize: 'var(--text-sm)' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading || !commitmentId}
        >
          {loading ? 'Submitting...' : '📤 Submit for Verification'}
        </button>
      </form>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ paddingTop: 'var(--space-8)', textAlign: 'center' }}>
        <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
      </div>
    }>
      <PayContent />
    </Suspense>
  );
}
