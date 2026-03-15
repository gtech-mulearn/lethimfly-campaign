import { Suspense } from 'react';
import TrackView from '@/components/TrackView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track My Commitment | #LetHimFly 🔍',
  description: 'Track your commitment status and verification for the #LetHimFly campaign.',
};

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: 'var(--space-8)', textAlign: 'center' }}>
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        </div>
      }
    >
      <TrackView />
    </Suspense>
  );
}
