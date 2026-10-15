import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/membership', label: 'Membership' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/contact', label: 'Contact' },
];

export function Brand({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="Usman Gym home">
      <span className="brand__mark"><Dumbbell size={22} strokeWidth={2.6} /></span>
      <span>Usman <span className="accent">Gym</span></span>
    </Link>
  );
}
