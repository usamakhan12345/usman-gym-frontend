import Link from 'next/link';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { InstallApp } from '@/components/pwa/InstallApp';
import { Brand, NAV_LINKS } from './shared';

const svg = (d: string) => function Icon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
};
// Simple brand glyphs (lucide-react no longer ships brand icons)
const Facebook = svg('M13.5 21v-8h2.7l.5-3.2h-3.2V7.7c0-.9.3-1.6 1.7-1.6h1.6V3.2C16.5 3.1 15.6 3 14.6 3c-2.4 0-4 1.4-4 4.1v2.7H8v3.2h2.6v8h2.9z');
const Instagram = svg('M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM12 3c-2.4 0-2.7 0-3.7.1-2.9.1-4.2 1.5-4.4 4.4C3.8 8.4 3.8 8.6 3.8 12s0 3.6.1 4.5c.2 2.9 1.5 4.3 4.4 4.4 1 .1 1.3.1 3.7.1s2.7 0 3.7-.1c2.9-.1 4.2-1.5 4.4-4.4.1-1 .1-1.1.1-4.5s0-3.6-.1-4.5c-.2-2.9-1.5-4.3-4.4-4.4C14.7 3 14.4 3 12 3zm0 1.7c2.4 0 2.6 0 3.6.1 2.1.1 3 1.1 3.1 3.1.1 1 .1 1.2.1 3.6s0 2.6-.1 3.6c-.1 2-1 3-3.1 3.1-1 .1-1.2.1-3.6.1s-2.6 0-3.6-.1c-2.1-.1-3-1.1-3.1-3.1-.1-1-.1-1.2-.1-3.6s0-2.6.1-3.6c.1-2 1-3 3.1-3.1 1-.1 1.2-.1 3.6-.1z');
const Youtube = svg('M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3L10 15z');
const Twitter = svg('M17.800 3h3.100l-6.800 7.700L22 21h-6.200l-4.900-6.300L5.300 21H2.200l7.300-8.300L2 3h6.400l4.400 5.800L17.800 3zm-1.100 16.200h1.700L7.400 4.700H5.600l11.100 14.500z');

export function Footer({ settings }: { settings: SiteSettings }) {
  const { contact, social, general } = settings;
  const socials = [
    { href: social.facebook, label: 'Facebook', Icon: Facebook },
    { href: social.instagram, label: 'Instagram', Icon: Instagram },
    { href: social.youtube, label: 'YouTube', Icon: Youtube },
    { href: social.twitter, label: 'Twitter', Icon: Twitter },
  ].filter((s) => s.href);

  return (
    <footer className="footer">
      <div className="footer__grid">
        <div>
          <Brand />
          <p style={{ marginTop: 'var(--space-4)' }}>{general.description}</p>
          {socials.length > 0 && (
            <div className="footer__social">
              {socials.map(({ href, label, Icon }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"><Icon size={18} /></a>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul>
            {NAV_LINKS.map((l) => (<li key={l.href}><Link href={l.href}>{l.label}</Link></li>))}
            <li><Link href="/login">Member Login</Link></li>
            <li><InstallApp variant="outline" label="Install the app" /></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><MapPin size={16} /><span>{contact.address}</span></li>
            <li><Phone size={16} /><a href={`tel:${contact.phone.replace(/\s/g, '')}`}>{contact.phone}</a></li>
            <li><Mail size={16} /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
          </ul>
        </div>
        <div>
          <h4>Opening Hours</h4>
          <ul>
            {contact.hours.map((h) => (
              <li key={h.label}><Clock size={16} /><span><strong style={{ color: 'var(--white)' }}>{h.label}</strong><br />{h.time}</span></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="footer__bottom">&copy; {new Date().getFullYear()} {general.gymName}. All rights reserved.</div>
    </footer>
  );
}
