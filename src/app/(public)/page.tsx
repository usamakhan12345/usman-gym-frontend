import { FaqList, Gallery } from '@/components/sections/Interactive';
import { About, Benefits, CtaBand, Facilities, Hero, MembershipPlans, SectionHead, Testimonials, Trainers } from '@/components/sections/sections';
import { getSite } from '@/lib/site';

export default async function HomePage() {
  const site = await getSite();
  return (
    <>
      <Hero settings={site.settings} />
      <About />
      <Facilities limit={3} />
      <Benefits />
      <MembershipPlans plans={site.plans} note={site.settings.membership.note} />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Gallery" title="Inside the gym" />
          <Gallery images={site.gallery.slice(0, 6)} />
        </div>
      </section>
      <Trainers />
      <Testimonials />
      <section className="section section--gray">
        <div className="container">
          <SectionHead eyebrow="FAQs" title="Common questions" />
          <FaqList faqs={site.faqs.slice(0, 5)} />
        </div>
      </section>
      <CtaBand />
    </>
  );
}
