import type { Metadata } from 'next';
import { Gallery } from '@/components/sections/Interactive';
import { PageHero } from '@/components/sections/sections';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const site = await getSite();
  return (
    <>
      <PageHero eyebrow="Gallery" title="Gym Gallery" subtitle="A look at our equipment, training zones and community." />
      <section className="section">
        <div className="container"><Gallery images={site.gallery} /></div>
      </section>
    </>
  );
}
