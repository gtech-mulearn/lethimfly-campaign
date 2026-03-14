import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CommitModal from '@/components/CommitModal';
import { Suspense } from 'react';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: '#LetHimFly — Help Syam Kumar S Represent India 🇮🇳',
  description:
    'Join your campus to help Syam Kumar S represent India at the 2026 International Indoor Para Skydiving Championship. Commit ₹100, pay directly, get verified.',
  keywords: [
    'LetHimFly',
    'Syam Kumar',
    'para skydiving',
    'India',
    'campus campaign',
    'mulearn',
  ],
  openGraph: {
    title: '#LetHimFly — Help Syam Kumar S Represent India',
    description:
      'Join your campus to help Syam Kumar S represent India at the 2026 International Indoor Para Skydiving Championship.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Header />
        <main className="page-content">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <CommitModal />
        </Suspense>
      </body>
    </html>
  );
}
