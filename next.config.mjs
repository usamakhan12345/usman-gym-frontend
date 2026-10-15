/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig = {
  // Lets a production build live beside the dev server (NEXT_DIST_DIR=.next-prod npm run build).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  // The browser only ever talks to the Next.js origin; /api and /uploads are proxied to the Express backend.
  // This keeps the session cookie first-party and avoids CORS/CSRF surprises.
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  async headers() {
    return [
      // The service worker must always be re-checked so updates ship immediately.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/manifest.webmanifest', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] },
    ];
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  sassOptions: { quietDeps: true },
};

export default nextConfig;
