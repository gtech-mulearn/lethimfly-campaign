import { Suspense } from 'react';
import SuccessView from '@/components/SuccessView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commitment Successful | #LetHimFly 🪂',
  description: 'Thank you for your commitment to the #LetHimFly campaign!',
};

export default function CommitSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
          <div className="skeleton skeleton-title" style={{ margin: '0 auto' }} />
        </div>
      }
    >
      <SuccessView />
    </Suspense>
  );
}
