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

  const shareText = `I just committed ₹${amount} for Syam Kumar to fly for India 🇮🇳 via ${
    campusName || 'my campus'
  }! Join the #LetHimFly campaign!`;
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}&hashtags=LetHimFly`;

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
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          📣 Spread the Word
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            justifyContent: 'center',
          }}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{ background: '#25D366', color: '#fff' }}
          >
            WhatsApp
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{ background: '#1DA1F2', color: '#fff' }}
          >
            𝕏 Twitter
          </a>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '#LetHimFly', text: shareText, url: shareUrl });
              } else {
                navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                alert('Link copied to clipboard!');
              }
            }}
          >
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Share Card Canvas */}
      {fullName && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            🖼️ Your Personal Share Card
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Download this and share on your Instagram story!
          </p>
          <ShareCardCanvas 
            fullName={fullName} 
            amount={amount} 
            campusName={campusName || 'Direct Commitment'} 
            commitmentId={commitmentId} 
          />
        </div>
      )}

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
