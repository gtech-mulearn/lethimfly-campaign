'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Mounted in the root layout.
 * - Silently refreshes the token when Supabase fires TOKEN_REFRESHED.
 * - Shows a non-blocking banner when the session expires while the user was signed in.
 * - The banner has a "Sign in" button that triggers Google OAuth.
 */
export default function SessionWatcher() {
  const [showBanner, setShowBanner] = useState(false);
  const wasSignedIn = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Seed initial state silently
    supabase.auth.getSession().then(({ data: { session } }) => {
      wasSignedIn.current = !!session?.user;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        wasSignedIn.current = true;
        setShowBanner(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        const isManual = typeof window !== 'undefined' && sessionStorage.getItem('manual_signout') === '1';
        if (typeof window !== 'undefined') sessionStorage.removeItem('manual_signout');
        // Only show the banner if the session expired (not a manual logout)
        if (wasSignedIn.current && !isManual) {
          setShowBanner(true);
        }
        wasSignedIn.current = false;
        return;
      }

      if (session) wasSignedIn.current = true;
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = () => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.href : undefined },
    });
  };

  if (!showBanner) return null;

  return (
    <div className="session-expired-banner" role="alert" aria-live="assertive">
      <span className="session-expired-icon">🔒</span>
      <span className="session-expired-msg">Your session has expired.</span>
      <button type="button" className="session-expired-btn" onClick={handleSignIn}>
        Sign in again
      </button>
      <button
        type="button"
        className="session-expired-dismiss"
        onClick={() => setShowBanner(false)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
