import Link from 'next/link';
import MetricsStrip from '@/components/MetricsStrip';
import FAQ from '@/components/FAQ';
import { CampaignInfo, Commitment } from '@/types';

async function getCampaignData(): Promise<CampaignInfo | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/campaign`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getGlobalCommitments(): Promise<
  Array<{ id: string; full_name: string; amount_committed: number; created_at: string; campus_name: string }>
> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/v1/commitments/public`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return (await res.json()) || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [campaign, recentCommitments] = await Promise.all([
    getCampaignData(),
    getGlobalCommitments(),
  ]);

  return (
    <>
      {/* ═══════════════════════════════════════════
          HERO — Bento Grid with Campaign Goals
          Headline left, goal cards right, viewport fit
          ═══════════════════════════════════════════ */}
      <section className="hero-bento">
        <div className="hero-bento-inner">
          {/* LEFT: Headline + CTA */}
          <div className="hero-bento-text">
            <h1 className="hero-bento-headline animate-fade-in-up">
              Let him<br />fly.
            </h1>

            <p className="hero-bento-desc animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Support Syam Kumar — from 16 surgeries to the edge of a world record. Commit ₹100 to help him represent India.
            </p>

            <div className="hero-bento-cta-row animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <Link href="?commit=true" scroll={false} className="hero-bento-cta">
                Fund his dream
                <span className="hero-bento-cta-arrow">→</span>
              </Link>
              <div className="hero-bento-avatars">
                <div className="hero-avatar" style={{ background: 'var(--accent-primary)' }}>S</div>
                <div className="hero-avatar" style={{ background: '#111', color: '#fff' }}>K</div>
                <div className="hero-avatar" style={{ background: '#e8e4de' }}>M</div>
                <span className="hero-avatar-count">+728</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Bento card grid */}
          <div className="hero-bento-grid">
            {/* Card 1: Large image card */}
            <div className="hero-goal-card hero-goal-tall hero-goal-image">
              <img
                src="./pictureofsyam_.webp"
                alt="Syam Kumar"
                className="hero-goal-img"
              />
              <div className="hero-goal-img-label">
                <span>Syam Kumar</span>
                <small>Para Skydiver</small>
              </div>
            </div>

            {/* Card 2: Goal text card — yellow */}
            <div className="hero-goal-card hero-goal-yellow">
              <h3>45,000 ft</h3>
              <p>World record skydive attempt — higher than any para athlete has ever jumped.</p>
            </div>

            {/* Card 3: Image card — person */}
            <div className="hero-goal-card hero-goal-peach">
              <img
                src="./wingsuit-flying.webp"
                alt="Wingsuit Flying"
                className="hero-goal-img"
              />
              <div className="hero-goal-img-label">
                <span>Wingsuit</span>
                <small>Pilot Training</small>
              </div>
            </div>

            {/* Card 4: Goal text card — light */}
            <div className="hero-goal-card hero-goal-light">
              <h3>Represent India</h3>
              <p>At the 2026 International Indoor Para Skydiving Championship. Be part of history.</p>
            </div>

            {/* Card 5: Image card */}
            <div className="hero-goal-card hero-goal-image">
              <img
                src="https://images.unsplash.com/photo-1474623809196-26c1d33457cc?q=80&w=400&auto=format&fit=crop"
                alt="Skydiving"
                className="hero-goal-img"
              />
              <div className="hero-goal-img-label">
                <span>16 Surgeries</span>
                <small>Zero Limits</small>
              </div>
            </div>

            {/* Card 6: Goal text — dark */}

          </div>
        </div>

        {/* Trust line at bottom */}
        <div className="hero-trust-line animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          JOURNEY / STATS — Bento Grid Layout
          Large headline wrapping around cards
          ═══════════════════════════════════════════ */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container">
          <span className="section-label">— THE STORY</span>

          <div className="journey-bento">
            {/* Row 1: Headline area + Dark image card */}
            <div className="journey-bento-headline reveal">
              <h2>
                WITNESS THE{' '}
                <span className="journey-bento-headline-journey">JOURNEY</span>{' '}
                <span className="journey-pill-inline">
                  <span>From</span>
                </span>{' '}
                BIOLOGICAL MUTINY TO{' '}
                <span style={{ color: 'var(--accent-primary)' }}>SKY MASTERY</span>
              </h2>
            </div>

            {/* Dark image card — top right */}
            <div className="journey-bento-image-card reveal reveal-delay-1">
              <span className="journey-bento-image-label">The Story</span>
              <img
                src="./syam-and-basil-joseph.webp"
                alt="Syam Kumar Profile"
                className="journey-bento-img"
              />
              <p className="journey-bento-image-desc">
                From 16 surgeries to setting a world record. The story of relentless determination.
              </p>
            </div>

            {/* Circular decorative badge */}
            <div className="journey-bento-circle reveal reveal-delay-2">
              <div className="journey-circle-inner">
                <span className="journey-circle-icon">✦</span>
              </div>
              <svg className="journey-circle-text" viewBox="0 0 200 200">
                <defs>
                  <path id="circlePath" d="M 100,100 m -75,0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
                </defs>
                <text>
                  <textPath href="#circlePath" style={{ fontSize: '11px', letterSpacing: '3.5px', fill: '#555' }}>
                    A LIFE ABOVE LIMITS • DEFY GRAVITY • A LIFE ABOVE LIMITS •
                  </textPath>
                </text>
              </svg>
            </div>

            {/* Description card — yellow accent */}
            <div className="journey-bento-desc-card reveal reveal-delay-2">
              <div className="journey-bento-tags">
                <span>Skydiving</span>
                <span>Wingsuit</span>
                <span>World Record</span>
              </div>
              <h3>Unstoppable</h3>
              <p>
                Syam Kumar defied every medical prognosis to become India&apos;s first para skydiver
                aiming for a 45,000ft world record. Your support fuels the impossible.
              </p>
              <Link href="?commit=true" scroll={false} className="journey-bento-arrow" aria-label="Fund his dream">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </Link>
            </div>

            {/* Stat cards — bottom row */}
            <div className="journey-bento-stat reveal reveal-delay-1">
              <span className="journey-bento-stat-number">16</span>
              <span className="journey-bento-stat-label">Surgeries</span>
            </div>

            <div className="journey-bento-stat journey-bento-stat-accent reveal reveal-delay-2">
              <span className="journey-bento-stat-number">100+</span>
              <span className="journey-bento-stat-label">Solo Skydives</span>
            </div>

            <div className="journey-bento-stat reveal reveal-delay-3">
              <span className="journey-bento-stat-number">42K</span>
              <span className="journey-bento-stat-label">Feet — Wingsuit</span>
            </div>

            <div className="journey-bento-stat journey-bento-stat-cta reveal reveal-delay-4">
              <Link href="?commit=true" scroll={false} style={{ color: '#000', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>CLICK TO FUND</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          VIDEO TESTIMONIALS — REF 3 (BloomFi dark cards)
          ═══════════════════════════════════════════ */}
      <section
        className="section"
        style={{ background: 'var(--bg-primary)', position: 'relative', zIndex: 1 }}
      >
        <div className="container">
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            — TESTIMONIALS
          </span>

          {/* Editorial pull quote — REF 3 */}
          <p
            className="reveal"
            style={{
              maxWidth: '700px',
              margin: '0 auto var(--space-10)',
              fontSize: '20px',
              fontWeight: 500,
              color: 'var(--text-body)',
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            These testimonials showcase Syam&apos;s incredible journey from medical trauma to sky
            mastery. Each video tells a part of the story that proves human potential has no ceiling.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {[
              'The Medical Journey: From Hospital Bed to Sky',
              'First Solo Skydive: Defying Gravity',
              'The Wingsuit Dream: 42,000 Feet',
            ].map((title, i) => (
              <div key={i} className="video-card reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="video-thumb">
                  <div className="play-btn-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent-primary)">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <p className="video-card-title">{title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          METRICS STRIP — REF 2 + REF 6
          Dark bento grid
          ═══════════════════════════════════════════ */}
      <section
        className="section"
        style={{ background: 'var(--bg-primary)', paddingTop: 0 }}
      >
        <div className="container">
          <MetricsStrip campaign={campaign} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS — REF 3 (BloomFi bento) + REF 4 (Emblov grid)
          Dotted path, outlined step numbers
          ═══════════════════════════════════════════ */}
      <section className="section" id="how-it-works" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            — HOW IT WORKS
          </span>
          <h2 className="section-title reveal" style={{ textAlign: 'center' }}>
            How It Works
          </h2>
          <p className="section-subtitle reveal" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto var(--space-10)' }}>
            Three simple steps to support Syam&apos;s dream
          </p>

          <div className="steps-grid">
            <div className="step-card reveal">
              <div className="step-number">1</div>
              <h3 className="step-title">Commit</h3>
              <p className="step-desc">
                Choose your campus and commit ₹100 (or any amount). Your commitment is recorded
                instantly.
              </p>
            </div>
            <div className="step-card reveal reveal-delay-1">
              <div className="step-number">2</div>
              <h3 className="step-title">Pay Directly</h3>
              <p className="step-desc">
                Transfer directly to the campaign&apos;s dedicated account via UPI or bank transfer.
                No middlemen.
              </p>
            </div>
            <div className="step-card reveal reveal-delay-2">
              <div className="step-number">3</div>
              <h3 className="step-title">Get Verified</h3>
              <p className="step-desc">
                Submit your UTR + screenshot. Once verified, your campus earns Karma on the
                leaderboard!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST / DIRECT PAYMENT — REF 3 (BloomFi dark card)
          ═══════════════════════════════════════════ */}
      <section className="section" id="trust" style={{ background: 'var(--bg-primary)' }}>
        <div className="container">
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            — TRUST
          </span>

          <div className="trust-block reveal">
            <h3>💳 Direct Payment — No Middlemen</h3>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: 'var(--space-8)',
                maxWidth: '550px',
                margin: '0 auto var(--space-8)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.7,
              }}
            >
              All funds go directly to the campaign&apos;s dedicated account. This platform only
              records your commitment and verifies your payment.
            </p>

            <div className="account-details">
              <div className="account-row">
                <span className="account-row-label">UPI ID</span>
                <span className="account-row-value">
                  {campaign?.account_info?.upi_id || 'To be configured'}
                  <button className="copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Account Name</span>
                <span className="account-row-value">
                  {campaign?.account_info?.account_name || 'To be configured'}
                  <button className="copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Account Number</span>
                <span className="account-row-value">
                  {campaign?.account_info?.account_number || 'To be configured'}
                  <button className="copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">IFSC Code</span>
                <span className="account-row-value">
                  {campaign?.account_info?.ifsc_code || 'To be configured'}
                  <button className="copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Bank</span>
                <span className="account-row-value">
                  {campaign?.account_info?.bank_name || 'To be configured'}
                  <button className="copy-btn" title="Copy">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </span>
              </div>
            </div>

            <p
              style={{
                marginTop: 'var(--space-6)',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: 'var(--text-sm)',
              }}
            >
              After making the payment, come back and submit your UTR for verification.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          GLOBAL COMMITMENT FEED — REF 1 (Armonia rows)
          ═══════════════════════════════════════════ */}
      <section
        className="section"
        style={{
          background: 'var(--bg-primary)',
        }}
      >
        <div className="container" style={{ maxWidth: '800px' }}>
          <div className="live-label" style={{ justifyContent: 'center', width: '100%' }}>
            <span className="live-dot"></span>
            — LIVE FEED
          </div>

          <h2
            className="section-title reveal"
            style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}
          >
            Real-Time Commitments
          </h2>

          <div className="feed-card reveal">
            {recentCommitments.length > 0 ? (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {recentCommitments.map((c, i) => (
                  <div key={c.id} className="feed-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {/* Avatar — yellow gradient circle with initial */}
                      <div className="feed-avatar">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
                          {c.full_name}
                        </div>
                        <div
                          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}
                        >
                          from{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>{c.campus_name}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {' '}
                            •{' '}
                            {new Date(c.created_at).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="feed-amount">
                      ₹{c.amount_committed.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 'var(--space-10)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                No commitments have been verified yet. Be the first to start the momentum!
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <Link
              href="?commit=true"
              scroll={false}
              className="btn btn-primary"
              style={{ padding: 'var(--space-3) var(--space-8)', borderRadius: '100px' }}
            >
              Add Your Name →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════ */}
      <section className="section" id="faq" style={{ background: '#fff' }}>
        <div className="container">
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>
            — FAQ
          </span>
          <h2 className="section-title reveal" style={{ textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          <p className="section-subtitle reveal" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto var(--space-10)' }}>
            Everything you need to know about the campaign
          </p>
          <FAQ />
        </div>
      </section>
    </>
  );
}
