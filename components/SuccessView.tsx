'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ShareCardCanvas from '@/components/ShareCardCanvas';

export default function SuccessView() {
  const searchParams = useSearchParams();
  const commitmentId = searchParams?.get('id') || '';
  const campusName = searchParams?.get('campus') || '';
  const amount = searchParams?.get('amount') || '1';
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    if (commitmentId) {
      fetch(`/api/v1/commitments/lookup?id=${commitmentId}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.full_name) {
            setFullName(data.full_name);
          }
        })
        .catch(() => {});
    }
  }, [commitmentId]);

  const CAMPAIGN_URL = 'https://lethimfly.mulearn.org';
  const shareText = `I just committed ₹${amount} to help Syam Kumar fly for India 🇮🇳 from ${
    campusName || 'my campus'
  }!\n\nJoin the #LetHimFly campaign 👇`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${CAMPAIGN_URL}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(CAMPAIGN_URL)}&hashtags=LetHimFly,MuLearn`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(CAMPAIGN_URL)}&summary=${encodeURIComponent(shareText)}`;

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: '#LetHimFly', text: shareText, url: CAMPAIGN_URL }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText}\n${CAMPAIGN_URL}`);
    }
  };

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-16)',
        maxWidth: '680px',
        textAlign: 'center',
      }}
    >
      <div
        style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', animation: 'float 3s ease infinite' }}
      >
        🪂
      </div>

      <h1 className="section-title">You&apos;re Committed!</h1>
      <p className="section-subtitle">Thank you for supporting Syam&apos;s dream to fly for India</p>

      {/* Commitment Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', textAlign: 'left' }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}
        >
          <div>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Commitment ID
            </span>
            <p
              style={{
                fontFamily: 'monospace',
                fontSize: 'var(--text-sm)',
                color: 'var(--accent-primary)',
                wordBreak: 'break-all',
              }}
            >
              {commitmentId}
            </p>
          </div>
          <span className="status-badge status-COMMITTED">COMMITTED</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Amount</span>
            <p style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>₹{amount}</p>
          </div>
          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Campus</span>
            <p style={{ fontWeight: 600 }}>{campusName || '-'}</p>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          📣 Spread the Word
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          Tag your friends and challenge them to commit too!
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-sm" style={{ background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-sm" style={{ background: '#000', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            𝕏 Twitter
          </a>
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
            className="btn btn-sm" style={{ background: '#0A66C2', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleNativeShare}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            More
          </button>
        </div>
      </div>

      {/* Share Card Canvas — always shown, renders once fullName loads */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          🖼️ Your #LetHimFly Card
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          Download and share on your story. Let the world know you&apos;re part of this!
        </p>
        {fullName ? (
          <ShareCardCanvas
            fullName={fullName}
            amount={amount}
            campusName={campusName || 'Kerala'}
            commitmentId={commitmentId}
          />
        ) : (
          <div className="skeleton" style={{ height: '340px', borderRadius: '16px' }} />
        )}
      </div>

      {/* Next Steps */}
      <div
        className="card"
        style={{ background: 'var(--gradient-card)', borderColor: 'var(--accent-primary)' }}
      >
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
          ⚡ Next Step: Pay & Submit UTR
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Transfer ₹{amount} to the campaign account, then submit your transaction reference (UTR)
          and screenshot for verification.
        </p>
        <Link
          href={`/pay?commitment=${commitmentId}`}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          Proceed to Payment →
        </Link>
      </div>

      <p
        style={{
          marginTop: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
        }}
      >
        Save your Commitment ID to track your verification status anytime.
      </p>
    </div>
  );
}
