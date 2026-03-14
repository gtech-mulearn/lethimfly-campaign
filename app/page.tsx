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
      {/* Hero */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(58, 134, 255, 0.4), rgba(58, 134, 255, 0.1)), url('https://images.unsplash.com/photo-1521685150894-3d0d82944b15?q=80&w=2670&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          minHeight: '85vh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {/* Yellow corner blobs */}
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: -50,
            width: 300,
            height: 300,
            background: 'var(--accent-primary)',
            borderRadius: '50%',
            opacity: 0.9,
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            right: -100,
            width: 400,
            height: 400,
            background: 'var(--accent-primary)',
            borderRadius: '50%',
            opacity: 0.9,
            zIndex: 0,
          }}
        ></div>

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2
            style={{ fontSize: 'var(--text-4xl)', fontWeight: 600, color: '#fff', marginBottom: '-10px' }}
            className="animate-fade-in-up"
          >
            Hi, I&apos;m
          </h2>
          <h1
            style={{
              fontSize: 'clamp(4rem, 8vw, 7rem)',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              lineHeight: 1,
              marginBottom: 'var(--space-6)',
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            className="animate-fade-in-up"
          >
            Syam Kumar
          </h1>

          <p
            style={{
              fontSize: 'var(--text-lg)',
              color: '#fff',
              maxWidth: '800px',
              margin: '0 auto var(--space-8)',
              lineHeight: 1.6,
              fontWeight: 500,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              animationDelay: '0.1s',
            }}
            className="animate-fade-in-up"
          >
            From 16 surgeries to setting a world record — support Syam Kumar in becoming the first
            person without a leg to skydive from 45,000 feet and fly as a wingsuit pilot.
          </p>

          <div
            className="animate-fade-in-up"
            style={{ animationDelay: '0.2s', marginBottom: 'var(--space-12)' }}
          >
            <Link
              href="?commit=true"
              scroll={false}
              className="btn btn-primary btn-lg"
              style={{
                borderRadius: '9999px',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem',
                boxShadow: '0 10px 25px rgba(250, 204, 21, 0.4)',
              }}
            >
              Fund my dream
            </Link>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-hand)',
              fontSize: 'clamp(3rem, 6vw, 6rem)',
              color: 'var(--accent-primary)',
              transform: 'rotate(-2deg)',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              animationDelay: '0.3s',
            }}
            className="animate-fade-in-up"
          >
            A Life Above Limits
          </div>
        </div>
      </section>

      {/* Intro & Stats Section */}
      <section className="section" style={{ background: '#fff', position: 'relative', zIndex: 2 }}>
        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--space-8)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* Desktop Layout Grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-8)',
              }}
            >
              {/* Left Column: Stats */}
              <div
                style={{
                  flex: '1',
                  minWidth: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 500,
                }}
              >
                <div>
                  <span style={{ color: 'var(--accent-primary)' }}>16</span> Surgeries
                </div>
                <div>
                  <span style={{ color: 'var(--accent-primary)' }}>100+</span> Solo Skydiving
                </div>
                <div>
                  <span style={{ color: 'var(--accent-primary)' }}>42000ft</span> Wingsuit Flying
                </div>
                <div>Tom Cruise Cliff Jump</div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <Link
                    href="?commit=true"
                    scroll={false}
                    className="btn btn-primary"
                    style={{ borderRadius: '9999px' }}
                  >
                    Fund my dream
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="btn btn-secondary"
                    style={{ borderRadius: '9999px' }}
                  >
                    View all records
                  </Link>
                </div>
              </div>

              {/* Center Column: Image (Placeholder logic) */}
              <div
                style={{
                  flex: '1',
                  minWidth: '300px',
                  display: 'flex',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '80%',
                    height: '110%',
                    background: 'var(--accent-primary)',
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                    zIndex: 0,
                    opacity: 0.8,
                    transform: 'rotate(5deg)',
                  }}
                ></div>
                <img
                  src="https://images.unsplash.com/photo-1544485351-46abcc7bfbf8?q=80&w=800&auto=format&fit=crop"
                  alt="Syam Kumar Profile"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '100%',
                    height: '400px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                  }}
                />
              </div>

              {/* Right Column: Headline */}
              <div style={{ flex: '1', minWidth: '300px' }}>
                <h2
                  style={{
                    fontSize: 'clamp(2rem, 4vw, 3rem)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  Witness The Journey: <br /> From Biological Mutiny to Sky Mastery
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Testimonials */}
      <section
        className="section"
        style={{ background: '#fefce8', position: 'relative', zIndex: 1, paddingBottom: 0 }}
      >
        <div className="container" style={{ textAlign: 'center' }}>
          <p
            style={{
              maxWidth: '850px',
              margin: '0 auto var(--space-8)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: '#000',
              lineHeight: 1.6,
            }}
          >
            These testimonials showcase Syam&apos;s incredible journey from medical trauma to sky
            mastery.
            <br />
            Each video tells a part of the story that proves human potential has no ceiling.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: '24px',
                  padding: 'var(--space-4)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    background: '#9ca3af',
                    borderRadius: '16px',
                    aspectRatio: '16/11',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ opacity: 0.9 }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: '#000',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    margin: 'var(--space-2) 0',
                  }}
                >
                  The Medical Journey: From
                  <br />
                  Hospital Bed to Sky
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <MetricsStrip campaign={campaign} />
        </div>
      </section>

      {/* How it Works */}
      <section className="section" id="how-it-works">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            How It Works
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Three simple steps to support Syam&apos;s dream
          </p>

          <div className="steps-grid stagger">
            <div className="card step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Commit</h3>
              <p className="step-desc">
                Choose your campus and commit ₹100 (or any amount). Your commitment is recorded
                instantly.
              </p>
            </div>
            <div className="card step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Pay Directly</h3>
              <p className="step-desc">
                Transfer directly to the campaign&apos;s dedicated account via UPI or bank transfer.
                No middlemen.
              </p>
            </div>
            <div className="card step-card">
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

      {/* Trust Block */}
      <section className="section" id="trust">
        <div className="container">
          <div className="trust-block">
            <h3>💳 Direct Payment — No Middlemen</h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-6)',
                maxWidth: '550px',
                margin: '0 auto var(--space-6)',
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
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Account Name</span>
                <span className="account-row-value">
                  {campaign?.account_info?.account_name || 'To be configured'}
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Account Number</span>
                <span className="account-row-value">
                  {campaign?.account_info?.account_number || 'To be configured'}
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">IFSC Code</span>
                <span className="account-row-value">
                  {campaign?.account_info?.ifsc_code || 'To be configured'}
                </span>
              </div>
              <div className="account-row">
                <span className="account-row-label">Bank</span>
                <span className="account-row-value">
                  {campaign?.account_info?.bank_name || 'To be configured'}
                </span>
              </div>
            </div>
            <p
              style={{
                marginTop: 'var(--space-6)',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              After making the payment, come back and submit your UTR for verification.
            </p>
          </div>
        </div>
      </section>

      {/* Global Commitment Feed */}
      <section
        className="section"
        style={{
          background: 'var(--bg-glass)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2
            className="section-title"
            style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
          >
            🌟 Real-Time Commitments
          </h2>

          <div
            className="card"
            style={{ padding: 0, overflow: 'hidden', maxHeight: '500px', overflowY: 'auto' }}
          >
            {recentCommitments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentCommitments.map((c, i) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 'var(--space-4)',
                      borderBottom:
                        i < recentCommitments.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 'var(--text-lg)',
                        }}
                      >
                        🪂
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
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
                    <div
                      style={{
                        fontWeight: 800,
                        color: 'var(--accent-green)',
                        fontSize: 'var(--text-lg)',
                      }}
                    >
                      ₹{c.amount_committed.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                No commitments have been verified yet. Be the first to start the momentum!
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Link
              href="?commit=true"
              scroll={false}
              className="btn btn-primary"
              style={{ padding: 'var(--space-3) var(--space-8)' }}
            >
              Add Your Name
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Frequently Asked Questions
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Everything you need to know about the campaign
          </p>
          <FAQ />
        </div>
      </section>
    </>
  );
}
