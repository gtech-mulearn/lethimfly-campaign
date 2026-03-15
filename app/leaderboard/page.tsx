import LeaderboardView from '@/components/LeaderboardView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campus Leaderboard | #LetHimFly 🏆',
  description: 'Top campuses leading the #LetHimFly campaign support for Syam Kumar.',
};

async function getLeaderboardVisible(): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/campaign`, { next: { revalidate: 30, tags: ['campaign-settings'] } });
    if (!res.ok) return true;
    const data = await res.json();
    return data.leaderboard_visible !== false;
  } catch {
    return true;
  }
}

export default async function LeaderboardPage() {
  const visible = await getLeaderboardVisible();

  if (!visible) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔒</div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
            Leaderboard is locked
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
            The campus leaderboard is temporarily hidden. Check back soon to see how your campus is ranking!
          </p>
        </div>
      </main>
    );
  }

  return <LeaderboardView />;
}
