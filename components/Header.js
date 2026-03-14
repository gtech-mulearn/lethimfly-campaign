'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="header-logo">
          <span className="header-logo-text">
            <span>#LetHimFly</span>
          </span>
        </Link>

        <nav className="header-nav desktop-nav">
          <Link href="/campuses">Campuses</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/track">Track</Link>
        </nav>

        <Link href="?commit=true" scroll={false} className="btn btn-primary btn-sm header-cta">
          Commit ₹100
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <Link href="/campuses" onClick={() => setMobileOpen(false)}>
          Campuses
        </Link>
        <Link href="/leaderboard" onClick={() => setMobileOpen(false)}>
          Leaderboard
        </Link>
        <Link href="/track" onClick={() => setMobileOpen(false)}>
          Track Status
        </Link>
        <Link
          href="?commit=true"
          scroll={false}
          className="btn btn-primary btn-sm"
          onClick={() => setMobileOpen(false)}
          style={{ marginTop: '0.5rem', textAlign: 'center' }}
        >
          Commit ₹100
        </Link>
      </nav>
    </header>
  );
}
