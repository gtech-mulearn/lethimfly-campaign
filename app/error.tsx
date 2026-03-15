'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container" style={{ padding: 'var(--space-16) max(var(--container-padding), var(--safe-left))', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
      <h1 className="section-title">Something went wrong</h1>
      <p className="section-subtitle">We encountered an error while loading this page.</p>
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
        <button onClick={() => reset()} className="btn btn-primary">
          Try Again
        </button>
        <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
          Go Home
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre style={{ marginTop: 'var(--space-8)', textAlign: 'left', background: '#fef2f2', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflow: 'auto', fontSize: 'var(--text-xs)', color: '#991b1b' }}>
          {error.message}
        </pre>
      )}
    </div>
  );
}
