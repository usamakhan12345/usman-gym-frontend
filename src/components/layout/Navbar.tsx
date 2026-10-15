'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { homeFor, useAuth } from '@/context/AuthContext';
import { LinkButton } from '@/components/ui';
import { InstallApp } from '@/components/pwa/InstallApp';
import { Brand, NAV_LINKS } from './shared';

export function Navbar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const cta = (
    <>
      {!loading && user ? (
        <LinkButton href={homeFor(user)} size="sm">{user.role === 'ADMIN' ? 'Admin Dashboard' : 'My Portal'}</LinkButton>
      ) : (
        <>
          <LinkButton href="/login" variant="outline" size="sm">Login</LinkButton>
          <LinkButton href="/signup" size="sm">Join Now</LinkButton>
        </>
      )}
    </>
  );

  return (
    <header className="navbar">
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="navbar__inner">
        <Brand />
        <nav className="navbar__links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`navbar__link${isActive(l.href) ? ' navbar__link--active' : ''}`} aria-current={isActive(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="navbar__cta">{cta}<InstallApp variant="ghost" label="Install" /></div>
        <button className="navbar__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      {open && (
        <nav className="mobile-menu" id="mobile-menu" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={`navbar__link${isActive(l.href) ? ' navbar__link--active' : ''}`}>{l.label}</Link>
          ))}
          <div className="mobile-menu__cta">{cta}<InstallApp variant="outline" size="md" block /></div>
        </nav>
      )}
    </header>
  );
}
