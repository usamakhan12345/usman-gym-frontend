import type { MetadataRoute } from 'next';

/** Web app manifest: makes the site installable ("Add to Home screen") and launch like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Usman Gym',
    short_name: 'Usman Gym',
    description: 'Check your gym membership, monthly fee status and payment history, and upload payment screenshots.',
    // Members mostly want their portal; the guard sends signed-out users to the login page and admins to their dashboard.
    start_url: '/member/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    lang: 'en',
    categories: ['fitness', 'health', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Monthly fees', short_name: 'Fees', url: '/member/fees', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Payment history', short_name: 'Payments', url: '/member/payments', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
