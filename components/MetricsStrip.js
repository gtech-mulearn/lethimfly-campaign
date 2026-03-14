'use client';

export default function MetricsStrip({ campaign }) {
  const formatAmount = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const getDaysLeft = () => {
    if (!campaign?.end_at) return '—';
    const now = new Date();
    const end = new Date(campaign.end_at);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="metrics-strip stagger">
      <div className="metric-card">
        <div className="metric-value gold">
          {formatAmount(campaign?.verified_amount_total || 0)}
        </div>
        <div className="metric-label">Total Raised (Verified)</div>
      </div>
      <div className="metric-card">
        <div className="metric-value green">
          {(campaign?.verified_contributors_total || 0).toLocaleString()}
        </div>
        <div className="metric-label">Verified Contributors</div>
      </div>
      <div className="metric-card">
        <div className="metric-value pink">
          {(campaign?.pending_verification_total || 0).toLocaleString()}
        </div>
        <div className="metric-label">Pending Verification</div>
      </div>
      <div className="metric-card">
        <div className="metric-value blue">{getDaysLeft()}</div>
        <div className="metric-label">Days Left</div>
      </div>
    </div>
  );
}
