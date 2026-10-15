import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="page-hero" style={{ minHeight: '70vh', display: 'grid', alignItems: 'center' }}>
        <div className="container">
          <h1>404</h1>
          <p style={{ marginBottom: 24 }}>We could not find that page.</p>
          <Link href="/" className="btn">Back to home</Link>
        </div>
      </main>
    </>
  );
}
