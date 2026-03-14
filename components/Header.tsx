'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session?.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.href : undefined },
    });
  };

  const handleLogout = () => {
    const supabase = createClient();
    supabase.auth.signOut();
    setMobileOpen(false);
  };

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
          <Link href="/track">My commitments</Link>
          {signedIn ? (
            <button type="button" onClick={handleLogout} className="header-auth-btn">
              Log out
            </button>
          ) : (
            <button type="button" onClick={handleLogin} className="header-auth-btn">
              Log in
            </button>
          )}
        </nav>

        <Link href="?commit=true" scroll={false} className="btn btn-primary btn-sm header-cta">
          Commit ₹100
        </Link>

        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav
        id="mobile-nav"
        className={`mobile-nav ${mobileOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
        hidden={!mobileOpen}
      >
        <Link href="/campuses" onClick={() => setMobileOpen(false)}>
          Campuses
        </Link>
        <Link href="/leaderboard" onClick={() => setMobileOpen(false)}>
          Leaderboard
        </Link>
        <Link href="/track" onClick={() => setMobileOpen(false)}>
          My commitments
        </Link>
        {signedIn ? (
          <button type="button" onClick={handleLogout} className="header-auth-btn">
            Log out
          </button>
        ) : (
          <button type="button" onClick={handleLogin} className="header-auth-btn">
            Log in
          </button>
        )}
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
