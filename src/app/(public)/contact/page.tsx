import type { Metadata } from 'next';
import { ContactSection } from '@/components/sections/Interactive';
import { PageHero } from '@/components/sections/sections';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const site = await getSite();
  return (
    <>
      <PageHero eyebrow="Contact" title="Contact Us" subtitle="Questions about membership or fees? Send us a message or drop by." />
      <ContactSection settings={site.settings} />
    </>
  );
}
