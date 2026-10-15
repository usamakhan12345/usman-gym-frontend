import type { Metadata } from 'next';
import { FaqList } from '@/components/sections/Interactive';
import { CtaBand, PageHero } from '@/components/sections/sections';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'FAQs' };

export default async function FaqPage() {
  const site = await getSite();
  return (
    <>
      <PageHero eyebrow="FAQs" title="Frequently Asked Questions" subtitle="Quick answers about hours, fees and monthly payments." />
      <section className="section">
        <div className="container"><FaqList faqs={site.faqs} /></div>
      </section>
      <CtaBand />
    </>
  );
}
