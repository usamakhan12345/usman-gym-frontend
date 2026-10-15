import type { Metadata } from 'next';
import { About, Benefits, CtaBand, PageHero, Trainers } from '@/components/sections/sections';

export const metadata: Metadata = { title: 'About Us' };

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="About Usman Gym" subtitle="Our story, our mission and the coaching philosophy behind every session." />
      <About full />
      <Benefits />
      <Trainers />
      <CtaBand />
    </>
  );
}
