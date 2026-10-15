import type { Metadata } from 'next';
import { CtaBand, MembershipPlans, PageHero } from '@/components/sections/sections';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Membership' };

export default async function MembershipPage() {
  const site = await getSite();
  return (
    <>
      <PageHero eyebrow="Membership" title="Membership Plans" subtitle="Transparent monthly pricing. Pay at the gym and track everything online." />
      <MembershipPlans plans={site.plans} note={site.settings.membership.note} />
      <CtaBand />
    </>
  );
}
