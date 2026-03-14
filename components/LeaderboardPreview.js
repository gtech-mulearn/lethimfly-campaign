import Link from 'next/link';

export default function LeaderboardPreview({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🏆</div>
        <h3>No campuses yet</h3>
        <p>Be the first to commit and put your campus on the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Campus</th>
            <th>Verified</th>
            <th>Amount</th>
            <th>Tier</th>
          </tr>
        </thead>
        <tbody className="stagger">
          {data.map((campus) => (
            <tr key={campus.campus_id || campus.rank}>
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
                  {campus.district}
                </div>
              </td>
              <td style={{ fontWeight: 700 }}>
                {campus.verified_contributors.toLocaleString()}
              </td>
              <td style={{ color: 'var(--accent-gold)' }}>
                ₹{campus.verified_amount_total.toLocaleString()}
              </td>
              <td>
                <span className={`tier-badge tier-${campus.tier}`}>
                  {campus.tier}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
