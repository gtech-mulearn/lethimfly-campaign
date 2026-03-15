import { Suspense } from 'react';
import { Metadata } from 'next';
import CampusesView from '@/components/CampusesView';

export const metadata: Metadata = {
  title: 'Browse Campuses | #LetHimFly 🏫',
  description: 'Search for your college and join your classmates in supporting Syam Kumar.',
};

export default function CampusesPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
          <div className="campus-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
      }
    >
      <CampusesView />
    </Suspense>
  );
}
