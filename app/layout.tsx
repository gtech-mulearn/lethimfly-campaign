import { Syne, DM_Sans } from 'next/font/google';
import type { Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommitModal from '@/components/CommitModal';
import ScrollReveal from '@/components/ScrollReveal';
import SessionWatcher from '@/components/SessionWatcher';
import { Suspense } from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: '#LetHimFly - Help Syam Kumar S Represent India 🇮🇳',
  description:
    'Join your campus to help Syam Kumar S represent India at the 2026 International Indoor Para Skydiving Championship. Commit ₹1 (1 Rupee Challenge), pay directly, get verified.',
  keywords: [
    'LetHimFly',
    'Syam Kumar',
    'para skydiving',
    'India',
    'campus campaign',
    'mulearn',
  ],
  openGraph: {
    title: '#LetHimFly - Help Syam Kumar S Represent India',
    description:
      'Join your campus to help Syam Kumar S represent India at the 2026 International Indoor Para Skydiving Championship.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable}`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SessionWatcher />
        <Header />
        <main id="main-content" className="page-content" tabIndex={-1}>{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <CommitModal />
        </Suspense>
        <ScrollReveal />
      </body>
    </html>
  );
}
