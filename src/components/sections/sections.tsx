import Link from 'next/link';
import { Award, Check, Dumbbell, HeartPulse, Info, Lock, Quote, Target, Trophy, UserCheck, Users, Weight, Zap, Eye } from 'lucide-react';
import { LinkButton } from '@/components/ui';
import { aboutImage, facilities, heroImage, testimonials, trainers } from '@/lib/static-content';
import { money } from '@/lib/format';
import type { Plan, SiteSettings } from '@/lib/types';

const ICONS = { dumbbell: Dumbbell, heart: HeartPulse, weight: Weight, user: UserCheck, zap: Zap, lock: Lock };

export function PageHero({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <section className="page-hero">
      <div className="container">
        {eyebrow && <span className="eyebrow" style={{ color: 'var(--yellow-500)' }}>{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="section__head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Hero({ settings }: { settings: SiteSettings }) {
  const [first, ...rest] = settings.general.tagline.split('. ');
  return (
    <section className="hero">
      <div className="hero__bg" style={{ backgroundImage: `url(${heroImage})` }} role="img" aria-label="Athletes training in a gym" />
      <div className="hero__inner">
        <div className="hero__content">
          <span className="eyebrow">Welcome to {settings.general.gymName}</span>
          <h1>
            {first}{rest.length > 0 ? '.' : ''}
            {rest.length > 0 && <span>{rest.join('. ')}</span>}
          </h1>
          <p className="hero__lead">{settings.general.description}</p>
          <div className="hero__cta">
            <LinkButton href="/signup" size="lg">Join Now</LinkButton>
            <LinkButton href="/facilities" variant="outline" size="lg">Explore Facilities</LinkButton>
          </div>
          <div className="hero__stats">
            <div><strong>500+</strong><span>Members</span></div>
            <div><strong>20+</strong><span>Machines</span></div>
            <div><strong>6</strong><span>Training zones</span></div>
            <div><strong>7 days</strong><span>Open weekly</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About({ full }: { full?: boolean }) {
  return (
    <section className="section">
      <div className="container split">
        <div className="about-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={aboutImage} alt="Open training floor with racks and machines" loading="lazy" />
          <div className="about-img__badge"><strong>10+</strong><span>Years of coaching</span></div>
        </div>
        <div>
          <span className="eyebrow">About Us</span>
          <h2>Train hard. Stay consistent. Get results.</h2>
          <p>
            Usman Gym was built on a simple idea: a gym should be a place where discipline is easy. Clean equipment,
            honest coaching and a community that shows up every day.
          </p>
          <div className="mv-grid">
            <div><h3><Target size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />Mission</h3><p>Make quality strength and fitness training accessible, safe and motivating for everyone.</p></div>
            <div><h3><Eye size={18} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />Vision</h3><p>Be the most trusted training community in our city, known for results and respect.</p></div>
          </div>
          <ul className="checklist">
            <li><Check size={18} />Experienced, certified trainers with 10+ years of coaching</li>
            <li><Check size={18} />Philosophy: progressive overload, proper form and consistency over shortcuts</li>
            <li><Check size={18} />Programs for beginners, athletes and everyone in between</li>
          </ul>
          {!full && <p style={{ marginTop: 'var(--space-5)' }}><LinkButton href="/about" variant="dark">Learn more</LinkButton></p>}
        </div>
      </div>
    </section>
  );
}

export function Benefits() {
  const items = [
    { Icon: Trophy, title: 'Real Results', text: 'Structured programming that helps you progress month after month.' },
    { Icon: Users, title: 'Supportive Community', text: 'Train alongside people who push and respect each other.' },
    { Icon: Award, title: 'Certified Coaches', text: 'Learn proper technique to lift safely and effectively.' },
    { Icon: HeartPulse, title: 'Healthy Lifestyle', text: 'Build energy, confidence and habits that last.' },
  ];
  return (
    <section className="section section--dark">
      <div className="container">
        <SectionHead eyebrow="Why Usman Gym" title="Benefits of training with us">Everything you need to commit to your fitness, under one roof.</SectionHead>
        <div className="benefits">
          {items.map(({ Icon, title, text }) => (
            <div key={title} className="benefit"><Icon size={38} /><h3>{title}</h3><p>{text}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Facilities({ limit }: { limit?: number }) {
  const list = limit ? facilities.slice(0, limit) : facilities;
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Facilities" title="Equipment built for performance">Modern machines, heavy-duty racks and dedicated zones for every kind of training.</SectionHead>
        <div className="cards-grid">
          {list.map((f) => {
            const Icon = ICONS[f.icon as keyof typeof ICONS];
            return (
              <article key={f.title} className="facility">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="facility__img" src={f.image} alt="" loading="lazy" />
                <div className="facility__body">
                  <span className="facility__icon"><Icon size={24} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </article>
            );
          })}
        </div>
        {limit && <p className="text-center" style={{ marginTop: 'var(--space-6)' }}><LinkButton href="/facilities" variant="dark">All facilities</LinkButton></p>}
      </div>
    </section>
  );
}

export function MembershipPlans({ plans, note }: { plans: Plan[]; note: string }) {
  return (
    <section className="section section--gray">
      <div className="container">
        <SectionHead eyebrow="Membership" title="Simple monthly plans">Pay monthly directly at the gym. No online payment is needed to enquire.</SectionHead>
        {plans.length === 0 ? (
          <p className="text-center text-muted">Membership plans will be available soon. Please contact the gym for current fees.</p>
        ) : (
          <div className="plans">
            {plans.map((p) => (
              <article key={p.id} className={`plan${p.isFeatured ? ' plan--featured' : ''}`}>
                {p.isFeatured && <span className="plan__flag">Most popular</span>}
                <h3>{p.name}</h3>
                <p className="plan__desc">{p.description}</p>
                <div className="plan__price"><small>Rs.</small>{Number(p.monthlyFee).toLocaleString('en-PK')}<span> / month</span></div>
                <ul>{p.features.map((f) => (<li key={f}><Check size={18} />{f}</li>))}</ul>
                <LinkButton href="/contact" variant={p.isFeatured ? 'primary' : 'dark'} block>Enquire about {p.name}</LinkButton>
              </article>
            ))}
          </div>
        )}
        <div className="notice"><Info size={20} /><p>{note}</p></div>
      </div>
    </section>
  );
}

export function Trainers() {
  return (
    <section className="section">
      <div className="container">
        <SectionHead eyebrow="Our Coaches" title="Meet the trainers">Sample trainer profiles - replace names, photos and bios with your real team.</SectionHead>
        <div className="trainers">
          {trainers.map((t, i) => (
            <article key={i} className="trainer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.image} alt="" loading="lazy" />
              <h3>{t.name}</h3>
              <span>{t.role}</span>
              <p>{t.bio}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="section section--dark">
      <div className="container">
        <SectionHead eyebrow="Testimonials" title="What members say" />
        <div className="testimonials">
          {testimonials.map((t, i) => (
            <figure key={i} className="testimonial" style={{ margin: 0 }}>
              <Quote className="quote" size={30} />
              <p>{t.text}</p>
              <footer><div><strong>{t.name}</strong><small>{t.since}</small></div></footer>
            </figure>
          ))}
        </div>
        <p className="demo-note">Sample content for demonstration only - these are not verified customer reviews.</p>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="section section--yellow">
      <div className="container cta-band">
        <h2>Ready to start?</h2>
        <p>Visit the gym or create your account today and start tracking your membership online.</p>
        <LinkButton href="/signup" variant="dark" size="lg">Join Now</LinkButton>
        {' '}
        <Link href="/contact" className="btn btn--outline-dark btn--lg">Contact us</Link>
      </div>
    </section>
  );
}
