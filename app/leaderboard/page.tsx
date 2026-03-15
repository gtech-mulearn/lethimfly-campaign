import LeaderboardView from '@/components/LeaderboardView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Campus Leaderboard | #LetHimFly 🏆',
  description: 'Top campuses leading the #LetHimFly campaign support for Syam Kumar.',
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
