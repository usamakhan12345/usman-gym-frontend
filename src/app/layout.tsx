import type { Metadata, Viewport } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { PwaRegister } from '@/components/pwa/PwaRegister';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import '@/styles/globals.scss';

const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Usman Gym - Build Strength. Build Discipline.', template: '%s | Usman Gym' },
  description: 'Usman Gym: modern strength and cardio facilities, expert coaching and an online member portal for your monthly membership.',
  applicationName: 'Usman Gym',
  icons: { icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { url: '/icon.svg', type: 'image/svg+xml' }], apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }] },
  appleWebApp: { capable: true, title: 'Usman Gym', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
};

// viewport-fit=cover lets the app draw under the notch; the CSS adds safe-area padding.
export const viewport: Viewport = { themeColor: '#0a0a0b', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body>
        <PwaRegister />
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
