import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { getSite } from '@/lib/site';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer settings={site.settings} />
    </>
  );
}
