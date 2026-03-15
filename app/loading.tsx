export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
      <div className="skeleton skeleton-title" style={{ margin: '0 auto var(--space-4) auto' }} />
      <div className="skeleton" style={{ height: '300px', maxWidth: '800px', margin: '0 auto' }} />
    </div>
  );
}
