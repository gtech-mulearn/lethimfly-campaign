'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const checkAdmin = async (token: string) => {
      try {
        const res = await fetch('/api/v1/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
      } catch {
        setIsAdmin(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session?.user);
      if (session?.access_token) checkAdmin(session.access_token);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
      if (session?.access_token) checkAdmin(session.access_token);
      else setIsAdmin(false);
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
    // Signal to SessionWatcher that this is a manual logout (not expiry)
    if (typeof window !== 'undefined') sessionStorage.setItem('manual_signout', '1');
    supabase.auth.signOut();
    setMobileOpen(false);
  };

  if (pathname?.startsWith('/admin')) return null;

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
          {isAdmin && (
            <Link href="/admin" className="header-admin-link">
              Admin
            </Link>
          )}
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
          Commit ₹1
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
        {isAdmin && (
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="header-admin-link">
            Admin
          </Link>
        )}
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
          Commit ₹1
        </Link>
      </nav>
    </header>
  );
}
