import { PageLoader } from '@/components/ui';

// Shown inside the public layout (navbar stays visible) while the next page is being fetched.
export default function Loading() {
  return <div style={{ minHeight: '60vh', display: 'grid', alignItems: 'center' }}><PageLoader /></div>;
}
