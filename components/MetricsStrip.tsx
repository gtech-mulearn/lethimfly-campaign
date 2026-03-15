'use client';

import Link from 'next/link';
import { CampaignInfo } from '@/types';

export default function MetricsStrip({ campaign }: { campaign?: CampaignInfo | null }) {
  const formatAmount = (amount?: number) => {
    if (!amount) return '₹0';
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  const getDaysLeft = () => {
    if (!campaign?.end_at) return 0;
    const now = new Date();
    const end = new Date(campaign.end_at);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysLeft = getDaysLeft();
  const totalDays = 90;
  const progress = Math.min((daysLeft / totalDays) * 100, 100);
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="metrics-strip stagger">
      {/* Total Raised - wider card */}
      <div className="metric-card">
        <div className="metric-value gold">{formatAmount(campaign?.verified_amount_total || 0)}</div>
        <div className="metric-label">Total Raised (Verified)</div>
      </div>

      {/* Verified Contributors */}
      <div className="metric-card">
        <div className="metric-value gold">
          {(campaign?.verified_contributors_total || 0).toLocaleString()}
        </div>
        <div className="metric-label">Verified Contributors</div>
      </div>

      {/* Pending */}
      <div className="metric-card">
        <div className="metric-value gold">
          {(campaign?.pending_verification_total || 0).toLocaleString()}
        </div>
        <div className="metric-label">Pending Verification</div>
      </div>

      {/* Days Left - with SVG ring */}
      <div className="metric-card" style={{ position: 'relative' }}>
        <svg className="days-left-ring" viewBox="0 0 44 44">
          <circle className="track" cx="22" cy="22" r="18" />
          <circle
            className="progress"
            cx="22"
            cy="22"
            r="18"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="metric-value gold">{daysLeft || '-'}</div>
        <div className="metric-label">Days Left</div>
      </div>

      {/* Round CTA cell - REF 6 */}
      <Link href="?commit=true" scroll={false} className="metric-cta-cell">
        Commit ₹1 →
      </Link>
    </div>
  );
}
