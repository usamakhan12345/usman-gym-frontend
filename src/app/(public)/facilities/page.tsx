import type { Metadata } from 'next';
import { CtaBand, Facilities, PageHero } from '@/components/sections/sections';

export const metadata: Metadata = { title: 'Facilities' };

export default function FacilitiesPage() {
  return (
    <>
      <PageHero eyebrow="Facilities" title="Our Facilities" subtitle="Everything you need to train properly, in one clean and well-equipped space." />
      <Facilities />
      <CtaBand />
    </>
  );
}
